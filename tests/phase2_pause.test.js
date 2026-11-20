import test from 'node:test';
import assert from 'node:assert/strict';
import { Sim } from '../src/sim/sim.js';

test('Pause input toggles paused state, freezing sim_tick, clock, and entity timers', () => {
  const sim = new Sim({
    scenario: {
      player: { pos: [0, 0, 0] },
      random_motes: false,
      random_shades: false
    }
  });

  const evPause = sim.step({ pause: true });
  assert(evPause.some((e) => e.name === 'paused'));
  assert.equal(sim.state, 'paused');
  assert.equal(sim.sim_tick, 0); // sim_tick frozen
  assert.equal(sim.tick, 1);

  const initialTime = sim.time_left_s;

  // Step 10 ticks while paused
  for (let i = 0; i < 10; i++) {
    sim.step({ move: [0, 1] }); // moving input ignored while paused
  }

  assert.equal(sim.sim_tick, 0);
  assert.equal(sim.time_left_s, initialTime);
  assert.deepEqual(sim.player.pos, [0, 0, 0]);

  // Unpause
  const evResume = sim.step({ pause: true });
  assert(evResume.some((e) => e.name === 'resumed'));
  assert.equal(sim.state, 'playing');

  // Next step should tick
  sim.step({ move: [0, 1] });
  assert.equal(sim.sim_tick, 2);
  assert(sim.time_left_s < initialTime);
});
