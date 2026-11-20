import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { validateName, addLeaderboardEntry, loadLeaderboard, exportLeaderboard } from '../src/leaderboard.js';

test('Leaderboard name validation supports 3-12 characters (alphanumeric, underscore, unicode)', () => {
  assert.equal(validateName('Player1'), true);
  assert.equal(validateName('Thợ_Săn_99'), true);
  assert.equal(validateName('May_May'), true);
  assert.equal(validateName('abc'), true);
  assert.equal(validateName('abcdefghijkl'), true); // 12 chars

  // Invalid cases
  assert.equal(validateName('ab'), false); // Too short (< 3)
  assert.equal(validateName('abcdefghijklm'), false); // Too long (> 12)
  assert.equal(validateName('player@123'), false); // Special symbol
  assert.equal(validateName('player space'), false); // Space
  assert.equal(validateName(''), false);
  assert.equal(validateName(null), false);
});

test('Leaderboard maintains top 10 sorted descending by score and earlier timestamp on tie', () => {
  // Clear or mock test file
  const testExport = path.resolve('data/test_lb_export.json');
  if (fs.existsSync(testExport)) fs.unlinkSync(testExport);

  // Add 12 entries
  const baseTime = 1700000000000;
  for (let i = 1; i <= 12; i++) {
    addLeaderboardEntry({
      name: `User_${i}`,
      score: i * 50,
      nights_won: i % 4,
      seed: 42,
      achieved_at: new Date(baseTime + i * 1000).toISOString()
    });
  }

  // Tie breaker check: same score 600, earlier timestamp should rank higher
  addLeaderboardEntry({
    name: `User_Early`,
    score: 600,
    nights_won: 3,
    seed: 42,
    achieved_at: new Date(baseTime - 10000).toISOString()
  });

  const lb = loadLeaderboard();
  assert.ok(lb.length <= 10, 'Leaderboard must keep top 10');
  assert.equal(lb[0].score >= lb[1].score, true, 'Scores must be sorted descending');

  // Find User_Early vs User_12 (both 600 score)
  const idxEarly = lb.findIndex(e => e.name === 'User_Early');
  const idx12 = lb.findIndex(e => e.name === 'User_12');
  if (idxEarly !== -1 && idx12 !== -1) {
    assert.ok(idxEarly < idx12, 'Earlier achieved_at must rank higher on tie');
  }

  // Test Export
  exportLeaderboard(testExport);
  assert.ok(fs.existsSync(testExport));
  const exported = JSON.parse(fs.readFileSync(testExport, 'utf8'));
  assert.ok(Array.isArray(exported.entries));
  assert.equal(exported.entries.length, lb.length);

  fs.unlinkSync(testExport);
});

test('CLI supports --export-leaderboard <path>', () => {
  const cliExport = path.resolve('data/cli_lb_export.json');
  if (fs.existsSync(cliExport)) fs.unlinkSync(cliExport);

  execFileSync('node', ['src/headless.js', '--export-leaderboard', cliExport]);

  assert.ok(fs.existsSync(cliExport), 'Exported file must exist');
  const content = JSON.parse(fs.readFileSync(cliExport, 'utf8'));
  assert.ok(Array.isArray(content.entries));

  fs.unlinkSync(cliExport);
});
