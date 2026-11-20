import { PRNG } from './prng.js';
import { round3, roundVec3, distXZ, dist3D, normalizeXZ } from './math.js';
import { TUNING, WORLD } from './constants.js';

export class Sim {
  constructor(options = {}) {
    this.seed = options.seed !== undefined ? options.seed : 42;
    this.prng = new PRNG(this.seed);
    this.night = options.night !== undefined ? options.night : 1;
    this.tuning = options.tuning || TUNING;
    this.world = WORLD;

    this.tick = 0;
    this.state = 'playing'; // 'playing' | 'won' | 'lost'
    this.reason = null;     // null | 'all_lit' | 'no_flames' | 'dawn'
    this.time_left_s = this.tuning.night1_duration_s;
    this.score = 0;

    // Track statistics
    this.total_motes_picked = 0;
    this.mote_counter = 0;
    this.shade_counter = 0;

    // Player state
    this.player = {
      pos: [0, 0, 0],
      carried: 0,
      flames: this.tuning.flames,
      invuln_timer: 0,
      pulse_cooldown: 0
    };

    // Prev inputs for edge detection
    this.prev_interact = false;
    this.prev_pulse = false;

    // Setup Lanterns (L1..L5 on 25m circle, L1 at [0, 0, 25])
    this.lanterns = [];
    for (let i = 0; i < this.tuning.lantern_count_night1; i++) {
      const angle = (i * 2 * Math.PI) / this.tuning.lantern_count_night1;
      const x = round3(this.world.lantern_ring_radius * Math.sin(angle));
      const z = round3(this.world.lantern_ring_radius * Math.cos(angle));
      this.lanterns.push({
        id: `L${i + 1}`,
        pos: [x, 0, z],
        lit: false,
        deposited: 0
      });
    }

    // Entity collections
    this.motes = [];
    this.shades = [];

    // Pending events emitted during current tick
    this.pendingEvents = [];

    // Apply Scenario if supplied
    this.applyScenario(options.scenario);
  }

  applyScenario(sc) {
    if (!sc) {
      this.initDefaultEntities(true, true);
      return;
    }

    if (sc.time_left_s !== undefined) {
      this.time_left_s = sc.time_left_s;
    }

    if (sc.player) {
      if (sc.player.pos) this.player.pos = [...sc.player.pos];
      if (sc.player.carried !== undefined) this.player.carried = sc.player.carried;
      if (sc.player.flames !== undefined) this.player.flames = sc.player.flames;
    }

    if (sc.lanterns) {
      for (const scL of sc.lanterns) {
        const l = this.lanterns.find((item) => item.id === scL.id);
        if (l) {
          if (scL.pos) l.pos = [...scL.pos];
          if (scL.lit !== undefined) l.lit = scL.lit;
          if (scL.deposited !== undefined) l.deposited = scL.deposited;
          if (l.lit && l.deposited < this.tuning.lantern_cost) {
            l.deposited = this.tuning.lantern_cost;
          }
        }
      }
    }

    const randomMotes = sc.random_motes !== undefined ? sc.random_motes : sc.motes === undefined;
    const randomShades = sc.random_shades !== undefined ? sc.random_shades : sc.shades === undefined;

    if (sc.motes) {
      for (const p of sc.motes) {
        this.mote_counter++;
        this.motes.push({
          id: `M${this.mote_counter}`,
          pos: [...p]
        });
      }
    }

    if (sc.shades) {
      for (const s of sc.shades) {
        this.shade_counter++;
        this.shades.push({
          id: s.id || `S${this.shade_counter}`,
          pos: s.pos ? [...s.pos] : [30, 0, 0],
          state: 'chase',
          stun_timer: 0
        });
      }
    }

    this.initDefaultEntities(randomMotes, randomShades);
  }

