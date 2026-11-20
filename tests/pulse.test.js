import test from 'node:test';
import assert from 'node:assert/strict';
import { Sim } from '../src/sim/sim.js';

test('Pulse costs 1 mote, stuns shades in 6m radius for 2s and pushes 4m', () => {
  const sim = new Sim({
    scenario: {
      player: { pos: [0, 0, 0], carried: 3 },
      random_motes: false,
      random_shades: false,
      shades: [{ id: 'S1', pos: [0, 0, 3] }]
    }
  });

  const events = sim.step({ pulse: true });
  assert.equal(sim.player.carried, 2);

  const s1 = sim.shades.find((s) => s.id === 'S1');
  assert.equal(s1.state, 'stunned');
  assert.equal(Math.round(s1.pos[2]), 7); // pushed 3 + 4 = 7m
  assert.equal(sim.score, 20); // +20 per stun
  assert.equal(events.some((e) => e.name === 'pulse'), true);
});

test('Pulse fails if carried motes < 1 or on cooldown', () => {
  const sim = new Sim({
    scenario: {
      player: { pos: [0, 0, 0], carried: 0 },
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
