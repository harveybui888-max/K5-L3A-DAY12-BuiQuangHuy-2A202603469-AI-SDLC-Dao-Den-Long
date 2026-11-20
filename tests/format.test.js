import test from 'node:test';
import assert from 'node:assert/strict';
import { Sim } from '../src/sim/sim.js';

test('Snapshot format v1.2 matches contract schema exactly', () => {
  const sim = new Sim({ night: 2, seed: 101 });
  const snap = sim.getSnapshot();

  assert.equal(snap.type, 'snapshot');
  assert.equal(typeof snap.tick, 'number');
  assert.equal(typeof snap.sim_tick, 'number');
  assert.equal(typeof snap.night, 'number');
  assert.equal(snap.night, 2);
  assert.equal(typeof snap.time_left_s, 'number');
  assert.equal(typeof snap.score, 'number');

  // Wind
  assert(typeof snap.wind === 'object');
  assert(typeof snap.wind.active === 'boolean');
  assert(typeof snap.wind.dir_deg === 'number');

  // Player v1.2: capacity included
  assert(Array.isArray(snap.player.pos) && snap.player.pos.length === 3);
  assert(Array.isArray(snap.player.vel) && snap.player.vel.length === 3);
  assert(typeof snap.player.flames, 'number');
  assert(typeof snap.player.carried, 'number');
  assert(typeof snap.player.capacity, 'number');
  assert.equal(snap.player.capacity, 10);
  assert(typeof snap.player.grounded, 'boolean');
  assert(typeof snap.player.invuln, 'boolean');
  assert(typeof snap.player.dash_cd_s, 'number');
  assert(typeof snap.player.pulse_cd_s, 'number');
  assert(typeof snap.player.charm_s, 'number');

  // Lanterns v1.2: fuel, ever_lit, relit_count included
  assert(Array.isArray(snap.lanterns));
  assert(snap.lanterns.length > 0);
  const l0 = snap.lanterns[0];
  assert(typeof l0.fuel, 'number');
  assert(typeof l0.ever_lit, 'boolean');
  assert(typeof l0.relit_count, 'number');

  // Collections
  assert(Array.isArray(snap.shades));
  assert(Array.isArray(snap.motes));
  assert(Array.isArray(snap.drifters));
  assert(Array.isArray(snap.charms));
});
