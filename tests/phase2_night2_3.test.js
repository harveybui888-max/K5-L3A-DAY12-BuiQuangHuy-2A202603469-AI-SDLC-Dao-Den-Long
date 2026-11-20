import test from 'node:test';
import assert from 'node:assert/strict';
import { Sim } from '../src/sim/sim.js';

test('Night 2: Bridge allows crossing between Island A and B, jump pad launches across islands', () => {
  const sim = new Sim({
    night: 2,
    scenario: {
      player: { pos: [35, 0, 0] }, // on bamboo bridge x in [26, 44], z in [-2, 2]
      random_motes: false,
      random_shades: false
    }
  });

  sim.step();
  assert.equal(sim.player.grounded, true, 'Bridge should provide ground at Y=0');

  // Jump pad at (20, 0, 18)
  const simPad = new Sim({
    night: 2,
    scenario: {
      player: { pos: [20, 0, 18] },
      random_motes: false,
      random_shades: false
    }
  });

  simPad.step(); // stepped onto jump pad
  assert.equal(simPad.player.ballistic_horiz, true, 'Should engage ballistic horizontal trajectory');
  assert.equal(simPad.player.vel[1], 14, 'Y velocity should be 14 m/s');
  assert(Math.abs(Math.hypot(simPad.player.vel[0], simPad.player.vel[2]) - 24) < 0.5, 'Horizontal speed should be 24 m/s');
});

test('Night 3: Tiered terrain (Y=0, Y=3, Y=6) and slope walking', () => {
  const sim = new Sim({
    night: 3,
    scenario: {
      player: { pos: [0, 6, 0] }, // Tier 2 center
      random_motes: false,
      random_shades: false
    }
  });

  sim.step();
  assert.equal(sim.player.grounded, true);
  assert.equal(sim.player.pos[1], 6.0, 'Center tier 2 is at Y=6');
});
