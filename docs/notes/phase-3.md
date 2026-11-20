# Ghi chú Phase 3 — Change Request: "Đèn cạn dầu"

- **Sinh viên**: Bùi Quang Huy (MSSV: 2A202603469)
- **Học phần**: Day 12 — AI SDLC, VinUni AI20K
- **Thời gian**: Mốc Phase 3
- **Trạng thái**: Hoàn thành toàn bộ AC-P3-01 đến AC-P3-15, Test Contract v1.2, ADR-0001, Headless CLI, Web 3D client Phase 3.

---

## 1. Quyết định kiến trúc & Thiết kế (Architecture Decisions)
- Xem tài liệu ADR chi tiết tại: [docs/adr/0001-lantern-fuel-and-win-condition.md](file:///d:/AI_VINUNI/K5-L3A-Day12-BuiQuangHuy-2A202603469-AI-SDLC/docs/adr/0001-lantern-fuel-and-win-condition.md)
- Tóm tắt các quyết định quan trọng:
  1. Thêm mô hình nhiên liệu đèn (`fuel: 0-100`, hao 1.0/s tự nhiên, Bóng Mực hút 5.0/s khi ở trạng thái `drain`).
  2. Bỏ hoàn toàn luật thắng sớm (`all_lit`), chuyển sang luật giữ đèn tới bình minh (`dawn_survived` với $\ge 60\%$ đèn sáng).
  3. Thêm tính năng châm dầu (`refuel`) cho đèn đang sáng và thắp lại tốn 5 đom đóm cho đèn `ever_lit`.
  4. Sức chứa tăng động theo số lần thắp thành công: $10 + 2 \times \text{successful\_lights}$ (tối đa 20).
  5. Thêm chế độ Bảng màu dễ phân biệt (Colorblind Mode) lưu trong `localStorage`.

---

## 2. Xử lý các Test bị ảnh hưởng bởi Luật Mới (Test Migration Log)
Các thay đổi phá vỡ tương thích (breaking changes) của Phase 3 làm một số test cũ không còn đúng theo luật mới. Chúng đã được cập nhật tường minh (không bỏ qua/skip âm thầm):
1. **`tests/lanterns.test.js`**:
   - *Lý do thay đổi*: Luật Phase 3 quy định mỗi đom đóm nạp vào đèn cộng +5 điểm và thắp mới cộng +100 điểm. Nạp 10 đom đóm để thắp đèn L1 đem lại $10 \times 5 + 100 = 150$ điểm (thay vì 100 điểm cũ).
   - *Hành động*: Cập nhật assertion điểm từ 100 thành 150.
2. **`tests/motes.test.js`**:
   - *Lý do thay đổi*: Mục 5 của Ticket-03 thay thế toàn bộ công thức điểm cũ, bỏ việc cộng điểm ngay khi nhặt đom đóm (+10 điểm cũ). Điểm đom đóm chỉ được ghi nhận khi nạp vào đèn (+5 điểm/con).
   - *Hành động*: Kiểm tra số đom đóm mang theo tăng lên 1, điểm giữ nguyên 0 (sẽ được cộng khi nạp vào đèn).
3. **`tests/scenarios/quick-win.json`**:
   - *Lý do thay đổi*: Game không còn thắng sớm khi thắp hết đèn (`all_lit`), chỉ thắng ở thời điểm bình minh (`dawn_survived`).
   - *Hành động*: Cập nhật kịch bản với `time_left_s: 0.1` để mô phỏng bình minh đến nhanh chóng với 4/5 đèn sáng đạt ngưỡng thắng.

---

## 3. Nhật ký sử dụng AI & Quản lý Token (Token Management)
- **Công cụ sử dụng**: Antigravity Assistant (Gemini 3.8 Flash).
- **Chiến lược token**:
  - Gắn chặt với `game.contract.json` v1.2 làm single source of truth.
  - Phân tách module độc lập: `sim.js` xử lý thuần túy logic, không import Node.js built-ins để client 3D dùng chung file mà không cần build step.
  - Test-driven approach: viết test case trước cho từng AC (fuel decay, drain, win conditions, dynamic capacity) giúp phát hiện bug logic sớm mà không lãng phí token lặp vòng.
- **Ước tính tiêu thụ Phase 3**:
  - Input tokens: ~28,000 tokens
  - Output tokens: ~15,000 tokens
  - Chi phí ước tính: < $0.09.

---

## 4. Đánh giá chất lượng và kiểm chứng (Verification Evaluation)

| Tiêu chí | Kết quả | Ghi chú |
| :--- | :--- | :--- |
| **Test Suite** | **44/44 tests pass (100%)** | Bao phủ toàn bộ 15 AC của Phase 3 cùng toàn bộ test hồi quy của Phase 1 và 2. |
| **Tính tất định** | **Đạt 100%** | SHA-256 (1200 ticks, seed 42, Night 2): `64fb68e211e4ccfb76d8c5190d493b84c6d1b67b25c6e67ff007b7b06785796b` trùng khớp tuyệt đối giữa 2 tiến trình độc lập. |
| **Hiệu năng Headless** | **142.38 ms / 18,000 ticks** | Đạt **126,422 ticks/giây** (vượt xa yêu cầu thời gian thực). |
| **Giao diện Web 3D** | **Hoạt động trơn tru** | Thanh nhiên liệu 3D, nhấp nháy khi $< 30\%$ dầu, hoạt họa Bóng Mực hút dầu, nút bật Bảng màu dễ phân biệt. |
