# CLAUDE.md — Quick Reference for Claude

## Commands
- Build / Install: `npm install`
- Test: `npm test`
- Verification pipeline: `npm run verify`
- Headless simulation: `node src/headless.js --night 1 --seed 42 --ticks 100`
- Run 3D Game: `npm start` (opens on http://localhost:3000)

## Phase 2 Features (Test Contract v1.1)
- 3 Nights: Night 1 (Đảo Bến), Night 2 (Đảo Cau), Night 3 (Đảo Chuông).
- Movement: Run 6 m/s, Jump 7 m/s (gravity -20 m/s²), Dash 14 m/s (0.2s duration, 1.5s cd).
- Entities:
  - Motes (carry 10, pickup r=1m h=1.5m, random/dropped kinds).
  - Lanterns (cost 10, interact r=2m, safe zone 6m).
  - Shades (speed 4.0 m/s or 4.5 m/s in N3, states: spawning/wander/chase/recoil/stunned).
  - Drifters (speed 7 m/s, steal min(3, carried), states: idle/chase/flee/removed).
  - Charms (C1/C2, speed boost 7.2 m/s, 0s dash cd for 600 ticks, respawn 2700 ticks).
- Pause mechanism: freezes sim_tick, timers, TTL.
- Fall off island: Y < -10 respawns after 60 ticks with -1 flame and lost motes.
