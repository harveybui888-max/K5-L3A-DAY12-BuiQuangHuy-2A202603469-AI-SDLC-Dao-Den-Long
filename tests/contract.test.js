import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { TUNING } from '../src/sim/constants.js';

test('Tuning in src/sim/constants.js matches game.contract.json single source of truth', () => {
  const contract = JSON.parse(fs.readFileSync('game.contract.json', 'utf8'));
  assert.deepEqual(TUNING, contract.tuning);
});
