import test from 'node:test';
import assert from 'node:assert/strict';
import { Sim } from '../src/sim/sim.js';

test('Wind Charm gives 600 ticks buff: speed 7.2 m/s, 0s dash cooldown, and respawns after 2700 ticks', () => {
  const sim = new Sim({
    night: 2,
    scenario: {
      player: { pos: [0, 0, 0], carried: 0 },
      charms: [{ id: 'C1', pos: [0, 0, 0.5], available: true }],
      random_motes: false,
      random_shades: false
    }
  });

  const events = sim.step();
  assert(events.some((e) => e.name === 'charm_picked'), 'Should emit charm_picked');
  assert.equal(sim.player.charm_ticks, 600);

  const c1 = sim.charms.find((c) => c.id === 'C1');
  assert.equal(c1.available, false);
  assert.equal(c1.respawn_ticks, 2700);

  // Test speed is 7.2 m/s
  for (let i = 0; i < 60; i++) {
    sim.step({ move: [0, 1] });
  }
  // 60 ticks * 7.2 m/s / 60 = 7.2m
  assert(Math.abs(sim.player.pos[2] - 7.2) < 0.1, `Expected pos[2] ~ 7.2, got ${sim.player.pos[2]}`);

  // Test dash cooldown is 0s (can dash consecutive times)
  sim.step({ dash: true });
  assert.equal(sim.player.dash_cd_ticks, 0, 'Dash cooldown should be 0 while under charm');
});
