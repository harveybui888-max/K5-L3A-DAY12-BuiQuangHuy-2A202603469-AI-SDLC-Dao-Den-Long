import test from 'node:test';
import assert from 'node:assert/strict';
import { Sim } from '../src/sim/sim.js';

test('Lighting all lanterns does NOT trigger early win', () => {
  const sim = new Sim({
    night: 1,
    scenario: {
      player: { pos: [0, 0, 24], carried: 10 },
      lanterns: [
        { id: 'L1', lit: false, deposited: 0, pos: [0, 0, 25] },
        { id: 'L2', lit: true, fuel: 100 },
        { id: 'L3', lit: true, fuel: 100 },
        { id: 'L4', lit: true, fuel: 100 },
        { id: 'L5', lit: true, fuel: 100 }
      ],
      random_motes: false,
      random_shades: false
    }
  });

  sim.step({ interact: true }); // lights L1 -> all 5 lanterns lit!
  assert.equal(sim.lanterns.every((l) => l.lit), true);
  assert.equal(sim.state, 'playing', 'Game must remain playing even when all lanterns are lit');
});

test('Win at dawn when currently lit lanterns >= ceil(0.6 * total): reason dawn_survived', () => {
  const sim = new Sim({
    night: 1, // 5 lanterns, 0.6 * 5 = 3
    scenario: {
      time_left_s: 0.01, // will reach 0 on step 1
      player: { pos: [0, 0, 0], flames: 3 },
      lanterns: [
        { id: 'L1', lit: true, fuel: 80 },
        { id: 'L2', lit: true, fuel: 60 },
        { id: 'L3', lit: true, fuel: 40 },
        { id: 'L4', lit: false, fuel: 0 },
        { id: 'L5', lit: false, fuel: 0 }
      ],
      random_motes: false,
      random_shades: false
    }
  });

  const events = sim.step();
  assert.equal(sim.state, 'won');
  assert.equal(sim.reason, 'dawn_survived');
  assert(events.some((e) => e.name === 'game_over' && e.data.reason === 'dawn_survived'));
});

test('Lose at dawn when currently lit lanterns < ceil(0.6 * total): reason dawn', () => {
  const sim = new Sim({
    night: 1, // 5 lanterns, need 3, only 2 lit
    scenario: {
      time_left_s: 0.01,
      player: { pos: [0, 0, 0], flames: 3 },
      lanterns: [
        { id: 'L1', lit: true, fuel: 80 },
        { id: 'L2', lit: true, fuel: 60 },
        { id: 'L3', lit: false, fuel: 0 },
        { id: 'L4', lit: false, fuel: 0 },
        { id: 'L5', lit: false, fuel: 0 }
      ],
      random_motes: false,
      random_shades: false
    }
  });

  sim.step();
  assert.equal(sim.state, 'lost');
  assert.equal(sim.reason, 'dawn');
});

test('Running out of flames immediately loses with no_flames', () => {
  const sim = new Sim({
    scenario: {
      player: { pos: [0, 0, 0], flames: 1 },
      shades: [{ id: 'S1', pos: [0, 0, 0.5] }],
      random_motes: false,
      random_shades: false
    }
  });

  sim.step();
  assert.equal(sim.state, 'lost');
  assert.equal(sim.reason, 'no_flames');
});
