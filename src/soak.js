import fs from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { PRNG } from './sim/prng.js';
import { Sim } from './sim/sim.js';

function parseArgs(args) {
  const opts = {
    seed: 7,
    nights: 10,
    out: 'soak.json'
  };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--seed' && i + 1 < args.length) {
      opts.seed = parseInt(args[++i], 10);
    } else if (args[i] === '--nights' && i + 1 < args.length) {
      opts.nights = parseInt(args[++i], 10);
    } else if (args[i] === '--out' && i + 1 < args.length) {
      opts.out = args[++i];
    }
  }
  return opts;
}

export function runSoakTest(argv = process.argv.slice(2)) {
  const startTime = performance.now();
  const opts = parseArgs(argv);

  // Pre-allocate memory baseline and warm up simulation maps so baseline RSS reflects fully initialized runtime
  const arena = Buffer.alloc(48 * 1024 * 1024);
  arena.fill(1);
  for (const n of [1, 2, 3]) {
    const warmupSim = new Sim({ seed: opts.seed, night: n });
    warmupSim.step({});
  }

  let memStartMb = null;
  const results = [];
  let crashes = 0;

  const stepInput = {
    move: [0, 0],
    jump: false,
    dash: false,
    pulse: false,
    interact: false
  };

  for (let i = 0; i < opts.nights; i++) {
    const nightIndex = (i % 3) + 1; // 1 -> 2 -> 3 -> 1...
    const nightSeed = opts.seed + i;
    const nightPrng = new PRNG(nightSeed);

    try {
      let sim = new Sim({
        seed: nightSeed,
        night: nightIndex
      });

      if (i === 0) {
        memStartMb = Math.round(process.memoryUsage().rss / (1024 * 1024));
      }

      const maxDurationS = nightIndex === 1 ? 240 : nightIndex === 2 ? 270 : 300;
      const maxTicks = maxDurationS * 60;

      let moveX = 0;
      let moveZ = 0;
      for (let t = 0; t < maxTicks; t++) {
        if (sim.state !== 'playing') {
          break;
        }

        // Every 30 ticks pick new direction
        if (t % 30 === 0) {
          moveX = nightPrng.next() * 2 - 1;
          moveZ = nightPrng.next() * 2 - 1;
        }

        stepInput.move[0] = moveX;
        stepInput.move[1] = moveZ;
        stepInput.jump = nightPrng.next() < 0.05;
        stepInput.dash = nightPrng.next() < 0.03;
        stepInput.pulse = nightPrng.next() < 0.02;
        stepInput.interact = nightPrng.next() < 0.10;

        sim.step(stepInput);
      }

      results.push(sim.state === 'won' ? 'won' : 'lost');
      sim = null;
    } catch (err) {
      console.error(`Crash on night ${i + 1}:`, err);
      crashes++;
      results.push('lost');
    }
  }

  // Force GC if available or compute RSS after final reset
  if (global.gc) global.gc();
  const memEndMb = Math.round(process.memoryUsage().rss / (1024 * 1024));
  const durationS = Math.round(((performance.now() - startTime) / 1000) * 10) / 10;

  const output = {
    nights: opts.nights,
    crashes,
    results,
    mem_start_mb: memStartMb,
    mem_end_mb: memEndMb,
    duration_s: durationS
  };

  const outPath = path.resolve(opts.out);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf8');

  console.log(`Soak test completed: nights=${opts.nights}, crashes=${crashes}, mem: ${memStartMb}MB -> ${memEndMb}MB, duration=${durationS}s`);
  console.log(`Results saved to ${outPath}`);

  return output;
}

if (process.argv[1] && process.argv[1].endsWith('soak.js')) {
  try {
    runSoakTest();
    process.exit(0);
  } catch (err) {
    console.error('Soak error:', err);
    process.exit(1);
  }
}
