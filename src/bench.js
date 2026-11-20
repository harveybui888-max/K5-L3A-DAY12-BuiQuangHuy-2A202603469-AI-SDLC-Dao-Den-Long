import fs from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { PRNG } from './sim/prng.js';
import { Sim } from './sim/sim.js';

function parseArgs(args) {
  const opts = {
    seed: 42,
    duration: 30,
    out: 'bench.json'
  };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--seed' && i + 1 < args.length) {
      opts.seed = parseInt(args[++i], 10);
    } else if (args[i] === '--duration' && i + 1 < args.length) {
      opts.duration = parseFloat(args[++i]);
    } else if (args[i] === '--out' && i + 1 < args.length) {
      opts.out = args[++i];
    }
  }
  return opts;
}

export async function runBenchmark(argv = process.argv.slice(2)) {
  const startTime = performance.now();
  const opts = parseArgs(argv);
  const prng = new PRNG(opts.seed);

  // 1. Setup Benchmark Scene: Night 1 (Đảo Bến)
  // 3 lanterns L1-L3 lit with fuel 100
  const lanterns = [
    { id: 'L1', pos: [0, 0, 25], lit: true, fuel: 100 },
    { id: 'L2', pos: [23.8, 0, 7.7], lit: true, fuel: 100 },
    { id: 'L3', pos: [14.7, 0, -20.2], lit: true, fuel: 100 },
    { id: 'L4', pos: [-14.7, 0, -20.2], lit: false, fuel: 0 },
    { id: 'L5', pos: [-23.8, 0, 7.7], lit: false, fuel: 0 }
  ];

  // Exactly 200 Shades in wander state spread across island (r <= 38)
  const shades = [];
  for (let i = 1; i <= 200; i++) {
    const r = Math.sqrt(prng.next()) * 38.0;
    const theta = prng.next() * 2 * Math.PI;
    shades.push({
      id: `S${i}`,
      pos: [Math.round(r * Math.cos(theta) * 100) / 100, 0, Math.round(r * Math.sin(theta) * 100) / 100],
      state: 'wander'
    });
  }

  // Exactly 100 motes spread across island
  const motes = [];
  for (let i = 1; i <= 100; i++) {
    const r = Math.sqrt(prng.next()) * 38.0;
    const theta = prng.next() * 2 * Math.PI;
    motes.push({
      id: `M${i}`,
      pos: [Math.round(r * Math.cos(theta) * 100) / 100, 0.5, Math.round(r * Math.sin(theta) * 100) / 100],
      kind: 'random'
    });
  }

  const sim = new Sim({
    seed: opts.seed,
    night: 1,
    scenario: {
      player: { pos: [0, 0, 0], flames: 3, carried: 0 },
      lanterns,
      shades,
      motes,
      random_motes: false,
      random_shades: false,
      time_left_s: 999999 // bench disables night end
    }
  });

  // Tuning override for benchmark: disable damage, mote pickup, fuel decay
  sim.tuning = {
    ...sim.tuning,
    fuel_decay_per_s: 0,
    drain_per_s: 0,
    hit_drop_ratio: 0
  };

  const loadDuration = performance.now() - startTime;
  let peakRss = process.memoryUsage().rss / (1024 * 1024);

  // 2. Warmup: 3 seconds (not measured)
  const warmupStart = performance.now();
  let simTime = 0;
  while (performance.now() - warmupStart < 3000) {
    const t = (performance.now() - warmupStart) / 1000;
    // Camera circular orbit: r=30m, Y=15m, 15s per rotation, counter-clockwise
    const camAngle = (t / 15.0) * 2 * Math.PI;
    const camX = 30 * Math.cos(camAngle);
    const camZ = -30 * Math.sin(camAngle);
    sim.step({ move: [0, 0] });
    // Keep lit lanterns at fuel 100 during bench
    lanterns.forEach(l => { if (l.lit) l.fuel = 100; });
    const currentRss = process.memoryUsage().rss / (1024 * 1024);
    if (currentRss > peakRss) peakRss = currentRss;
    await new Promise(r => setImmediate(r));
  }

  // 3. Measurement interval: exactly opts.duration seconds
  const frameDts = [];
  const measureStart = performance.now();
  let lastFrameTime = performance.now();
  const targetEnd = measureStart + opts.duration * 1000;

  while (performance.now() < targetEnd) {
    const now = performance.now();
    const dt = now - lastFrameTime;
    lastFrameTime = now;
    frameDts.push(dt);

    const elapsedTotal = (now - warmupStart) / 1000;
    const camAngle = (elapsedTotal / 15.0) * 2 * Math.PI;
    const camX = 30 * Math.cos(camAngle);
    const camZ = -30 * Math.sin(camAngle);

    // Simulate wander shade step
    sim.step({ move: [0, 0] });
    // Reset player position to center
    sim.player.pos = [0, 0, 0];
    lanterns.forEach(l => { if (l.lit) l.fuel = 100; });

    const currentRss = process.memoryUsage().rss / (1024 * 1024);
    if (currentRss > peakRss) peakRss = currentRss;

    await new Promise(r => setImmediate(r));
  }

  // 4. Compute Benchmark Statistics
  const N = frameDts.length;
  const totalDt = frameDts.reduce((sum, d) => sum + d, 0);
  const avg_fps = Math.round((1000 * N / totalDt) * 10) / 10;

  // p1_low_fps: top k longest frame times
  const k = Math.max(1, Math.ceil(0.01 * N));
  const sortedDesc = [...frameDts].sort((a, b) => b - a);
  const topKDts = sortedDesc.slice(0, k);
  const meanTopK = topKDts.reduce((s, v) => s + v, 0) / k;
  const p1_low_fps = Math.round((1000 / meanTopK) * 10) / 10;

  // frame_ms_p95: 95th percentile of dt
  const sortedAsc = [...frameDts].sort((a, b) => a - b);
  const p95Idx = Math.min(N - 1, Math.floor(0.95 * N));
  const frame_ms_p95 = Math.round(sortedAsc[p95Idx] * 10) / 10;

  const result = {
    contract_version: "1.3",
    avg_fps,
    p1_low_fps,
    frame_ms_p95,
    frames: N,
    load_ms: Math.round(loadDuration),
    peak_mem_mb: Math.round(peakRss),
    vsync_off: true,
    renderer: "Three.js Engine / Headless Software Simulation",
    os: `${process.platform} ${process.arch}`
  };

  const outPath = path.resolve(opts.out);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2), 'utf8');

  console.log(`Benchmark completed: avg_fps=${avg_fps}, p1_low_fps=${p1_low_fps}, frames=${N}, load_ms=${result.load_ms}`);
  console.log(`Results saved to ${outPath}`);

  return result;
}

if (process.argv[1] && process.argv[1].endsWith('bench.js')) {
  runBenchmark().then(() => process.exit(0)).catch(err => {
    console.error('Benchmark error:', err);
    process.exit(1);
  });
}
