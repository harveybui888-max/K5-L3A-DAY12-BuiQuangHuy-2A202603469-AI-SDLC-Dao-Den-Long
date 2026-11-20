# AGENTS.md — Hướng dẫn cho AI Agents (Đảo Đèn Lồng)

## 1. Thông tin dự án
- **Dự án**: Đảo Đèn Lồng (Lantern Island 3D Game & Headless Simulation)
- **Học phần**: Day 12 — AI SDLC, VinUni AI20K
- **Tác giả**: Bùi Quang Huy (MSSV: 2A202603469)
- **Mốc hiện tại**: Phase 2 — Ba hòn đảo (Đêm 1, Đêm 2, Đêm 3) · Test Contract v1.1

## 2. Quy tắc bắt buộc
1. **Core Sim độc lập tuyệt đối**: Toàn bộ logic trò chơi đặt trong `src/sim/`, thuần JS, không phụ thuộc DOM, không phụ thuộc WebGL/Canvas.
2. **Test Contract v1.1**:
   - `game.contract.json` là single source of truth cho `tuning`.
   - Chế độ headless chạy bằng `node src/headless.js`.
   - Snapshot phải đầy đủ trường: `night`, `wind`, `player.vel`, `grounded`, `invuln`, `dash_cd_s`, `pulse_cd_s`, `charm_s`, và các mảng `motes`, `drifters`, `charms`.
   - Trạng thái Bóng Mực: `spawning`, `wander`, `chase`, `recoil`, `stunned`.
   - Sự kiện mới: `dash`, `charm_picked`, `drifter_steal`, `drifter_drop`, `night_start`, `paused`, `resumed`, `player_hit` (lost: true khi rơi).
3. **Tính tất định (Determinism)**:
   - Cùng `seed`, `scenario`, `inputs` $\rightarrow$ ra cùng kết quả từng byte, dùng PRNG xác định `Mulberry32`.
4. **Kiểm chứng tự động**:
   - Chạy `npm test` để kiểm tra toàn bộ unit tests.
   - Chạy `npm run verify` để kiểm chứng toàn diện determinism và benchmark 21,600 ticks.

## 3. Lệnh thường dùng
```bash
npm install
npm test
npm run verify
node src/headless.js --night 2 --seed 42 --ticks 100
npm start
```
