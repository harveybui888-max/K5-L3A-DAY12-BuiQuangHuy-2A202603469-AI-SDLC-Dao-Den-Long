import test from 'node:test';
import assert from 'node:assert/strict';
import { Sim } from '../src/sim/sim.js';

test('Lantern with fuel < 30 loses safe zone; fuel >= 30 retains safe zone', () => {
  const simWeak = new Sim({
    scenario: {
      player: { pos: [0, 0, 25] },
      lanterns: [{ id: 'L1', lit: true, fuel: 20.0, pos: [0, 0, 25] }],
      shades: [{ id: 'S1', pos: [0, 0, 20] }], // 5m away (< 6m safe zone)
      random_motes: false,
      random_shades: false
    }
  });

  // Since fuel < 30, shade can approach inside 6m
  simWeak.step();
  const sWeak = simWeak.shades.find((s) => s.id === 'S1');
  assert(sWeak.pos[2] > 20.0);

  const simSafe = new Sim({
    scenario: {
      player: { pos: [0, 0, 25] },
      lanterns: [{ id: 'L1', lit: true, fuel: 60.0, pos: [0, 0, 25] }], // > 30 throughout 60 ticks
      shades: [{ id: 'S1', pos: [0, 0, 18] }], // 7m away
      random_motes: false,
      random_shades: false
    }
  });

  // Step 60 ticks: shade chases toward player but must be blocked at 6m
  for (let i = 0; i < 60; i++) {
    simSafe.step();
  }

  const sSafe = simSafe.shades.find((s) => s.id === 'S1');
  const d = Math.abs(sSafe.pos[2] - 25);
  assert(d >= 5.95, `Expected distance >= 5.95, got ${d}`);
});

test('Wander shade seeks weak lantern (fuel < 30), transitions to drain within 2m, and emits fuel_drain', () => {
  const sim = new Sim({
    scenario: {
      player: { pos: [30, 0, 0] }, // Far away (> 12m detect radius)
      lanterns: [{ id: 'L1', lit: true, fuel: 25.0, pos: [0, 0, 0] }],
      shades: [{ id: 'S1', pos: [0, 0, 1.5], state: 'drain', target_lantern_id: 'L1' }],
      random_motes: false,
      random_shades: false
    }
  });

  // Step 60 ticks (1s) of draining: drains 5.0 fuel, emits fuel_drain
  let drainEvents = [];
  for (let i = 0; i < 60; i++) {
    const events = sim.step();
    drainEvents.push(...events.filter((e) => e.name === 'fuel_drain'));
  }

  const s1 = sim.shades.find((s) => s.id === 'S1');
  assert.equal(s1.state, 'drain');
  assert.equal(drainEvents.length, 1, 'Should emit exactly 1 fuel_drain event per 60 ticks');
  assert.equal(drainEvents[0].data.lantern_id, 'L1');

  const l1 = sim.lanterns.find((l) => l.id === 'L1');
  // 25.0 - 1.0 (natural decay) - 5.0 (shade drain) = 19.0
  assert(Math.abs(l1.fuel - 19.0) < 0.1, `Expected fuel ~ 19.0, got ${l1.fuel}`);
});

test('Pulse on draining shade stuns it and awards +15 points', () => {
  const sim = new Sim({
    scenario: {
      player: { pos: [0, 0, 0], carried: 3 },
      shades: [{ id: 'S1', pos: [0, 0, 2], state: 'drain', target_lantern_id: 'L1' }],
      random_motes: false,
      random_shades: false
    }
  });

  sim.step({ pulse: true });
  const s1 = sim.shades.find((s) => s.id === 'S1');
  assert.equal(s1.state, 'stunned');
  assert.equal(sim.score, 15, 'Pulse against draining shade should award +15 points');
});

test('Shade in drain state switches to chase when player enters within 6m', () => {
  const sim = new Sim({
    scenario: {
      player: { pos: [0, 0, 5] }, // 5m away (< 6m)
      lanterns: [{ id: 'L1', lit: true, fuel: 20.0, pos: [0, 0, 0] }],
      shades: [{ id: 'S1', pos: [0, 0, 0.5], state: 'drain', target_lantern_id: 'L1' }],
      random_motes: false,
      random_shades: false
    }
  });

  sim.step();
  const s1 = sim.shades.find((s) => s.id === 'S1');
  assert.equal(s1.state, 'chase');
});
