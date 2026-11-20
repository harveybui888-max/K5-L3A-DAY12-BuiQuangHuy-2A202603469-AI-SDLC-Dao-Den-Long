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

test('Player stepping beyond island radius falls into cloud sea and loses a flame', () => {
  const sim = new Sim({
    scenario: {
      player: { pos: [0, 0, 39], flames: 3, carried: 4 },
      random_motes: false,
      random_shades: false
    }
  });

  // Move outward beyond 40m for 120 ticks
  let fell = false;
  for (let i = 0; i < 120; i++) {
    sim.step({ move: [0, 1] });
    if (sim.player.pos[1] < -10 || sim.player.respawn_delay_ticks > 0) {
      fell = true;
      break;
    }
  }

  assert(fell, 'Player should fall off island boundary into cloud sea');
  assert.equal(sim.player.flames, 2, 'Falling should deduct 1 flame');
  assert.equal(sim.player.carried, 0, 'Falling should lose all carried motes');
});
