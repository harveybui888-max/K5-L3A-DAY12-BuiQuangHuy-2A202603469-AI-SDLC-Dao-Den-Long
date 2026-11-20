import test from 'node:test';
import assert from 'node:assert/strict';
import { Sim } from '../src/sim/sim.js';

test('Lit lantern fuel decays naturally at 1.0 unit/second (1/60 per tick)', () => {
  const sim = new Sim({
    scenario: {
      lanterns: [{ id: 'L1', lit: true, fuel: 100, pos: [0, 0, 25] }],
      random_motes: false,
      random_shades: false
    }
  });

  // Step 60 ticks (1 second)
  for (let i = 0; i < 60; i++) {
    sim.step();
  }

  const l1 = sim.lanterns.find((l) => l.id === 'L1');
  assert.equal(l1.lit, true);
  // 100 - 1.0 = 99.0
  assert(Math.abs(l1.fuel - 99.0) < 0.05, `Expected fuel ~ 99.0, got ${l1.fuel}`);
});

test('Lantern with fuel <= 0 extinguishes, sets deposited=0, ever_lit=true, and emits lantern_out', () => {
  const sim = new Sim({
    scenario: {
      lanterns: [{ id: 'L1', lit: true, fuel: 0.02, pos: [0, 0, 25] }], // will decay to 0 within 2 ticks
      random_motes: false,
      random_shades: false
    }
  });

  let outEvent = null;
  for (let i = 0; i < 5; i++) {
    const events = sim.step();
    const ev = events.find((e) => e.name === 'lantern_out');
    if (ev) outEvent = ev;
  }

  assert(outEvent !== null, 'Should emit lantern_out event');
  assert.equal(outEvent.data.lantern_id, 'L1');

  const l1 = sim.lanterns.find((l) => l.id === 'L1');
  assert.equal(l1.lit, false);
  assert.equal(l1.fuel, 0);
  assert.equal(l1.deposited, 0);
  assert.equal(l1.ever_lit, true);
});

test('Refuel lit lantern restores 10 fuel per mote and emits refuel event', () => {
  const sim = new Sim({
    scenario: {
      player: { pos: [0, 0, 24], carried: 3 },
      lanterns: [{ id: 'L1', lit: true, fuel: 75, pos: [0, 0, 25] }],
      random_motes: false,
      random_shades: false
    }
  });

  // Needed: ceil((100 - 75)/10) = ceil(2.5) = 3 motes
  const events = sim.step({ interact: true });
  assert.equal(sim.player.carried, 0);

  const l1 = sim.lanterns.find((l) => l.id === 'L1');
  assert.equal(l1.fuel, 100);
  assert.equal(sim.score, 15); // 3 * 5 = +15

  const refuelEv = events.find((e) => e.name === 'refuel');
  assert(refuelEv !== null, 'Should emit refuel event');
  assert.equal(refuelEv.data.amount, 3);
  assert.equal(refuelEv.data.fuel, 100);
});

test('Relighting an ever_lit lantern only costs 5 motes and awards +40 (plus 5*5=25 deposit score)', () => {
  const sim = new Sim({
    scenario: {
      player: { pos: [0, 0, 24], carried: 5 },
      lanterns: [{ id: 'L1', lit: false, ever_lit: true, deposited: 0, pos: [0, 0, 25] }],
      random_motes: false,
      random_shades: false
    }
  });

  const events = sim.step({ interact: true });
  assert.equal(sim.player.carried, 0);

  const l1 = sim.lanterns.find((l) => l.id === 'L1');
  assert.equal(l1.lit, true);
  assert.equal(l1.fuel, 100);
  assert.equal(l1.relit_count, 1);
  assert.equal(sim.score, 65); // 5 * 5 (deposit) + 40 (relight) = 65

  const litEv = events.find((e) => e.name === 'lantern_lit');
  assert(litEv !== null);
  assert.equal(litEv.data.relight, true);
});

test('Dynamic capacity increases by 2 per successful light up to max 20', () => {
  const sim = new Sim({
    scenario: {
      player: { pos: [0, 0, 0], successful_lights: 3 }
    }
  });

  // 10 + 2 * 3 = 16
  assert.equal(sim.player.capacity, 16);

  sim.player.successful_lights = 8;
  // 10 + 2 * 8 = 26 -> capped at 20
  assert.equal(sim.player.capacity, 20);
});
