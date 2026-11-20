import test from 'node:test';
import assert from 'node:assert/strict';
import { Sim } from '../src/sim/sim.js';

test('Player automatically picks up mote within pickup_radius (1.0m XZ, 1.5m Y)', () => {
  const sim = new Sim({
    scenario: {
      player: { pos: [0, 0, 0], carried: 0 },
      random_motes: false,
      random_shades: false,
      motes: [[0, 0.5, 0.8]]
    }
  });

  const events = sim.step();
  assert.equal(sim.player.carried, 1);
  assert.equal(sim.motes.length, 0);
  assert.equal(events.some((e) => e.name === 'mote_picked'), true);
});

test('Player cannot carry more than player.capacity motes', () => {
  const sim = new Sim({
    scenario: {
      player: { pos: [0, 0, 0], carried: 10, successful_lights: 0 },
      random_motes: false,
      random_shades: false,
      motes: [[0, 0.5, 0.5]]
    }
  });

  assert.equal(sim.player.capacity, 10);
  sim.step();
  assert.equal(sim.player.carried, 10);
  assert.equal(sim.motes.length, 1);
});
