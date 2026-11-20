import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { Sim } from '../src/sim/sim.js';

test('Simulation is 100% deterministic with identical seed and inputs', () => {
  const runSim = (seed) => {
    const sim = new Sim({ seed });
    const snapshots = [];
    snapshots.push(sim.getSnapshot());

    for (let t = 0; t < 600; t++) {
      // Deterministic inputs
      const move = [Math.sin(t * 0.1), Math.cos(t * 0.1)];
      const interact = t % 100 === 0;
      const pulse = t % 150 === 0;
      sim.step({ move, interact, pulse });
      if (t % 60 === 0) {
        snapshots.push(sim.getSnapshot());
      }
    }
    snapshots.push(sim.getEnd());
    return JSON.stringify(snapshots);
  };

  const output1 = runSim(42);
  const output2 = runSim(42);

  const hash1 = crypto.createHash('sha256').update(output1).digest('hex');
  const hash2 = crypto.createHash('sha256').update(output2).digest('hex');

  assert.equal(hash1, hash2, 'Hash of identical runs must match exactly');
});
