# CLAUDE.md — Quick Reference for Claude

## Commands
- Build / Install: `npm install`
- Test: `npm test`
- Verification pipeline: `npm run verify`
- Headless simulation: `node src/headless.js --seed 42 --ticks 100`
- Run 3D Game: `npm start` (opens on http://localhost:3000)

## Code Architecture
- `src/sim/`: Deterministic 60Hz tick simulation core (pure logic).
- `src/headless.js`: Headless CLI complying with Test Contract v1.0.
- `public/`: Web 3D client using Three.js and Web Audio API.
- `tests/`: Automated unit, determinism, and CLI tests.
- `docs/spec/`: Acceptance criteria for each phase.
- `docs/notes/`: Phase notes, AI usage, and retro.
- `docs/proof/`: Verification evidence and logs.
