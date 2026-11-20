# AGENTS.md — Hướng dẫn cho AI Agents (Đảo Đèn Lồng)

## 1. Thông tin dự án
- **Dự án**: Đảo Đèn Lồng (Lantern Island 3D Game & Headless Simulation)
- **Học phần**: Day 12 — AI SDLC, VinUni AI20K
- **Tác giả**: Bùi Quang Huy (MSSV: 2A202603469)
- **Tech stack**: Node.js (ES Modules, zero-heavy-deps), Three.js (Web 3D), built-in Node test runner.

## 2. Quy tắc bắt buộc
1. **Core Sim độc lập tuyệt đối**: Toàn bộ logic trò chơi đặt trong `src/sim/`, thuần JS, không phụ thuộc DOM, không phụ thuộc WebGL/Canvas.
2. **Test Contract v1.0**:
   - `game.contract.json` là single source of truth cho `tuning`.
   - Chế độ headless chạy bằng `node src/headless.js`.
   - Kết quả đầu ra là JSONL streaming (snapshots, events, end).
   - Mã thoát: 0 khi thành công, 2 khi tham số/file scenario/input sai định dạng.
3. **Tính tất định (Determinism)**:
   - Cùng `seed`, `scenario`, `inputs` $\rightarrow$ ra cùng kết quả từng byte, không dùng `Math.random()` không hạt giống hay `Date.now()`.
   - Dùng PRNG xác định (`Mulberry32`).
4. **Kiểm chứng trước khi hoàn thành**:
   - Chạy `npm test` để kiểm tra toàn bộ unit tests và determinism.
   - Không commit code nếu test chưa pass 100%.

## 3. Lệnh thường dùng
```bash
# Cài đặt
npm install

# Chạy test
npm test

# Chạy headless mẫu
node src/headless.js --seed 42 --ticks 100 --out output.jsonl

# Chạy web game 3D
npm start
```
