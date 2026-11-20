import test from 'node:test';
import assert from 'node:assert/strict';
import { Sim } from '../src/sim/sim.js';

test('Dash moves at 14 m/s for 12 ticks (0.2s) in facing direction', () => {
  const sim = new Sim({
    scenario: {
      player: { pos: [0, 0, 0] },
      random_motes: false,
      random_shades: false
    }
  });

  // Player facing +Z by default
  const ev = sim.step({ dash: true });
  assert(ev.some((e) => e.name === 'dash'), 'Should emit dash event');
  assert.equal(sim.player.dash_timer_ticks, 12);

  // Step 12 ticks of dash
  for (let i = 0; i < 12; i++) {
    sim.step();
  }

  // Distance traveled: 14 m/s * 0.2s = 2.8m
  assert.equal(sim.player.pos[0], 0);
  assert(Math.abs(sim.player.pos[2] - 2.8) < 0.05, `Expected pos[2] ~ 2.8, got ${sim.player.pos[2]}`);
});

test('Dash has 90 ticks (1.5s) cooldown and cannot be used during cooldown', () => {
  const sim = new Sim({
    scenario: {
      player: { pos: [0, 0, 0] },
      random_motes: false,
      random_shades: false
    }
  });

  sim.step({ dash: true });
  assert(sim.player.dash_cd_ticks > 0);

  // Finish dash (12 ticks total)
  for (let i = 0; i < 11; i++) {
    sim.step();
  }

  const posAfterDash = sim.player.pos[2];

  // Try dashing again while on cooldown
  const ev2 = sim.step({ dash: true });
  assert.equal(ev2.some((e) => e.name === 'dash'), false, 'Should not dash while on cooldown');
  assert.equal(sim.player.pos[2], posAfterDash, 'Position should not jump');
});

test('Dash while airborne preserves altitude (locks vertical velocity to 0)', () => {
  const sim = new Sim({
    scenario: {
      player: { pos: [0, 5, 0] },
      random_motes: false,
      random_shades: false
    }
  });

  // Start in air, initiate dash
  sim.step({ dash: true });
  for (let i = 0; i < 11; i++) {
    sim.step();
  }

  assert.equal(sim.player.pos[1], 5, 'Altitude should be preserved at Y=5 during air dash');
});
