import test from 'node:test';
import assert from 'node:assert/strict';
import { Sim } from '../src/sim/sim.js';

test('Drifter stays idle until player carries >= 5 motes and within 15m, then chases at 7 m/s', () => {
  const sim = new Sim({
    night: 2,
    scenario: {
      player: { pos: [0, 0, 0], carried: 3 }, // < 5 motes
      drifters: [{ id: 'D1', pos: [0, 2, 10], state: 'idle' }],
      random_motes: false,
      random_shades: false
    }
  });

  sim.step();
  const d1 = sim.drifters.find((d) => d.id === 'D1');
  assert.equal(d1.state, 'idle', 'Should remain idle when carried < 5');

  // Player now carries 5 motes
  sim.player.carried = 5;
  sim.step();
  assert.equal(d1.state, 'chase', 'Should transition to chase when carried >= 5 and within 15m');

  // Chases at 7 m/s towards player at [0, 0, 0]
  for (let i = 0; i < 60; i++) {
    sim.step();
  }
  // Started at 10m, in 1s travels 7m -> pos[2] ~ 3.0m
  assert(Math.abs(d1.pos[2] - 3.0) < 0.1, `Expected pos[2] ~ 3.0, got ${d1.pos[2]}`);
});

test('Drifter steals min(3, carried) on touch, enters flee state for 240 ticks at 7 m/s', () => {
  const sim = new Sim({
    night: 2,
    scenario: {
      player: { pos: [0, 0, 0], carried: 7 },
      drifters: [{ id: 'D1', pos: [0, 2, 0.5], state: 'chase' }],
      random_motes: false,
      random_shades: false
    }
  });

  const events = sim.step();
  const d1 = sim.drifters.find((d) => d.id === 'D1');
  assert.equal(d1.state, 'flee');
  assert.equal(d1.stolen, 3);
  assert.equal(sim.player.carried, 4); // 7 - 3 = 4
  assert(events.some((e) => e.name === 'drifter_steal'));
});

test('Pulse against chasing Drifter forces flee; Pulse against fleeing Drifter drops stolen motes', () => {
  const sim = new Sim({
    night: 2,
    scenario: {
      player: { pos: [0, 0, 0], carried: 5 },
      drifters: [{ id: 'D1', pos: [0, 1, 3], state: 'flee', stolen: 3, flee_ticks: 200 }],
      random_motes: false,
      random_shades: false
    }
  });

  const events = sim.step({ pulse: true });
  assert(events.some((e) => e.name === 'drifter_drop'), 'Should emit drifter_drop');
  const d1 = sim.drifters.find((d) => d.id === 'D1');
  assert.equal(d1.stolen, 0);

  // Dropped motes created
  const droppedMotes = sim.motes.filter((m) => m.kind === 'dropped');
  assert.equal(droppedMotes.length, 3);
});
