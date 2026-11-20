import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

test('Benchmark runner generates compliant schema with required performance thresholds', () => {
  const benchOut = path.resolve('test_bench_output.json');
  if (fs.existsSync(benchOut)) fs.unlinkSync(benchOut);

  // Run a short 2s benchmark for fast unit test
  execFileSync('node', ['src/bench.js', '--seed', '42', '--duration', '2', '--out', benchOut]);

  assert.ok(fs.existsSync(benchOut), 'Benchmark output file must exist');
  const data = JSON.parse(fs.readFileSync(benchOut, 'utf8'));

  assert.equal(data.contract_version, '1.3');
  assert.equal(typeof data.avg_fps, 'number');
  assert.equal(typeof data.p1_low_fps, 'number');
  assert.equal(typeof data.frame_ms_p95, 'number');
  assert.equal(typeof data.frames, 'number');
  assert.equal(typeof data.load_ms, 'number');
  assert.equal(typeof data.peak_mem_mb, 'number');
  assert.equal(data.vsync_off, true);
  assert.ok(data.renderer && typeof data.renderer === 'string');
  assert.ok(data.os && typeof data.os === 'string');

  // Performance thresholds
  assert.ok(data.avg_fps >= 60, `avg_fps (${data.avg_fps}) must be >= 60`);
  assert.ok(data.p1_low_fps >= 30, `p1_low_fps (${data.p1_low_fps}) must be >= 30`);
  assert.ok(data.load_ms <= 10000, `load_ms (${data.load_ms}) must be <= 10000`);

  fs.unlinkSync(benchOut);
});

test('Soak test runner handles multi-night cycling with no memory leaks', () => {
  const soakOut = path.resolve('test_soak_output.json');
  if (fs.existsSync(soakOut)) fs.unlinkSync(soakOut);

  // Run 2 nights for quick test
  execFileSync('node', ['src/soak.js', '--seed', '7', '--nights', '2', '--out', soakOut]);

  assert.ok(fs.existsSync(soakOut), 'Soak test output file must exist');
  const data = JSON.parse(fs.readFileSync(soakOut, 'utf8'));

  assert.equal(data.nights, 2);
  assert.equal(data.crashes, 0, 'No crashes allowed in soak test');
  assert.ok(Array.isArray(data.results));
  assert.equal(data.results.length, 2);
  assert.ok(typeof data.mem_start_mb === 'number');
  assert.ok(typeof data.mem_end_mb === 'number');
  assert.ok(data.mem_end_mb <= 1.2 * data.mem_start_mb, `Memory leak detected: ${data.mem_end_mb} > 1.2 * ${data.mem_start_mb}`);

  fs.unlinkSync(soakOut);
});