  initDefaultEntities(randomMotes, randomShades) {
    // Generate default random motes if enabled and none present
    if (randomMotes && this.motes.length === 0) {
      for (let i = 0; i < this.world.initial_motes_count; i++) {
        this.mote_counter++;
        const angle = this.prng.next() * 2 * Math.PI;
        const radius = this.prng.nextFloat(this.world.mote_inner_radius, this.world.mote_outer_radius);
        this.motes.push({
          id: `M${this.mote_counter}`,
          pos: [
            round3(radius * Math.sin(angle)),
            0.5,
            round3(radius * Math.cos(angle))
          ]
        });
      }
    }

    // Generate default shades if enabled and none present
    if (randomShades && this.shades.length === 0) {
      for (let i = 0; i < this.world.initial_shades_count; i++) {
        this.shade_counter++;
        const angle = (i * Math.PI) + (this.prng.next() * 0.5);
        this.shades.push({
          id: `S${this.shade_counter}`,
          pos: [
            round3(this.world.shade_spawn_radius * Math.sin(angle)),
            0,
            round3(this.world.shade_spawn_radius * Math.cos(angle))
          ],
          state: 'chase',
          stun_timer: 0
        });
      }
    }

    this.random_motes = randomMotes;
    this.random_shades = randomShades;
  }

  emit(name, data) {
    this.pendingEvents.push({
      type: 'event',
      tick: this.tick,
      name,
      data
    });
  }

