import test from 'node:test';
import assert from 'node:assert/strict';
import { Sim } from '../src/sim/sim.js';

test('Phase 3 scoring breakdown on victory at dawn', () => {
  const sim = new Sim({
    night: 1,
    scenario: {
      time_left_s: 0.01,
      player: { pos: [0, 0, 0], flames: 2 },
      lanterns: [
        { id: 'L1', lit: true, fuel: 85.6 }, // +50 + 85 = 135
        { id: 'L2', lit: true, fuel: 40.2 }, // +50 + 40 = 90
        { id: 'L3', lit: true, fuel: 20.9 }, // +50 + 20 = 70
        { id: 'L4', lit: false, fuel: 0 },
        { id: 'L5', lit: false, fuel: 0 }
      ],
      random_motes: false,
      random_shades: false
    }
  });

  sim.step();
  assert.equal(sim.state, 'won');
  // Score breakdown:
  // L1: 50 + 85 = 135
  // L2: 50 + 40 = 90
  // L3: 50 + 20 = 70
  // Flames: 2 * 50 = 100
  // Total: 135 + 90 + 70 + 100 = 395
  assert.equal(sim.score, 395);
});
