import fs from 'node:fs';
import path from 'node:path';

const DATA_DIR = path.resolve('data');
const LEADERBOARD_FILE = path.join(DATA_DIR, 'leaderboard.json');

export function loadLeaderboard() {
  try {
    if (fs.existsSync(LEADERBOARD_FILE)) {
      const raw = fs.readFileSync(LEADERBOARD_FILE, 'utf8');
      const data = JSON.parse(raw);
      if (Array.isArray(data.entries)) {
        return data.entries;
      }
    }
  } catch (e) {}
  return [];
}

export function saveLeaderboard(entries) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify({ entries }, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to save leaderboard:', e.message);
  }
}

export function validateName(name) {
  if (typeof name !== 'string') return false;
  const trimmed = name.trim();
  // Support 3-12 characters: alphanumeric, underscore, and Vietnamese accented characters
  if (trimmed.length < 3 || trimmed.length > 12) return false;
  return /^[\p{L}\p{N}_]{3,12}$/u.test(trimmed);
}

export function addLeaderboardEntry({ name, score, nights_won, seed, achieved_at }) {
  if (!validateName(name)) {
    throw new Error('Name must be 3-12 alphanumeric characters or underscore');
  }

  const entries = loadLeaderboard();
  const newEntry = {
    name: name.trim(),
    score: Number(score) || 0,
    nights_won: Math.min(3, Math.max(0, Number(nights_won) || 0)),
    achieved_at: achieved_at || new Date().toISOString(),
    seed: Number(seed) || 42
  };

  entries.push(newEntry);

  // Sort descending by score; on tie earlier achieved_at wins
  entries.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return new Date(a.achieved_at) - new Date(b.achieved_at);
  });

  // Keep top 10
  const top10 = entries.slice(0, 10);
  saveLeaderboard(top10);
  return top10;
}

export function exportLeaderboard(outPath) {
  const entries = loadLeaderboard();
  const resolved = path.resolve(outPath);
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  fs.writeFileSync(resolved, JSON.stringify({ entries }, null, 2), 'utf8');
  return entries;
}
