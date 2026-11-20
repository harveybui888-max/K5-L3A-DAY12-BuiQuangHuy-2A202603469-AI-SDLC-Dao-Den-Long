import fs from 'node:fs';
import path from 'node:path';
import { Sim } from './sim/sim.js';

function parseArgs(args) {
  const options = {
    seed: 42,
    night: 1,
    ticks: 100,
    snapshotEvery: 0,
    scenarioPath: null,
    inputsPath: null,
    outPath: null
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--seed' && i + 1 < args.length) {
      options.seed = parseInt(args[++i], 10);
      if (isNaN(options.seed)) throw new Error('Invalid --seed parameter');
    } else if (arg === '--night' && i + 1 < args.length) {
      options.night = parseInt(args[++i], 10);
      if (isNaN(options.night)) throw new Error('Invalid --night parameter');
    } else if (arg === '--ticks' && i + 1 < args.length) {
      options.ticks = parseInt(args[++i], 10);
      if (isNaN(options.ticks) || options.ticks < 0) throw new Error('Invalid --ticks parameter');
    } else if (arg === '--snapshot-every' && i + 1 < args.length) {
      options.snapshotEvery = parseInt(args[++i], 10);
      if (isNaN(options.snapshotEvery) || options.snapshotEvery < 0) throw new Error('Invalid --snapshot-every parameter');
    } else if (arg === '--scenario' && i + 1 < args.length) {
      options.scenarioPath = args[++i];
    } else if (arg === '--inputs' && i + 1 < args.length) {
      options.inputsPath = args[++i];
    } else if (arg === '--out' && i + 1 < args.length) {
      options.outPath = args[++i];
    } else if (arg.startsWith('--')) {
      throw new Error(`Unknown option: ${arg}`);
    }
  }

  return options;
}

function loadScenario(p) {
  if (!p) return null;
  const raw = fs.readFileSync(p, 'utf8');
  const data = JSON.parse(raw);
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    throw new Error('Scenario must be an object');
  }
  if (data.motes && !Array.isArray(data.motes)) {
    throw new Error('Scenario motes must be an array');
  }
  return data;
}

function loadInputs(p) {
  if (!p) return null;
  const raw = fs.readFileSync(p, 'utf8');
  const data = JSON.parse(raw);
  if (!data || !Array.isArray(data.frames)) {
    throw new Error('Inputs must have a "frames" array');
  }

  let lastTick = -1;
  for (let i = 0; i < data.frames.length; i++) {
    const f = data.frames[i];
    if (typeof f !== 'object' || f === null) {
      throw new Error(`Frame ${i} must be an object`);
    }
    if (typeof f.tick !== 'number' || !Number.isInteger(f.tick) || f.tick < 0) {
      throw new Error(`Frame ${i} tick must be a non-negative integer`);
    }
    if (f.tick <= lastTick) {
      throw new Error(`Frame ${i} tick must be strictly increasing`);
    }
    lastTick = f.tick;

    if (f.move !== undefined) {
      if (!Array.isArray(f.move) || f.move.length !== 2) {
        throw new Error(`Frame ${i} move must be [x, z]`);
      }
      if (f.move.some((c) => typeof c !== 'number' || c < -1 || c > 1)) {
        throw new Error(`Frame ${i} move coordinates must be within [-1, 1]`);
      }
    }
  }

  return data.frames;
}

export function runHeadless(args) {
  let opts;
  let scenario = null;
  let inputFrames = null;

  try {
    opts = parseArgs(args);
    scenario = loadScenario(opts.scenarioPath);
    inputFrames = loadInputs(opts.inputsPath);
  } catch (err) {
    process.stderr.write(`Error: ${err.message}\n`);
    process.exit(2);
  }

  let tuning = undefined;
  try {
    const contractPath = path.resolve('game.contract.json');
    if (fs.existsSync(contractPath)) {
      tuning = JSON.parse(fs.readFileSync(contractPath, 'utf8')).tuning;
    }
  } catch (e) {}

  const sim = new Sim({
    seed: opts.seed,
    night: opts.night,
    scenario,
    tuning
  });

  const outputLines = [];
  const appendLine = (obj) => {
    outputLines.push(JSON.stringify(obj));
  };

  // Initial Snapshot at tick 0
  appendLine(sim.getSnapshot());

  // Input mapping
  const inputMap = new Map();
  if (inputFrames) {
    for (const f of inputFrames) {
      inputMap.set(f.tick, f);
    }
  }

  let currentInput = {
    move: [0, 0],
    cam_yaw_deg: 0,
    jump: false,
    interact: false,
    pulse: false,
    dash: false,
    pause: false
  };

  let lastSnapshotTick = 0;

  for (let t = 0; t < opts.ticks; t++) {
    if (sim.state === 'won' || sim.state === 'lost') {
      break;
    }

    if (inputMap.has(t)) {
      const f = inputMap.get(t);
      if (f.move !== undefined) currentInput.move = f.move;
      if (f.cam_yaw_deg !== undefined) currentInput.cam_yaw_deg = f.cam_yaw_deg;
      currentInput.jump = !!f.jump;
      currentInput.interact = !!f.interact;
      currentInput.pulse = !!f.pulse;
      currentInput.dash = !!f.dash;
      currentInput.pause = !!f.pause;
    } else {
      currentInput.jump = false;
      currentInput.interact = false;
      currentInput.pulse = false;
      currentInput.dash = false;
      currentInput.pause = false;
    }

    const events = sim.step(currentInput);
    for (const ev of events) {
      appendLine(ev);
    }

    if (opts.snapshotEvery > 0 && sim.tick % opts.snapshotEvery === 0) {
      appendLine(sim.getSnapshot());
      lastSnapshotTick = sim.tick;
    }
  }

  // Ensure final snapshot is present if not just taken
  if (sim.tick !== lastSnapshotTick) {
    appendLine(sim.getSnapshot());
  }

  // End Record
  appendLine(sim.getEnd());

  const resultText = outputLines.join('\n') + '\n';
  if (opts.outPath && opts.outPath !== '-') {
    fs.mkdirSync(path.dirname(path.resolve(opts.outPath)), { recursive: true });
    fs.writeFileSync(opts.outPath, resultText, 'utf8');
  } else {
    process.stdout.write(resultText);
  }

  return 0;
}

// Execute if run directly from CLI
if (process.argv[1] && process.argv[1].endsWith('headless.js')) {
  runHeadless(process.argv.slice(2));
}
