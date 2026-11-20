import { PRNG } from './prng.js';
import { round3, roundVec3, distXZ, dist3D, normalizeXZ } from './math.js';
import { TUNING, MAPS } from './constants.js';

export class Sim {
  constructor(options = {}) {
    this.seed = options.seed !== undefined ? options.seed : 42;
    this.prng = new PRNG(this.seed);
    this.night = options.night !== undefined ? options.night : 1;
    this.tuning = options.tuning || TUNING;
    this.map = MAPS[this.night] || MAPS[1];

    this.tick = 0;
    this.sim_tick = 0;
    this.state = 'playing'; // 'playing' | 'paused' | 'won' | 'lost'
    this.reason = null;     // null | 'all_lit' | 'no_flames' | 'dawn'
    this.paused = false;

    // Time setup
    const duration = this.night === 1
      ? this.tuning.night1_duration_s
      : this.night === 2
      ? this.tuning.night2_duration_s
      : this.tuning.night3_duration_s;
    this.time_left_s = duration;
    this.score = 0;

    // Wind (Night 3)
    this.wind = {
      active: false,
      dir_deg: 0,
      timer: 0,
      direction_vec: [0, 0]
    };

    // Statistics
    this.total_motes_picked = 0;
    this.mote_counter = 0;
    this.shade_counter = 0;
    this.drifter_counter = 0;

    // Player state v1.1
    this.player = {
      pos: [...this.map.spawn_player],
      vel: [0, 0, 0],
      carried: 0,
      flames: this.tuning.flames,
      grounded: true,
      facing_dir: [0, 1], // +Z facing
      invuln_ticks: 0,
      dash_timer_ticks: 0,
      dash_cd_ticks: 0,
      dash_dir: [0, 1],
      pulse_cd_ticks: 0,
      charm_ticks: 0,
      respawn_delay_ticks: 0,
      ballistic_horiz: false // true when launched by jump pad until landed
    };

    // Edge tracking
    this.prev_interact = false;
    this.prev_pulse = false;
    this.prev_dash = false;
    this.prev_pause = false;

    // Lanterns
    this.lanterns = this.map.lanterns.map((l) => ({
      id: l.id,
      pos: [...l.pos],
      lit: false,
      deposited: 0
    }));

    // Entities
    this.motes = [];
    this.shades = [];
    this.drifters = [];
    this.charms = this.map.charms.map((c) => ({
      id: c.id,
      pos: [...c.pos],
      available: true,
      respawn_ticks: 0
    }));

    this.pendingEvents = [];

    // Emit initial night start event
    this.emit('night_start', { night: this.night });

    // Apply Scenario if given
    this.applyScenario(options.scenario);
  }

  emit(name, data = {}) {
    this.pendingEvents.push({
      type: 'event',
      tick: this.tick,
      name,
      data
    });
  }