  step(input = {}) {
    if (this.state !== 'playing') {
      return [];
    }

    this.tick++;
    this.pendingEvents = [];
    const dt = this.world.dt;

    // 1. Timers
    if (this.player.invuln_timer > 0) {
      this.player.invuln_timer = Math.max(0, this.player.invuln_timer - dt);
    }
    if (this.player.pulse_cooldown > 0) {
      this.player.pulse_cooldown = Math.max(0, this.player.pulse_cooldown - dt);
    }
    for (const shade of this.shades) {
      if (shade.state === 'stunned') {
        shade.stun_timer = Math.max(0, shade.stun_timer - dt);
        if (shade.stun_timer <= 0) {
          shade.state = 'chase';
        }
      }
    }

    // 2. Input edge detection
    const interactEdge = !!input.interact && !this.prev_interact;
    const pulseEdge = !!input.pulse && !this.prev_pulse;
    this.prev_interact = !!input.interact;
    this.prev_pulse = !!input.pulse;

    // 3. Player Movement
    let mx = 0;
    let mz = 0;
    if (Array.isArray(input.move)) {
      mx = Math.max(-1, Math.min(1, input.move[0] || 0));
      mz = Math.max(-1, Math.min(1, input.move[1] || 0));
    }

    // Normalize if magnitude > 1
    const moveMag = Math.sqrt(mx * mx + mz * mz);
    if (moveMag > 1.0) {
      mx /= moveMag;
      mz /= moveMag;
    }

    // Rotate by camera yaw if provided (degrees)
    if (input.cam_yaw_deg !== undefined && input.cam_yaw_deg !== 0) {
      const rad = (input.cam_yaw_deg * Math.PI) / 180;
      const cosA = Math.cos(rad);
      const sinA = Math.sin(rad);
      const rx = mx * cosA - mz * sinA;
      const rz = mx * sinA + mz * cosA;
      mx = rx;
      mz = rz;
    }

    // Apply speed
    const stepDist = this.tuning.player_speed * dt;
    this.player.pos[0] += mx * stepDist;
    this.player.pos[2] += mz * stepDist;

    // Island circular barrier check
    const distCenter = Math.sqrt(this.player.pos[0] ** 2 + this.player.pos[2] ** 2);
    if (distCenter > this.world.island_radius) {
      const ratio = this.world.island_radius / distCenter;
      this.player.pos[0] *= ratio;
      this.player.pos[2] *= ratio;
    }
    this.player.pos[0] = round3(this.player.pos[0]);
    this.player.pos[2] = round3(this.player.pos[2]);

    // 4. Pickup Motes
    const remainingMotes = [];
    for (const mote of this.motes) {
      const d = distXZ(this.player.pos, mote.pos);
      if (d <= this.tuning.pickup_radius && this.player.carried < this.tuning.carry_capacity) {
        this.player.carried++;
        this.total_motes_picked++;
        this.score += this.tuning.score.per_mote;
        this.emit('mote_picked', {
          id: mote.id,
          carried: this.player.carried,
          total_picked: this.total_motes_picked
        });
      } else {
        remainingMotes.push(mote);
      }
    }
    this.motes = remainingMotes;

    // 5. Deposit to Nearest Unlit Lantern
    if (interactEdge && this.player.carried > 0) {
      let nearestLantern = null;
      let minDist = Infinity;
      for (const l of this.lanterns) {
        if (!l.lit) {
          const d = distXZ(this.player.pos, l.pos);
          if (d <= this.tuning.interact_radius && d < minDist) {
            minDist = d;
            nearestLantern = l;
          }
        }
      }

      if (nearestLantern) {
        const needed = this.tuning.lantern_cost - nearestLantern.deposited;
        const depositAmt = Math.min(this.player.carried, needed);
        if (depositAmt > 0) {
          this.player.carried -= depositAmt;
          nearestLantern.deposited += depositAmt;
          this.emit('deposit', {
            id: nearestLantern.id,
            deposited: depositAmt,
            total_deposited: nearestLantern.deposited
          });

          if (nearestLantern.deposited >= this.tuning.lantern_cost) {
            nearestLantern.lit = true;
            this.score += this.tuning.score.per_lantern;
            const litCount = this.lanterns.filter((l) => l.lit).length;
            this.emit('lantern_lit', {
              id: nearestLantern.id,
              lit_count: litCount
            });
          }
        }
      }
    }

    // 6. Pulse
    if (pulseEdge && this.player.carried >= this.tuning.pulse_cost && this.player.pulse_cooldown <= 0) {
      this.player.carried -= this.tuning.pulse_cost;
      this.player.pulse_cooldown = this.tuning.pulse_cooldown_s;

      const stunnedIds = [];
      for (const shade of this.shades) {
        const d = distXZ(this.player.pos, shade.pos);
        if (d <= this.tuning.pulse_radius) {
          shade.state = 'stunned';
          shade.stun_timer = this.tuning.pulse_stun_s;
          // Push away from player
          const [dirX, dirZ] = normalizeXZ(shade.pos[0] - this.player.pos[0], shade.pos[2] - this.player.pos[2]);
          shade.pos[0] += dirX * this.tuning.pulse_push_m;
          shade.pos[2] += dirZ * this.tuning.pulse_push_m;
          shade.pos[0] = round3(shade.pos[0]);
          shade.pos[2] = round3(shade.pos[2]);

          this.score += this.tuning.score.per_stun;
          stunnedIds.push(shade.id);
        }
      }

      this.emit('pulse', {
        carried: this.player.carried,
        stunned_ids: stunnedIds
      });
    }

    // 7. Shades AI (Chase & Safe Zone Avoidance)
    const litLanterns = this.lanterns.filter((l) => l.lit);
    for (const shade of this.shades) {
      if (shade.state === 'chase') {
        const [dirX, dirZ] = normalizeXZ(this.player.pos[0] - shade.pos[0], this.player.pos[2] - shade.pos[2]);
        const nextX = shade.pos[0] + dirX * this.tuning.shade_speed * dt;
        const nextZ = shade.pos[2] + dirZ * this.tuning.shade_speed * dt;

        // Check if next pos enters safe radius of any lit lantern
        let safeViolation = false;
        for (const l of litLanterns) {
          const d = distXZ([nextX, 0, nextZ], l.pos);
          if (d < this.tuning.safe_radius) {
            safeViolation = true;
            // Push out to safe_radius boundary
            const [outX, outZ] = normalizeXZ(nextX - l.pos[0], nextZ - l.pos[2]);
            shade.pos[0] = round3(l.pos[0] + outX * this.tuning.safe_radius);
            shade.pos[2] = round3(l.pos[2] + outZ * this.tuning.safe_radius);
            break;
          }
        }

        if (!safeViolation) {
          shade.pos[0] = round3(nextX);
          shade.pos[2] = round3(nextZ);
        }
      }
    }

    // 8. Shade Collisions with Player
    if (this.player.invuln_timer <= 0) {
      for (const shade of this.shades) {
        if (shade.state === 'chase') {
          const d = distXZ(this.player.pos, shade.pos);
          if (d <= this.tuning.shade_hit_radius) {
            this.player.flames--;
            this.player.invuln_timer = this.tuning.invuln_s;
            const dropped = Math.floor(this.player.carried * this.tuning.hit_drop_ratio);
            this.player.carried -= dropped;

            this.emit('player_hit', {
              shade_id: shade.id,
              flames_left: this.player.flames,
              dropped_motes: dropped
            });
            break; // max 1 hit per tick
          }
        }
      }
    }

    // 9. Periodic Spawn
    if (this.random_shades && this.tick % this.world.shade_spawn_interval_ticks === 0) {
      if (this.shades.length < this.world.max_shades_count) {
        this.shade_counter++;
        const angle = this.prng.next() * 2 * Math.PI;
        const newShade = {
          id: `S${this.shade_counter}`,
          pos: [
            round3(this.world.shade_spawn_radius * Math.sin(angle)),
            0,
            round3(this.world.shade_spawn_radius * Math.cos(angle))
          ],
          state: 'chase',
          stun_timer: 0
        };
        this.shades.push(newShade);
        this.emit('shade_spawned', {
          id: newShade.id,
          pos: [...newShade.pos]
        });
      }
    }

    if (this.random_motes && this.tick % this.world.mote_respawn_interval_ticks === 0) {
      if (this.motes.length < this.world.initial_motes_count) {
        this.mote_counter++;
        const angle = this.prng.next() * 2 * Math.PI;
        const radius = this.prng.nextFloat(this.world.mote_inner_radius, this.world.mote_outer_radius);
        this.motes.push({
          id: `M${this.mote_counter}`,
          pos: [
            round3(radius * Math.sin(angle)),
            0.5,
            round3(radius * Math.cos(angle))
          ]
        });
      }
    }

    // 10. Clock update
    this.time_left_s = Math.max(0, this.time_left_s - dt);

    // 11. Check Game Over
    const allLit = this.lanterns.every((l) => l.lit);
    if (allLit) {
      this.state = 'won';
      this.reason = 'all_lit';
      const timeBonus = Math.floor(this.time_left_s) * this.tuning.score.per_second_left;
      const flameBonus = this.player.flames * this.tuning.score.per_flame_left;
      this.score += timeBonus + flameBonus;
      this.emit('game_over', {
        state: this.state,
        reason: this.reason,
        final_score: this.score
      });
    } else if (this.player.flames <= 0) {
      this.state = 'lost';
      this.reason = 'no_flames';
      this.emit('game_over', {
        state: this.state,
        reason: this.reason,
        final_score: this.score
      });
    } else if (this.time_left_s <= 0) {
      this.state = 'lost';
      this.reason = 'dawn';
      this.emit('game_over', {
        state: this.state,
        reason: this.reason,
        final_score: this.score
      });
    }

    return this.pendingEvents;
  }

  getSnapshot() {
    return {
      type: 'snapshot',
      tick: this.tick,
      sim_tick: this.tick,
      state: this.state,
      time_left_s: round3(this.time_left_s),
      score: this.score,
      player: {
        pos: roundVec3(this.player.pos),
        flames: this.player.flames,
        carried: this.player.carried
      },
      lanterns: this.lanterns.map((l) => ({
        id: l.id,
        pos: roundVec3(l.pos),
        lit: l.lit,
        deposited: l.deposited
      })),
      shades: this.shades.map((s) => ({
        id: s.id,
        pos: roundVec3(s.pos),
        state: s.state
      })),
      motes_active: this.motes.length,
      motes: this.motes.map((m) => ({
        id: m.id,
        pos: roundVec3(m.pos)
      }))
    };
  }

  getEnd() {
    return {
      type: 'end',
      ticks: this.tick,
      sim_ticks: this.tick,
      state: this.state,
      reason: this.reason,
      final_score: this.score
    };
  }
}
