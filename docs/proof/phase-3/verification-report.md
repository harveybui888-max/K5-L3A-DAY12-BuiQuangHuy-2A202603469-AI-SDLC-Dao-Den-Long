# Bằng chứng kiểm chứng Phase 3 (Proof Report)

- **Ngày chạy**: 2026-11-20T10:06:15.793Z
- **Node.js**: v22.12.0
- **Nền tảng**: win32 x64
- **Phiên bản Contract**: Test Contract v1.2 (`game.contract.json`)

## 1. Kết quả kiểm thử tự động (Unit & Feature Tests)
- **Test Suite**: 44/44 tests passed (100%)
  - `tests/contract.test.js`: 1 test (Tuning v1.2 single source of truth)
  - `tests/cli.test.js`: 2 tests (Mã thoát 0 và 2, JSONL streaming)
  - `tests/determinism.test.js`: 1 test (Tất định SHA-256)
  - `tests/format.test.js`: 1 test (Snapshot schema v1.2: `capacity`, `fuel`, `ever_lit`, `relit_count`)
  - `tests/lanterns.test.js`: 2 tests (Nạp đom đóm, thắp đèn cost=10, điểm mới)
  - `tests/motes.test.js`: 2 tests (Nhặt đom đóm r=1.0m, kiểm tra sức chứa động)
  - `tests/movement.test.js`: 3 tests (Tốc độ 6 m/s, chuẩn hóa, rơi khỏi đảo)
  - `tests/pulse.test.js`: 2 tests (Tỏa Sáng cost=3, bán kính 5m 3D)
  - `tests/shades.test.js`: 3 tests (Bóng Mực 4.0 m/s, recoil 2m, an toàn 6.0m)
  - `tests/phase2_dash.test.js`: 3 tests (Lướt 14 m/s trong 0.2s, hồi chiêu 1.5s, khóa cao độ)
  - `tests/phase2_jump_fall.test.js`: 3 tests (Nhảy 7 m/s, trọng lực -20 m/s², rơi void Y < -10)
  - `tests/phase2_drifters.test.js`: 3 tests (Gió Lạc săn mồi, cướp 3 đom đóm, thả rơi khi bị Tỏa Sáng)
  - `tests/phase2_charms.test.js`: 1 test (Bùa Gió 7.2 m/s, 0s lướt, hồi sau 2700 ticks)
  - `tests/phase2_night2_3.test.js`: 2 tests (Cầu tre & bục nhảy Đêm 2; địa hình 3 tầng Đêm 3)
  - `tests/phase2_pause.test.js`: 1 test (Tạm dừng đóng băng sim_tick và đồng hồ)
  - `tests/phase3_fuel.test.js`: 5 tests (Hao hụt 1.0/s, cạn dầu tắt đèn `lantern_out`, châm dầu `refuel`, thắp lại tốn 5 đom đóm, sức chứa động)
  - `tests/phase3_drain.test.js`: 4 tests (Mất vùng an toàn khi fuel < 30, Bóng Mực hút dầu `drain`, Tỏa Sáng trúng drain được +15, thoát drain)
  - `tests/phase3_win.test.js`: 4 tests (Bỏ thắng sớm, thắng bình minh `dawn_survived`, thua bình minh `dawn`, thua hết lửa `no_flames`)
  - `tests/phase3_scoring.test.js`: 1 test (Kiểm tra chi tiết cơ cấu tính điểm v1.2 khi thắng ở bình minh)

## 2. Kịch bản Headless & Kiểm tra 3 Đêm
- `quick-win` scenario (bình minh sống sót): Đạt
- `night_1` (240s, Đảo Bến): Đạt
- `night_2` (270s, Đảo Cau): Đạt
- `night_3` (300s, Đảo Chuông): Đạt

## 3. Tính tất định (Determinism Check)
- SHA-256 (1200 ticks, seed 42, Night 2): `64fb68e211e4ccfb76d8c5190d493b84c6d1b67b25c6e67ff007b7b06785796b`
- So sánh 2 tiến trình độc lập: **TRÙNG KHỚP 100% TỪNG BYTE**.

## 4. Hiệu năng mô phỏng (Benchmark full 300s = 18,000 ticks)
- Thời gian mô phỏng 18,000 tick: **118.27 ms**
- Tốc độ xử lý: **152200 tick/giây** (vượt xa yêu cầu thời gian thực).
