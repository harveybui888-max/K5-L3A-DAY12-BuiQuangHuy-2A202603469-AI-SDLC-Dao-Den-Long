import test from 'node:test';
import assert from 'node:assert/strict';
import { Sim } from '../src/sim/sim.js';

test('Pulse costs 3 motes, stuns shades in 5m radius for 120 ticks and pushes 4m', () => {
  const sim = new Sim({
    scenario: {
      player: { pos: [0, 0, 0], carried: 5 },
      random_motes: false,
      random_shades: false,
      shades: [{ id: 'S1', pos: [0, 0, 3] }]
    }
  });

  const events = sim.step({ pulse: true });
  assert.equal(sim.player.carried, 2); // 5 - 3 = 2

  const s1 = sim.shades.find((s) => s.id === 'S1');
  assert.equal(s1.state, 'stunned');
  assert.equal(s1.state_ticks_left, 120);
  assert.equal(sim.score, 5); // +5 per stun in Phase 2
  assert.equal(events.some((e) => e.name === 'pulse'), true);
});

test('Pulse fails if carried motes < 3 or on cooldown', () => {
  const sim = new Sim({
    scenario: {
      player: { pos: [0, 0, 0], carried: 2 }, // requires 3
      random_motes: false,
      random_shades: false,
      shades: [{ id: 'S1', pos: [0, 0, 3] }]
    }
  });

  const events = sim.step({ pulse: true });
  assert.equal(events.some((e) => e.name === 'pulse'), false);
  const s1 = sim.shades.find((s) => s.id === 'S1');
  assert.equal(s1.state, 'chase');
});