  applyScenario(sc) {
    if (!sc) {
      this.initDefaultEntities(true, true, true);
      return;
    }

    if (sc.time_left_s !== undefined) this.time_left_s = sc.time_left_s;

    if (sc.player) {
      if (sc.player.pos) this.player.pos = [...sc.player.pos];
      if (sc.player.carried !== undefined) this.player.carried = sc.player.carried;
      if (sc.player.flames !== undefined) this.player.flames = sc.player.flames;
      if (sc.player.invuln_ticks !== undefined) this.player.invuln_ticks = sc.player.invuln_ticks;
      if (sc.player.dash_cd_ticks !== undefined) this.player.dash_cd_ticks = sc.player.dash_cd_ticks;
      if (sc.player.pulse_cd_ticks !== undefined) this.player.pulse_cd_ticks = sc.player.pulse_cd_ticks;
      if (sc.player.charm_ticks !== undefined) this.player.charm_ticks = sc.player.charm_ticks;
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
    const randomDrifters = sc.random_drifters !== undefined ? sc.random_drifters : sc.drifters === undefined;

    if (sc.motes) {
      for (const m of sc.motes) {
        this.mote_counter++;
        const p = Array.isArray(m) ? m : m.pos;
        const kind = Array.isArray(m) ? 'random' : m.kind || 'random';
        const ttl_ticks = (m && m.ttl_s) ? Math.round(m.ttl_s * 60) : 0;
        this.motes.push({
          id: (m && m.id) ? m.id : `M${this.mote_counter}`,
          pos: [...p],
          kind,
          ttl_ticks
        });
      }
    }

    if (sc.shades) {
      for (const s of sc.shades) {
        this.shade_counter++;
        this.shades.push({
          id: s.id || `S${this.shade_counter}`,
          pos: s.pos ? [...s.pos] : [30, 0, 0],
          state: s.state || 'chase', // 'spawning'|'wander'|'chase'|'recoil'|'stunned'
          state_ticks_left: s.state_ticks_left || 0,
          push_vec: [0, 0],
          push_ticks: 0,
          safe_eject_ticks: 0
        });
      }
    }

    if (sc.drifters) {
      for (const d of sc.drifters) {
        this.drifter_counter++;
        this.drifters.push({
          id: d.id || `D${this.drifter_counter}`,
          pos: d.pos ? [...d.pos] : [20, 2, 20],
          state: d.state || 'idle', // 'idle'|'chase'|'flee'|'removed'
          stolen: d.stolen || 0,
          flee_ticks: d.flee_ticks !== undefined ? d.flee_ticks : (d.state === 'flee' ? 240 : 0),
          disappear_ticks: d.disappear_ticks || 0
        });
      }
    }

    if (sc.charms) {
      this.charms = sc.charms.map((c) => ({
        id: c.id,
        pos: c.pos ? [...c.pos] : [0, 0, 0],
        available: c.available !== undefined ? c.available : true,
        respawn_ticks: c.respawn_s ? Math.round(c.respawn_s * 60) : 0
      }));
    }

    this.initDefaultEntities(randomMotes, randomShades, randomDrifters);
  }

  initDefaultEntities(randomMotes, randomShades, randomDrifters) {
    if (randomMotes && this.motes.length === 0) {
      // Pick 20 initial points from map mote spots
      const spots = [...this.map.mote_spots];
      // Shuffle deterministically
      for (let i = spots.length - 1; i > 0; i--) {
        const j = Math.floor(this.prng.next() * (i + 1));
        [spots[i], spots[j]] = [spots[j], spots[i]];
      }
      const initialCount = Math.min(20, spots.length);
      for (let i = 0; i < initialCount; i++) {
        this.mote_counter++;
        this.motes.push({
          id: `M${this.mote_counter}`,
          pos: [...spots[i]],
          kind: 'random',
          ttl_ticks: 0
        });
      }
    }

    this.random_motes = randomMotes;
    this.random_shades = randomShades;
    this.random_drifters = randomDrifters;
  }

  getGroundHeight(x, z) {
    if (this.night === 1) {
      const r = Math.sqrt(x * x + z * z);
      return r <= 40.0 ? 0 : -999;
    }

    if (this.night === 2) {
      // Island A
      const rA = Math.sqrt(x * x + z * z);
      if (rA <= 28.0) return 0;
      // Island B
      const rB = Math.sqrt((x - 70) * (x - 70) + z * z);
      if (rB <= 28.0) return 0;
      // Bridge: x in [26, 44], z in [-2, 2]
      if (x >= 26.0 && x <= 44.0 && z >= -2.0 && z <= 2.0) return 0;
      return -999; // Fall into void
    }

    if (this.night === 3) {
      const r = Math.sqrt(x * x + z * z);
      if (r > 45.0) return -999;

      // Bell tower cylinder at center (0,6,0), r=2m
      // Slopes at angles 30 deg and 150 deg (width 3m) between r=30 (Y=0) and r=24 (Y=3)
      for (const slopeAngleDeg of [30, 150]) {
        const slopeRad = (slopeAngleDeg * Math.PI) / 180;
        // Project (x, z) onto radial line and perpendicular
        const cosS = Math.cos(slopeRad);
        const sinS = -Math.sin(slopeRad); // on XZ plane: x = r*cos, z = -r*sin
        const radialDist = x * cosS + z * sinS;
        const perpDist = Math.abs(-x * sinS + z * cosS);
        if (perpDist <= 1.5 && radialDist >= 24.0 && radialDist <= 30.0) {
          // Linear height from Y=0 at r=30 to Y=3 at r=24
          const frac = (30.0 - radialDist) / (30.0 - 24.0);
          return frac * 3.0;
        }
      }

      // Tier 2: disc r <= 8 at center, Y = 6
      if (r <= 8.0) return 6.0;

      // Tier 1: annulus r in [12, 24] where z > 0, Y = 3
      if (r >= 12.0 && r <= 24.0 && z > 0) return 3.0;

      // Tier 0: Y = 0
      return 0.0;
    }

    return 0;
  }

  step(input = {}) {
    this.tick++;
    this.pendingEvents = [];
    const dt = 1 / 60;

    // 1. Handle Pause Input
    const pauseEdge = !!input.pause && !this.prev_pause;
    this.prev_pause = !!input.pause;

    if (pauseEdge) {
      this.paused = !this.paused;
      if (this.paused) {
        this.emit('paused');
      } else {
        this.emit('resumed');
      }
    }

    // When paused: sim_tick, clock, timers, entities are frozen!
    if (this.paused) {
      this.state = 'paused';
      return this.pendingEvents;
    } else if (this.state === 'paused') {
      this.state = 'playing';
    }

    if (this.state !== 'playing') {
      return this.pendingEvents;
    }

    this.sim_tick++;

    // 2. Decrement Timers & Clocks
    this.time_left_s = Math.max(0, this.time_left_s - dt);

    if (this.player.invuln_ticks > 0) this.player.invuln_ticks--;
    if (this.player.dash_cd_ticks > 0) this.player.dash_cd_ticks--;
    if (this.player.dash_timer_ticks > 0) this.player.dash_timer_ticks--;
    if (this.player.pulse_cd_ticks > 0) this.player.pulse_cd_ticks--;
    if (this.player.charm_ticks > 0) this.player.charm_ticks--;
    if (this.player.respawn_delay_ticks > 0) {
      this.player.respawn_delay_ticks--;
      if (this.player.respawn_delay_ticks === 0) {
        // Respawn at map start position
        this.player.pos = [...this.map.spawn_player];
        this.player.vel = [0, 0, 0];
        this.player.grounded = true;
        this.player.invuln_ticks = 90; // 1.5s
      }
    }

    // Shades Timers
    for (const shade of this.shades) {
      if (shade.state_ticks_left > 0) {
        shade.state_ticks_left--;
        if (shade.state_ticks_left <= 0) {
          if (shade.state === 'stunned' || shade.state === 'recoil' || shade.state === 'spawning') {
            shade.state = 'wander';
          }
        }
      }
      if (shade.push_ticks > 0) shade.push_ticks--;
      if (shade.safe_eject_ticks > 0) shade.safe_eject_ticks--;
    }

    // Drifters Timers
    for (const drifter of this.drifters) {
      if (drifter.state === 'flee') {
        drifter.flee_ticks--;
        if (drifter.flee_ticks <= 0) {
          drifter.state = 'removed';
        }
      }
      if (drifter.disappear_ticks > 0) {
        drifter.disappear_ticks--;
        if (drifter.disappear_ticks <= 0) {
          drifter.state = 'removed';
        }
      }
    }

    // Dropped Motes TTL
    this.motes = this.motes.filter((m) => {
      if (m.kind === 'dropped' && m.ttl_ticks > 0) {
        m.ttl_ticks--;
        return m.ttl_ticks > 0;
      }
      return true;
    });

    // Charms Respawn
    for (const charm of this.charms) {
      if (!charm.available && charm.respawn_ticks > 0) {
        charm.respawn_ticks--;
        if (charm.respawn_ticks <= 0) {
          charm.available = true;
        }
      }
    }

    // Wind Cycle (Night 3)
    if (this.map.has_wind) {
      const cycle = this.sim_tick % 1800; // 30s
      if (cycle === 0) {
        this.wind.active = true;
        this.wind.dir_deg = Math.floor(this.prng.next() * 360);
        const rad = (this.wind.dir_deg * Math.PI) / 180;
        this.wind.direction_vec = [Math.cos(rad), -Math.sin(rad)];
        this.wind.timer = 300; // 5s
      }
      if (this.wind.active) {
        this.wind.timer--;
        if (this.wind.timer <= 0) {
          this.wind.active = false;
        }
      }
    }

    // 3. Player Movement & Physics
    if (this.player.respawn_delay_ticks === 0) {
      // Normal input processing
      const dashEdge = !!input.dash && !this.prev_dash;
      const interactEdge = !!input.interact && !this.prev_interact;
      const pulseEdge = !!input.pulse && !this.prev_pulse;

      this.prev_dash = !!input.dash;
      this.prev_interact = !!input.interact;
      this.prev_pulse = !!input.pulse;

      let mx = 0;
      let mz = 0;
      if (Array.isArray(input.move)) {
        mx = Math.max(-1, Math.min(1, input.move[0] || 0));
        mz = Math.max(-1, Math.min(1, input.move[1] || 0));
      }
      const moveMag = Math.sqrt(mx * mx + mz * mz);
      if (moveMag > 1.0) {
        mx /= moveMag;
        mz /= moveMag;
      }

      // Rotate by cam_yaw_deg if given
      if (input.cam_yaw_deg !== undefined && input.cam_yaw_deg !== 0) {
        const rad = (input.cam_yaw_deg * Math.PI) / 180;
        const cosA = Math.cos(rad);
        const sinA = Math.sin(rad);
        const rx = mx * cosA - mz * sinA;
        const rz = mx * sinA + mz * cosA;
        mx = rx;
        mz = rz;
      }

      if (Math.abs(mx) > 0.01 || Math.abs(mz) > 0.01) {
        this.player.facing_dir = normalizeXZ(mx, mz);
      }

      // Dash initiation
      if (dashEdge && this.player.dash_timer_ticks <= 0) {
        const canDash = this.player.charm_ticks > 0 || this.player.dash_cd_ticks <= 0;
        if (canDash) {
          this.player.dash_timer_ticks = 12; // 0.2s at 60Hz
          if (this.player.charm_ticks <= 0) {
            this.player.dash_cd_ticks = 90; // 1.5s
          }
          if (Math.abs(mx) > 0.01 || Math.abs(mz) > 0.01) {
            this.player.dash_dir = normalizeXZ(mx, mz);
          } else {
            this.player.dash_dir = [...this.player.facing_dir];
          }
          this.player.ballistic_horiz = false; // Dash overrides jump pad horizontal momentum
          this.emit('dash');
        }
      }

      // Horizontal movement calculation
      if (this.player.dash_timer_ticks > 0) {
        // Dash: 14 m/s in dash_dir, vertical velocity frozen
        this.player.vel[0] = this.player.dash_dir[0] * this.tuning.dash_speed;
        this.player.vel[2] = this.player.dash_dir[1] * this.tuning.dash_speed;
        this.player.vel[1] = 0;
      } else if (!this.player.ballistic_horiz) {
        const currentSpeed = this.player.charm_ticks > 0 ? 7.2 : this.tuning.player_speed;
        this.player.vel[0] = mx * currentSpeed;
        this.player.vel[2] = mz * currentSpeed;

        // Apply wind on Night 3
        if (this.wind.active) {
          this.player.vel[0] += this.wind.direction_vec[0] * 2.0;
          this.player.vel[2] += this.wind.direction_vec[1] * 2.0;
        }
      }

      // Vertical movement & Jump
      if (this.player.dash_timer_ticks <= 0) {
        if (this.player.grounded && input.jump) {
          this.player.vel[1] = this.tuning.jump_velocity;
          this.player.grounded = false;
        }
        // Gravity
        this.player.vel[1] += this.tuning.gravity * dt;
      }

      // Update positions
      this.player.pos[0] += this.player.vel[0] * dt;
      this.player.pos[1] += this.player.vel[1] * dt;
      this.player.pos[2] += this.player.vel[2] * dt;

      // Jump Pads detection (on Night 2 & 3)
      for (const pad of this.map.jump_pads) {
        const d = distXZ(this.player.pos, pad.pos);
        if (d <= pad.radius && Math.abs(this.player.pos[1] - pad.pos[1]) <= 1.0) {
          this.player.vel[1] = pad.vel_y;
          this.player.grounded = false;
          this.player.ballistic_horiz = true;

          if (pad.target) {
            const [dx, dz] = normalizeXZ(pad.target[0] - pad.pos[0], pad.target[2] - pad.pos[2]);
            this.player.vel[0] = dx * pad.speed_horiz;
            this.player.vel[2] = dz * pad.speed_horiz;
          } else if (pad.vel_horiz) {
            this.player.vel[0] = pad.vel_horiz[0];
            this.player.vel[2] = pad.vel_horiz[1];
          }
          break;
        }
      }

      // Ground & Terrain Check
      const groundY = this.getGroundHeight(this.player.pos[0], this.player.pos[2]);
      if (groundY > -500 && this.player.pos[1] <= groundY && this.player.vel[1] <= 0) {
        this.player.pos[1] = groundY;
        this.player.vel[1] = 0;
        this.player.grounded = true;
        this.player.ballistic_horiz = false; // Reset jump pad horizontal lock upon landing
      } else if (groundY <= -500) {
        this.player.grounded = false;
      }

      // Fall off Island Check (Y < -10)
      if (this.player.pos[1] < -10.0) {
        this.player.flames--;
        const droppedMotes = this.player.carried;
        this.player.carried = 0;
        this.emit('player_hit', {
          shade_id: null,
          flames_left: this.player.flames,
          dropped_motes: droppedMotes,
          lost: true
        });

        if (this.player.flames <= 0) {
          this.state = 'lost';
          this.reason = 'no_flames';
          this.emit('game_over', {
            state: this.state,
            reason: this.reason,
            final_score: this.score
          });
        } else {
          this.player.respawn_delay_ticks = 60; // 1s wait
        }
      }

      // Round player numbers
      this.player.pos[0] = round3(this.player.pos[0]);
      this.player.pos[1] = round3(this.player.pos[1]);
      this.player.pos[2] = round3(this.player.pos[2]);

      // 4. Pickup Motes & Charms
      if (this.player.respawn_delay_ticks === 0) {
        // Motes
        const keptMotes = [];
        for (const mote of this.motes) {
          const d = distXZ(this.player.pos, mote.pos);
          const dy = Math.abs(this.player.pos[1] - (mote.pos[1] - 0.5));
          if (d <= this.tuning.pickup_radius && dy <= this.tuning.pickup_height && this.player.carried < this.tuning.carry_capacity) {
            this.player.carried++;
            this.total_motes_picked++;
            this.score += this.tuning.score.per_mote;
            this.emit('mote_picked', {
              id: mote.id,
              carried: this.player.carried,
              total_picked: this.total_motes_picked
            });
          } else {
            keptMotes.push(mote);
          }
        }
        this.motes = keptMotes;

        // Charms
        for (const charm of this.charms) {
          if (charm.available) {
            const d = distXZ(this.player.pos, charm.pos);
            const dy = Math.abs(this.player.pos[1] - charm.pos[1]);
            if (d <= this.tuning.pickup_radius && dy <= this.tuning.pickup_height) {
              charm.available = false;
              charm.respawn_ticks = 2700; // 45s
              this.player.charm_ticks = 600; // 10s
              this.emit('charm_picked', {
                charm_id: charm.id,
                charm_ticks: 600
              });
            }
          }
        }

        // 5. Interact with Lanterns
        if (interactEdge && this.player.carried > 0) {
          let candidate = null;
          let minD = Infinity;

          for (const l of this.lanterns) {
            if (!l.lit) {
              const d = distXZ(this.player.pos, l.pos);
              if (d <= this.tuning.interact_radius) {
                if (d < minD) {
                  minD = d;
                  candidate = l;
                } else if (Math.abs(d - minD) < 1e-4) {
                  // Tie break: smaller id
                  if (candidate && l.id < candidate.id) {
                    candidate = l;
                  }
                }
              }
            }
          }

          if (candidate) {
            const needed = this.tuning.lantern_cost - candidate.deposited;
            const depositAmt = Math.min(this.player.carried, needed);
            if (depositAmt > 0) {
              this.player.carried -= depositAmt;
              candidate.deposited += depositAmt;
              this.emit('deposit', {
                id: candidate.id,
                deposited: depositAmt,
                total_deposited: candidate.deposited
              });

              if (candidate.deposited >= this.tuning.lantern_cost) {
                candidate.lit = true;
                this.score += this.tuning.score.per_lantern;
                const litCount = this.lanterns.filter((l) => l.lit).length;
                this.emit('lantern_lit', {
                  id: candidate.id,
                  lit_count: litCount
                });

                // Push out any shades currently inside 6m safe zone
                for (const s of this.shades) {
                  const dS = distXZ(s.pos, candidate.pos);
                  if (dS < this.tuning.safe_radius) {
                    s.safe_eject_ticks = 30; // 30 ticks harmless ejection
                    const [outX, outZ] = normalizeXZ(s.pos[0] - candidate.pos[0], s.pos[2] - candidate.pos[2]);
                    s.push_vec = [outX, outZ];
                  }
                }
              }
            }
          }
        }

        // 6. Pulse (Tỏa Sáng v1.1)
        if (pulseEdge && this.player.carried >= this.tuning.pulse_cost && this.player.pulse_cd_ticks <= 0) {
          this.player.carried -= this.tuning.pulse_cost;
          this.player.pulse_cd_ticks = 180; // 3s

          const pulseCenter = [
            this.player.pos[0],
            this.player.pos[1] + 0.8,
            this.player.pos[2]
          ];

          const stunnedIds = [];
          for (const s of this.shades) {
            const d3 = dist3D(pulseCenter, [s.pos[0], s.pos[1] + 0.8, s.pos[2]]);
            if (d3 <= this.tuning.pulse_radius) {
              s.state = 'stunned';
              s.state_ticks_left = 120; // 120 ticks
              s.push_ticks = 15;        // 15 ticks push
              let [px, pz] = normalizeXZ(s.pos[0] - this.player.pos[0], s.pos[2] - this.player.pos[2]);
              if (Math.abs(px) < 1e-4 && Math.abs(pz) < 1e-4) {
                px = 1; pz = 0; // default +X
              }
              s.push_vec = [px, pz];
              this.score += this.tuning.score.per_stun;
              stunnedIds.push(s.id);
            }
          }

          // Drifter interaction with Pulse
          for (const d of this.drifters) {
            if (d.state !== 'removed') {
              const distD = dist3D(pulseCenter, d.pos);
              if (distD <= this.tuning.pulse_radius) {
                if (d.state === 'chase') {
                  d.state = 'flee';
                  d.flee_ticks = 240;
                } else if (d.state === 'flee' && d.stolen > 0) {
                  // Drop stolen motes as dropped motes at current location
                  for (let i = 0; i < d.stolen; i++) {
                    this.mote_counter++;
                    this.motes.push({
                      id: `M${this.mote_counter}`,
                      pos: [round3(d.pos[0]), round3(d.pos[1]), round3(d.pos[2])],
                      kind: 'dropped',
                      ttl_ticks: 480
                    });
                  }
                  this.emit('drifter_drop', {
                    drifter_id: d.id,
                    amount: d.stolen
                  });
                  d.stolen = 0;
                  d.disappear_ticks = 120;
                }
              }
            }
          }

          this.emit('pulse', {
            carried: this.player.carried,
            stunned_ids: stunnedIds
          });
        }
      }
    }

    // 7. Update Shades Movement & State
    const litLanterns = this.lanterns.filter((l) => l.lit);
    const shadeSpeed = this.night === 3 ? this.tuning.shade_speed_night3 : this.tuning.shade_speed;

    for (const s of this.shades) {
      if (s.state === 'stunned') {
        if (s.push_ticks > 0) {
          const pushStep = 4.0 / 15.0;
          s.pos[0] += s.push_vec[0] * pushStep;
          s.pos[2] += s.push_vec[1] * pushStep;
        }
      } else if (s.state === 'recoil') {
        const recoilStep = 2.0 / 60.0;
        s.pos[0] += s.push_vec[0] * recoilStep;
        s.pos[2] += s.push_vec[1] * recoilStep;
      } else if (s.state === 'chase' || s.state === 'wander') {
        const dPlayer = distXZ(s.pos, this.player.pos);
        if (dPlayer <= this.tuning.shade_detect_radius) {
          s.state = 'chase';
        } else if (dPlayer > this.tuning.shade_lose_radius && s.state === 'chase') {
          s.state = 'wander';
        }

        let target = this.player.pos;
        if (s.state === 'chase') {
          const [dx, dz] = normalizeXZ(target[0] - s.pos[0], target[2] - s.pos[2]);
          const nextX = s.pos[0] + dx * shadeSpeed * dt;
          const nextZ = s.pos[2] + dz * shadeSpeed * dt;

          // Safe zone block (6m)
          let blocked = false;
          for (const l of litLanterns) {
            if (distXZ([nextX, 0, nextZ], l.pos) < this.tuning.safe_radius) {
              blocked = true;
              const [outX, outZ] = normalizeXZ(nextX - l.pos[0], nextZ - l.pos[2]);
              s.pos[0] = l.pos[0] + outX * this.tuning.safe_radius;
              s.pos[2] = l.pos[2] + outZ * this.tuning.safe_radius;
              break;
            }
          }

          if (!blocked) {
            s.pos[0] = nextX;
            s.pos[2] = nextZ;
          }
        }
      }

      s.pos[0] = round3(s.pos[0]);
      s.pos[2] = round3(s.pos[2]);
    }

    // 8. Update Drifters Movement
    for (const d of this.drifters) {
      if (d.state === 'idle') {
        const distP = distXZ(d.pos, this.player.pos);
        if (this.player.carried >= 5 && distP <= 15.0) {
          d.state = 'chase';
        }
      } else if (d.state === 'chase') {
        const distP = distXZ(d.pos, this.player.pos);
        if (this.player.carried < 5 || distP > 15.0) {
          d.state = 'idle';
        } else {
          // Fly directly to Mây at 7 m/s
          const [dirX, dirZ] = normalizeXZ(this.player.pos[0] - d.pos[0], this.player.pos[2] - d.pos[2]);
          d.pos[0] += dirX * 7.0 * dt;
          d.pos[2] += dirZ * 7.0 * dt;
        }
      } else if (d.state === 'flee') {
        // Fly away from Mây at 7 m/s
        const [dirX, dirZ] = normalizeXZ(d.pos[0] - this.player.pos[0], d.pos[2] - this.player.pos[2]);
        d.pos[0] += dirX * 7.0 * dt;
        d.pos[2] += dirZ * 7.0 * dt;
      }
      d.pos[0] = round3(d.pos[0]);
      d.pos[2] = round3(d.pos[2]);
    }

    // 9. Collision Checks (Drifter steals first, then Shade hits)
    if (this.player.respawn_delay_ticks === 0) {
      // Drifter Steal
      for (const d of this.drifters) {
        if (d.state === 'chase') {
          const dXZ = distXZ(this.player.pos, d.pos);
          if (dXZ <= 1.2) {
            const stealAmt = Math.min(3, this.player.carried);
            this.player.carried -= stealAmt;
            d.stolen += stealAmt;
            d.state = 'flee';
            d.flee_ticks = 240; // 4s
            this.emit('drifter_steal', {
              drifter_id: d.id,
              amount: stealAmt,
              carried: this.player.carried
            });
            break;
          }
        }
      }

      // Shade Hit
      if (this.player.invuln_ticks <= 0) {
        // Evaluate shades by id order
        const sortedShades = [...this.shades].sort((a, b) => a.id.localeCompare(b.id));
        for (const s of sortedShades) {
          if (s.state !== 'stunned' && s.state !== 'recoil' && s.safe_eject_ticks <= 0) {
            const dXZ = distXZ(this.player.pos, s.pos);
            const dY = Math.abs(this.player.pos[1] - s.pos[1]);
            if (dXZ <= this.tuning.shade_hit_radius && dY <= 1.5) {
              this.player.flames--;
              this.player.invuln_ticks = 90; // 1.5s
              const dropped = Math.floor(this.player.carried * this.tuning.hit_drop_ratio);
              this.player.carried -= dropped;

              // Scatter dropped motes around player in ring 1.5 - 2.5m
              for (let i = 0; i < dropped; i++) {
                this.mote_counter++;
                const angle = (i * 2 * Math.PI) / (dropped || 1);
                const r = 2.0;
                this.motes.push({
                  id: `M${this.mote_counter}`,
                  pos: [
                    round3(this.player.pos[0] + r * Math.sin(angle)),
                    0.5,
                    round3(this.player.pos[2] + r * Math.cos(angle))
                  ],
                  kind: 'dropped',
                  ttl_ticks: 480
                });
              }

              // Recoil shade 2m over 60 ticks away from player
              s.state = 'recoil';
              s.state_ticks_left = 60;
              const [rx, rz] = normalizeXZ(s.pos[0] - this.player.pos[0], s.pos[2] - this.player.pos[2]);
              s.push_vec = [rx, rz];

              this.emit('player_hit', {
                shade_id: s.id,
                flames_left: this.player.flames,
                dropped_motes: dropped
              });
              break; // max 1 hit per tick
            }
          }
        }
      }
    }

    // 10. Periodic Spawns
    if (this.random_shades) {
      if (this.sim_tick === 300) {
        // Spawn 2 initial shades
        for (let i = 0; i < 2; i++) {
          this.spawnOneShade();
        }
      } else if (this.sim_tick > 300 && (this.sim_tick - 300) % this.map.shade_spawn_interval_ticks === 0) {
        if (this.shades.length < this.map.max_shades) {
          this.spawnOneShade();
        }
      }
    }

    if (this.random_motes && this.sim_tick % 240 === 0) {
      // Every 4s, spawn 1 mote at empty spot if total motes < 30
      if (this.motes.length < 30) {
        const availableSpot = this.map.mote_spots.find((sp) => {
          return !this.motes.some((m) => distXZ(m.pos, sp) < 1.0);
        });
        if (availableSpot) {
          this.mote_counter++;
          this.motes.push({
            id: `M${this.mote_counter}`,
            pos: [...availableSpot],
            kind: 'random',
            ttl_ticks: 0
          });
        }
      }
    }

    if (this.random_drifters && this.map.has_drifters && this.sim_tick % 1200 === 0) {
      // Spawn drifter if active count < 2
      const activeDrifters = this.drifters.filter((d) => d.state !== 'removed').length;
      if (activeDrifters < 2) {
        this.drifter_counter++;
        this.drifters.push({
          id: `D${this.drifter_counter}`,
          pos: [round3(this.player.pos[0] + 15), 2.0, round3(this.player.pos[2] + 15)],
          state: 'idle',
          stolen: 0,
          flee_ticks: 0,
          disappear_ticks: 0
        });
      }
    }

    // 11. Check Game Over
    const allLit = this.lanterns.every((l) => l.lit);
    if (this.player.flames <= 0) {
      this.state = 'lost';
      this.reason = 'no_flames';
      this.emit('game_over', {
        state: this.state,
        reason: this.reason,
        final_score: this.score
      });
    } else if (allLit) {
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

  spawnOneShade() {
    // Find valid spot >= 15m from player
    const validSpots = this.map.shade_spots.filter((sp) => distXZ(sp, this.player.pos) >= 15.0);
    const chosenSpot = validSpots.length > 0
      ? validSpots[Math.floor(this.prng.next() * validSpots.length)]
      : this.map.shade_spots[0];

    this.shade_counter++;
    const s = {
      id: `S${this.shade_counter}`,
      pos: [...chosenSpot],
      state: 'chase',
      state_ticks_left: 0,
      push_vec: [0, 0],
      push_ticks: 0,
      safe_eject_ticks: 0
    };
    this.shades.push(s);
    this.emit('shade_spawned', {
      id: s.id,
      pos: [...s.pos]
    });
  }

  getSnapshot() {
    return {
      type: 'snapshot',
      tick: this.tick,
      sim_tick: this.sim_tick,
      state: this.state,
      night: this.night,
      time_left_s: round3(this.time_left_s),
      score: this.score,
      wind: {
        active: this.wind.active,
        dir_deg: this.wind.dir_deg
      },
      player: {
        pos: roundVec3(this.player.pos),
        vel: roundVec3(this.player.vel),
        flames: this.player.flames,
        carried: this.player.carried,
        grounded: this.player.grounded,
        invuln: this.player.invuln_ticks > 0,
        dash_cd_s: round3(this.player.dash_cd_ticks / 60),
        pulse_cd_s: round3(this.player.pulse_cd_ticks / 60),
        charm_s: round3(this.player.charm_ticks / 60)
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
        pos: roundVec3(m.pos),
        kind: m.kind || 'random',
        ttl_s: round3((m.ttl_ticks || 0) / 60)
      })),
      drifters: this.drifters.map((d) => ({
        id: d.id,
        pos: roundVec3(d.pos),
        state: d.state,
        stolen: d.stolen
      })),
      charms: this.charms.map((c) => ({
        id: c.id,
        available: c.available,
        respawn_s: round3((c.respawn_ticks || 0) / 60)
      }))
    };
  }

  getEnd() {
    return {
      type: 'end',
      ticks: this.tick,
      sim_ticks: this.sim_tick,
      state: this.state,
      reason: this.reason,
      final_score: this.score
    };
  }
}
