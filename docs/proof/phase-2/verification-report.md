# Bằng chứng kiểm chứng Phase 2 (Proof Report)

- **Ngày chạy**: 2026-11-20T08:32:59.777Z
- **Node.js**: v22.12.0
- **Nền tảng**: win32 x64
- **Phiên bản Contract**: Test Contract v1.1 (`game.contract.json`)

## 1. Kết quả kiểm thử tự động (Unit & Feature Tests)
- **Test Suite**: 30/30 tests passed
  - `tests/cli.test.js`: 2 tests (Mã thoát 0 và 2, JSONL streaming)
  - `tests/contract.test.js`: 1 test (Tuning single source of truth)
  - `tests/determinism.test.js`: 1 test (Tất định SHA-256)
  - `tests/format.test.js`: 1 test (Snapshot v1.1 schema)
  - `tests/lanterns.test.js`: 2 tests (Nạp đom đóm, thắp đèn cost=10)
  - `tests/motes.test.js`: 2 tests (Nhặt đom đóm r=1.0m, sức chứa 10)
  - `tests/movement.test.js`: 3 tests (Tốc độ 6 m/s, chuẩn hóa, rơi khỏi đảo)
  - `tests/pulse.test.js`: 2 tests (Tỏa Sáng cost=3, bán kính 5m 3D, điểm +5)
  - `tests/shades.test.js`: 3 tests (Bóng Mực 4.0 m/s, recoil 2m, an toàn 6.0m)
  - `tests/phase2_dash.test.js`: 3 tests (Lướt 14 m/s trong 0.2s, hồi chiêu 1.5s, khóa cao độ trên không)
  - `tests/phase2_jump_fall.test.js`: 3 tests (Nhảy 7 m/s, trọng lực -20 m/s², rơi void Y < -10 mất 1 lửa và hồi sinh sau 60 ticks)
  - `tests/phase2_drifters.test.js`: 3 tests (Gió Lạc đuổi khi có >= 5 đom đóm, cướp 3, Tỏa Sáng rớt đom đóm)
  - `tests/phase2_charms.test.js`: 1 test (Bùa Gió 7.2 m/s, 0s lướt, hồi lại sau 2700 ticks)
  - `tests/phase2_night2_3.test.js`: 2 tests (Cầu tre & bục nhảy Đêm 2; địa hình 3 tầng Đêm 3)
  - `tests/phase2_pause.test.js`: 1 test (Tạm dừng đóng băng sim_tick và đồng hồ)

## 2. Kịch bản Headless & Kiểm tra 3 Đêm
- `quick-win` scenario: Đạt
- `night_1` (Đảo Bến): Đạt
- `night_2` (Đảo Cau): Đạt
- `night_3` (Đảo Chuông): Đạt

## 3. Tính tất định (Determinism Check)
- SHA-256 (1200 ticks, seed 42, Night 2): `2ff9669f73e11bc02471ac40fb02e4c4e6fa4f581052d716bcab992969f49ceb`
- So sánh 2 tiến trình độc lập: **TRÙNG KHỚP 100% TỪNG BYTE**.

## 4. Hiệu năng mô phỏng (Benchmark full night 360s = 21,600 ticks)
- Thời gian mô phỏng 21,600 tick: **173.20 ms**
- Tốc độ xử lý: **124712 tick/giây** (vượt xa yêu cầu $le 30$s, hoàn thành chỉ trong chưa đầy 1 giây).
