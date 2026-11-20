import test from 'node:test';
import assert from 'node:assert/strict';
import { Sim } from '../src/sim/sim.js';

test('Player moves at player_speed (6 m/s) in XZ plane', () => {
  const sim = new Sim({
    scenario: {
      player: { pos: [0, 0, 0] },
      random_motes: false,
      random_shades: false
    }
  });

  // Step 60 ticks (1 second) moving forward along Z ([0, 1])
  for (let i = 0; i < 60; i++) {
    sim.step({ move: [0, 1] });
  }

  assert.equal(sim.player.pos[0], 0);
  assert.equal(Math.round(sim.player.pos[2]), 6);
});

test('Movement vector longer than 1 is normalized', () => {
  const sim = new Sim({
    scenario: {
      player: { pos: [0, 0, 0] },
      random_motes: false,
      random_shades: false
    }
  });

  // Diagonal move [1, 1] for 60 ticks
  for (let i = 0; i < 60; i++) {
    sim.step({ move: [1, 1] });
  }

  const dist = Math.sqrt(sim.player.pos[0] ** 2 + sim.player.pos[2] ** 2);
  assert.equal(Math.round(dist), 6);
});

test('Player cannot move beyond island radius of 40m', () => {
  const sim = new Sim({
    scenario: {
      player: { pos: [0, 0, 39] },
      random_motes: false,
      random_shades: false
    }
  });

  // Move outward for 60 ticks
  for (let i = 0; i < 60; i++) {
    sim.step({ move: [0, 1] });
  }

  const dist = Math.sqrt(sim.player.pos[0] ** 2 + sim.player.pos[2] ** 2);
  assert(dist <= 40.001);
});
