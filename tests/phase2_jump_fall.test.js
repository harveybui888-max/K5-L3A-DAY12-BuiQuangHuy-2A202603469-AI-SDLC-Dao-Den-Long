import test from 'node:test';
import assert from 'node:assert/strict';
import { Sim } from '../src/sim/sim.js';

test('Player jumps with initial velocity of 7 m/s when grounded', () => {
  const sim = new Sim({
    scenario: {
      player: { pos: [0, 0, 0] },
      random_motes: false,
      random_shades: false
    }
  });

  sim.step({ jump: true });
  assert.equal(sim.player.grounded, false);
  // After 1 tick: vel_y = 7 + (-20)*1/60 = 7 - 0.333 = 6.667 m/s
  assert(sim.player.vel[1] > 6.0);
  assert(sim.player.pos[1] > 0);
});

test('Player falling into void (Y < -10) loses 1 flame, all motes, waits 60 ticks and respawns', () => {
  const sim = new Sim({
    scenario: {
      player: { pos: [50, 0, 0], flames: 3, carried: 8 }, // Off island (r=40)
      random_motes: false,
      random_shades: false
    }
  });

  let hitReported = false;
  // Step until falling below -10
  for (let t = 0; t < 120; t++) {
    const events = sim.step();
    if (events.some((e) => e.name === 'player_hit' && e.data.lost)) {
      hitReported = true;
      break;
    }
  }

  assert(hitReported, 'Should emit player_hit with lost: true');
  assert.equal(sim.player.flames, 2);
  assert.equal(sim.player.carried, 0);
  assert(sim.player.respawn_delay_ticks > 0, 'Should enter 60 tick respawn delay');

  // Step through remaining respawn delay ticks
  while (sim.player.respawn_delay_ticks > 0) {
    sim.step();
  }

  // After respawn: at spawn_player [0,0,0], grounded, 90 ticks invulnerability
  assert.deepEqual(sim.player.pos, [0, 0, 0]);
  assert.equal(sim.player.grounded, true);
  assert.equal(sim.player.invuln_ticks, 90);
});

test('Falling into void with 1 flame results in game over (no_flames)', () => {
  const sim = new Sim({
    scenario: {
      player: { pos: [50, 0, 0], flames: 1, carried: 0 },
      random_motes: false,
      random_shades: false
    }
  });

  for (let t = 0; t < 120; t++) {
    sim.step();
    if (sim.state === 'lost') break;
  }

  assert.equal(sim.state, 'lost');
  assert.equal(sim.reason, 'no_flames');
});
