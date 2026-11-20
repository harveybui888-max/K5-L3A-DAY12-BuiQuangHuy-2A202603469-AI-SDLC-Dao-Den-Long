import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const contractPath = path.resolve(__dirname, '../../game.contract.json');
export const CONTRACT = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
export const TUNING = CONTRACT.tuning;

export const WORLD = {
  island_radius: 40.0,
  lantern_ring_radius: 25.0,
  mote_inner_radius: 5.0,
  mote_outer_radius: 33.0,
  initial_motes_count: 30,
  mote_respawn_interval_ticks: 240, // 4s at 60Hz
  initial_shades_count: 2,
  shade_spawn_radius: 36.0,
  shade_spawn_interval_ticks: 1800, // 30s at 60Hz
  max_shades_count: 6,
  tick_hz: 60,
  dt: 1 / 60
};
