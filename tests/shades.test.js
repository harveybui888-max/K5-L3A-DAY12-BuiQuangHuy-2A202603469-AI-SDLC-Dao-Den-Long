import test from 'node:test';
import assert from 'node:assert/strict';
import { Sim } from '../src/sim/sim.js';

test('Shade chases player at shade_speed (4.0 m/s in Night 1)', () => {
  const sim = new Sim({
    scenario: {
      player: { pos: [0, 0, 0] },
      random_motes: false,
      random_shades: false,
      shades: [{ id: 'S1', pos: [0, 0, 10] }]
    }
  });

  for (let i = 0; i < 60; i++) {
    sim.step();
  }

  const s1 = sim.shades.find((s) => s.id === 'S1');
  assert.equal(s1.pos[0], 0);
  assert(Math.abs(s1.pos[2] - 6.0) < 0.05, `Expected pos[2] ~ 6.0, got ${s1.pos[2]}`);
});

test('Shade hit reduces flame, drops half carried motes, grants invulnerability', () => {
  const sim = new Sim({
    scenario: {
      player: { pos: [0, 0, 0], flames: 3, carried: 6 },
      random_motes: false,
      random_shades: false,
      shades: [{ id: 'S1', pos: [0, 0, 0.5] }]
    }
  });

  const events = sim.step();
  assert.equal(sim.player.flames, 2);
  assert.equal(sim.player.carried, 3); // 6 - floor(6*0.5) = 3
  assert(sim.player.invuln_ticks > 0);
  assert.equal(events.some((e) => e.name === 'player_hit'), true);
});

test('Shade cannot enter safe_radius (6m) around lit lantern', () => {
  const sim = new Sim({
    scenario: {
      player: { pos: [0, 0, 25] }, // inside lit L1
      random_motes: false,
      random_shades: false,
      lanterns: [{ id: 'L1', lit: true, deposited: 10, pos: [0, 0, 25] }],
      shades: [{ id: 'S1', pos: [0, 0, 18] }] // 7m away from L1
    }
  });

  // Chase player for 2 seconds (120 ticks)
  for (let i = 0; i < 120; i++) {
    sim.step();
  }

  const s1 = sim.shades.find((s) => s.id === 'S1');
  const distToL1 = Math.sqrt((s1.pos[0] - 0) ** 2 + (s1.pos[2] - 25) ** 2);
  assert(distToL1 >= 5.99, `Expected dist >= 5.99, got ${distToL1}`); // blocked at safe boundary (6m)
});
