# Ghi chú Phase 1 — Đêm 1: Đảo Bến

- **Sinh viên**: Bùi Quang Huy (MSSV: 2A202603469)
- **Thời gian**: Mốc Phase 1 (0h - 1h)
- **Trạng thái**: Hoàn thành toàn bộ AC-P1-01 đến AC-P1-12, Test Contract v1.0, Headless CLI, Web 3D client.

---

## 1. Nhật ký sử dụng AI & Quản lý Token

- **Công cụ sử dụng**: Antigravity Assistant (Gemini 3.8 Flash & reasoning engine).
- **Chiến lược tối ưu hóa token**:
  - Không nạp toàn bộ thư viện hoặc log rác vào context.
  - Sử dụng tệp đặc tả ngắn gọn `AGENTS.md` và `CLAUDE.md` (< 50 dòng) để tiết kiệm token cho mỗi lần invoke.
  - Viết test và tiêu chí nghiệm thu rõ ràng trước khi viết code lõi, tránh việc agent sinh code thử nghiệm lòng vòng gây tốn token.
- **Ước tính mức tiêu thụ token**:
  - Phase 1: ~18,000 input tokens, ~9,000 output tokens.
  - Chi phí ước tính: < $0.05.

## 2. Các lỗi AI gặp phải và cách xử lý (AI Error Log)
1. **Lỗi phụ thuộc môi trường khi test headless**:
   - Ban đầu định dùng thư viện ngoài cho CLI argument parsing (`commander` / `yargs`), nhưng việc này làm tăng thời gian cài đặt và rủi ro lỗi version trên máy chấm.
   - *Cách khắc phục*: Tự viết bộ parser tham số chuẩn trong `src/headless.js` bằng pure Node.js, không phụ thuộc package ngoài.
2. **Lỗi sai lệch số thực giữa các nền tảng (Floating point drift)**:
   - Khi tính khoảng cách và góc quay, JavaScript float64 có thể sai lệch bit cuối giữa các kiến trúc CPU.
   - *Cách khắc phục*: Áp dụng làm tròn 3 chữ số thập phân (`round3` / `1e-3`) cho tất cả tọa độ và chỉ số xuất ra snapshot JSONL.

---

## 3. Đánh giá chất lượng và kiểm chứng (Verification Evaluation)

| Tiêu chí | Kết quả | Ghi chú |
| :--- | :--- | :--- |
| **Test Suite** | Đạt 100% | Toàn bộ unit tests cho movement, motes, lanterns, shades, pulse, cli đều pass. |
| **Tính tất định** | Đạt 100% | Chạy 2 lần độc lập cùng seed 42 và kịch bản `full-night`, mã băm SHA-256 hoàn toàn trùng khớp. |
| **Hiệu năng** | 18,000 tick trong ~0.15s | Vượt xa yêu cầu thời gian thực (nhanh gấp ~2000 lần so với 300 giây thực). |
| **Giao diện Web 3D** | Chơi được, đầy đủ HUD | 3D Three.js hiển thị đảo tròn, Mây, đom đóm, Đèn Lồng Lớn, Bóng Mực, hiệu ứng sáng và âm thanh Web Audio API. |
