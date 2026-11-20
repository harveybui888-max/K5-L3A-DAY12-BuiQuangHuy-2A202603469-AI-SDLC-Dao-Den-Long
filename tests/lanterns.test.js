import test from 'node:test';
import assert from 'node:assert/strict';
import { Sim } from '../src/sim/sim.js';

test('Deposit motes into nearest unlit lantern on interact edge', () => {
  const sim = new Sim({
    scenario: {
      player: { pos: [0, 0, 24], carried: 3 },
      random_motes: false,
      random_shades: false
    }
  });

  // L1 is at [0, 0, 25], dist is 1m (<= interact_radius 2.0m)
  const events = sim.step({ interact: true });
  assert.equal(sim.player.carried, 0);

  const l1 = sim.lanterns.find((l) => l.id === 'L1');
  assert.equal(l1.deposited, 3);
  assert.equal(l1.lit, false);
  assert.equal(events.some((e) => e.name === 'deposit'), true);
});

test('Lantern lights up and scores +100 when deposited reaches lantern_cost (10)', () => {
  const sim = new Sim({
    scenario: {
      player: { pos: [0, 0, 24], carried: 10 },
      random_motes: false,
      random_shades: false
    }
  });

  const events = sim.step({ interact: true });
  const l1 = sim.lanterns.find((l) => l.id === 'L1');
  assert.equal(l1.deposited, 10);
  assert.equal(l1.lit, true);
  assert.equal(sim.score, 100);
  assert.equal(events.some((e) => e.name === 'lantern_lit'), true);
});
