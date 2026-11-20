import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const CLI = path.resolve('src/headless.js');

test('Headless CLI runs with --seed and --ticks, exits with 0 and writes JSONL', () => {
  const tmpOut = path.join(os.tmpdir(), `headless_test_${Date.now()}.jsonl`);
  const r = spawnSync(process.execPath, [CLI, '--seed', '123', '--ticks', '100', '--out', tmpOut], {
    encoding: 'utf8'
  });

  assert.equal(r.status, 0);
  assert(fs.existsSync(tmpOut));

  const lines = fs.readFileSync(tmpOut, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  assert(lines.length >= 2);
  assert.equal(lines[0].type, 'snapshot');
  assert.equal(lines[0].tick, 0);
  assert.equal(lines.at(-1).type, 'end');
  assert.equal(lines.at(-1).ticks, 100);

  fs.unlinkSync(tmpOut);
});

test('Headless CLI exits with code 2 on invalid parameters or corrupt files', () => {
  const r1 = spawnSync(process.execPath, [CLI, '--ticks', '-5'], { encoding: 'utf8' });
  assert.equal(r1.status, 2);

  const r2 = spawnSync(process.execPath, [CLI, '--scenario', 'non_existent_file.json'], { encoding: 'utf8' });
  assert.equal(r2.status, 2);
});
