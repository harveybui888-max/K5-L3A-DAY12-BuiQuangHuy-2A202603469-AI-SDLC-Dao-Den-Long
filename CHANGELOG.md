# Project Changelog

## Phase 3 (Contract v1.2 — Change Request: "Đèn cạn dầu")

### ⚠ Breaking Changes (Thay đổi phá vỡ tương thích)
1. **Loại bỏ Thắng Sớm (`all_lit`)**:
   - Thắp sáng toàn bộ đèn không còn kết thúc game hay kích hoạt chiến thắng ngay lập tức.
   - Trò chơi chỉ kết thúc thắng tại thời điểm bình minh (`dawn_survived`) nếu số đèn còn đang sáng $\ge \lceil 0.6 \times \text{tổng đèn} \rceil$.
2. **Cơ chế Nhiên liệu & Đèn tắt (`fuel`)**:
   - Đèn đã sáng không còn sáng vĩnh viễn: mỗi giây tự hao 1.0 fuel. Khi `fuel <= 0`, đèn tắt (`lit = false, deposited = 0`) và phát sự kiện `lantern_out`.
   - Đèn có `fuel < 30` bị mất vùng an toàn 6 m.
   - Thắp lại đèn đã từng sáng (`ever_lit = true`) chỉ tốn 5 đom đóm (thay vì 10).
3. **Thay thế toàn bộ công thức tính điểm**:
   - Bỏ thưởng điểm khi nhặt đom đóm (+10 cũ) và thưởng thời gian còn lại.
   - Điểm nạp đom đóm: +5 mỗi đom đóm (thắp mới, thắp lại hoặc châm dầu).
   - Thắp mới: +100; Thắp lại: +40.
   - Tỏa Sáng trúng Bóng Mực: +5 (hoặc +15 nếu con đó đang hút dầu `drain`).
   - Thưởng bình minh khi thắng: +50 mỗi Ngọn Lửa còn lại, +50 + floor(fuel) cho mỗi đèn còn đang sáng.
4. **Thời lượng các Đêm rút ngắn**:
   - Đêm 1: 240 s (trước là 300 s).
   - Đêm 2: 270 s (trước là 330 s).
   - Đêm 3: 300 s (trước là 360 s).

### Tính năng mới
- **Châm dầu (Refuel)**: Người chơi có thể châm thêm dầu vào đèn đang sáng với tỷ lệ 1 đom đóm = 10 fuel.
- **Bóng Mực hút dầu (`drain`)**: Khi ở trạng thái `wander`, Bóng Mực tự tìm đến đèn sáng có `fuel < 30` và đứng yên hút 5 fuel/s (phát sự kiện `fuel_drain` mỗi 60 tick).
- **Sức chứa túi tăng dần**: Bắt đầu từ 10, tăng +2 mỗi lần thắp sáng thành công một đèn (kể cả thắp lại), tối đa 20.
- **Chế độ mù màu (Bảng màu dễ phân biệt)**:
  - Mắt/viền Bóng Mực chuyển sang màu xanh cyan `#00B3FF`.
  - Cảnh báo chuyển sang màu trắng `#FFFFFF` kèm biểu tượng ⚠.
  - Đèn tắt bị xẹp 20% chiều cao để phân biệt hình khối không cần màu sắc.
- **Tài liệu quyết định thiết kế**: Bổ sung ADR `docs/adr/0001-lantern-fuel-and-win-condition.md`.

---

## Phase 2 (Contract v1.1 — "Ba hòn đảo")
- Chuẩn hóa toàn bộ số liệu theo Test Contract v1.1 trong `game.contract.json`.
- Mở rộng hỗ trợ 3 Đêm: Đêm 1 (Đảo Bến r=40m), Đêm 2 (Đảo Cau với 2 đảo r=28m, cầu tre, bục nhảy), Đêm 3 (Đảo Chuông 3 tầng Y=0, Y=3, Y=6, dốc đi bộ, tháp chuông, gió giật).
- Bổ sung cơ chế di chuyển nâng cao: Lướt (Dash), Nhảy & Rơi đảo, Bục nhảy (Jump Pad).
- Kẻ địch & Thực thể mới: Gió Lạc (Drifters), Bùa Gió (Charms).
- Cơ chế Tạm dừng (Pause).

---

## Phase 1 (Contract v1.0 — "Đêm 1: Đảo Bến")
- Initial core simulation and headless mode.
- Unit tests and determinism verification.
- Web client presentation.
