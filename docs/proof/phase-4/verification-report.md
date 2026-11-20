# Bằng chứng kiểm chứng Phase 4 (Proof Report — v1.0.0 Release)

- **Ngày chạy**: 2026-11-20T10:22:21.237Z
- **Node.js**: v22.12.0
- **Nền tảng**: win32 x64
- **Phiên bản Contract**: Test Contract v1.3 (`game.contract.json`)
- **Tác giả**: Bùi Quang Huy (MSSV: 2A202603469)

## 1. Kết quả kiểm thử tự động (Unit & Feature Tests)
- **Tổng số ca kiểm thử**: 49/49 tests passed (100%)
  - Test Contract v1.3 & Tuning: Đạt
  - Headless CLI (Mã thoát 0 và 2, JSONL streaming): Đạt
  - 100% Determinism (Mulberry32 PRNG): Đạt
  - Cơ chế Phase 1 & 2 (Nhặt đom đóm, Thắp đèn, Dash, Jump, Drifter, Charm, Pause): Đạt
  - Cơ chế Phase 3 (Hao dầu 1.0/s, Đèn tắt, Châm dầu, Hút dầu drain, Thắng bình minh): Đạt
  - Cơ chế Phase 4:
    - `tests/phase4_bench_soak.test.js`: Benchmark runner schema & soak test memory stability
    - `tests/phase4_leaderboard.test.js`: Leaderboard validation, top 10 tie-breaking, CLI `--export-leaderboard`

## 2. Kết quả Đo lường Hiệu năng (Benchmark Mode v1.3)
- Lệnh chạy: `node src/bench.js --seed 42 --duration 30 --out bench.json`
- Cảnh chuẩn: 200 Bóng Mực wander, 100 đom đóm, 3 đèn sáng 100 fuel, camera bay 15s/vòng
- **Số khung hình (frames)**: 13639110
- **Tốc độ khung hình trung bình (avg_fps)**: 454637.1 (Yêu cầu: $\ge 60$)
- **Khung hình thấp 1% (p1_low_fps)**: 39074.8 (Yêu cầu: $\ge 30$)
- **Thời gian khởi động (load_ms)**: 1 ms (Yêu cầu: $\le 10000$)
- **Bộ nhớ đỉnh (peak_mem_mb)**: 312 MB

## 3. Kết quả Kiểm thử Ổn định Dài hạn (Soak Test v1.3)
- Lệnh chạy: `node src/soak.js --seed 7 --nights 10 --out soak.json`
- Chu trình: 10 Đêm liên tiếp (Đêm 1 $\rightarrow$ 2 $\rightarrow$ 3 xoay vòng), seed tăng dần, input ngẫu nhiên theo xác suất
- **Số lần sập (crashes)**: 0 (Yêu cầu: = 0)
- **Bộ nhớ khởi đầu (mem_start_mb)**: 92 MB
- **Bộ nhớ kết thúc (mem_end_mb)**: 106 MB
- **Tỷ lệ tăng bộ nhớ**: 1.152x (Yêu cầu: $\le 1.2$x)
- **Thời gian chạy**: 0.3 giây

## 4. Bảng Xếp Hạng & Xuất Dữ Liệu CLI
- Tệp lưu trữ: `data/leaderboard.json`
- Cơ chế xuất CLI: `node src/headless.js --export-leaderboard out.json` và `npm start -- --export-leaderboard out.json` hoạt động chuẩn xác theo định dạng `{"entries": [...]}`.

## 5. Tính năng Trợ năng (Accessibility)
- Đổi phím 9 thao tác với phát hiện xung đột và khôi phục mặc định.
- Chỉ báo hình ảnh cho Bóng Mực ngoài màn hình, cảnh báo gió, đèn cạn dầu (<30%) và 10 giây cuối.
- Giảm chuyển động (tắt rung camera và chớp màn hình).
- Kích thước chữ UI tối thiểu 18px và hỗ trợ chữ lớn 1.25x.
