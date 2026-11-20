# Project Changelog

## Phase 2 (Contract v1.1 — "Ba hòn đảo")
- Chuẩn hóa toàn bộ số liệu theo Test Contract v1.1 trong `game.contract.json`.
- Mở rộng hỗ trợ 3 Đêm: Đêm 1 (Đảo Bến r=40m), Đêm 2 (Đảo Cau với 2 đảo r=28m, cầu tre, bục nhảy), Đêm 3 (Đảo Chuông 3 tầng Y=0, Y=3, Y=6, dốc đi bộ, tháp chuông, gió giật).
- Bổ sung cơ chế di chuyển nâng cao:
  - Lướt (Dash): tốc độ 14 m/s trong 0.2s (12 ticks), hồi chiêu 1.5s, giữ cao độ trên không.
  - Nhảy & Rơi đảo: vận tốc nhảy 7 m/s, trọng lực -20 m/s², rơi khỏi đảo (Y < -10) mất 1 Lửa, mất đom đóm, hồi sinh sau 60 ticks với 90 ticks bất tử.
  - Bục nhảy (Jump Pad): bắn người chơi quỹ đạo đạn đạo với vận tốc Y và ngang cố định.
- Kẻ địch & Thực thể mới:
  - Gió Lạc (Drifters): tốc độ 7 m/s, săn Mây khi mang $\ge 5$ đom đóm, cướp 3 đom đóm rồi bỏ chạy.
  - Tỏa Sáng tương tác với Gió Lạc: ép chạy trốn hoặc đánh rơi đom đóm đã cướp.
  - Bùa Gió (Charms): tăng tốc chạy lên 7.2 m/s, lướt không hồi chiêu trong 10s (600 ticks), hồi lại sau 45s (2700 ticks).
- Cơ chế Tạm dừng (Pause): nhận input `pause`, snapshot ghi `state: "paused"`, đóng băng toàn bộ thời gian và đếm ngược.
- Nâng cấp bộ test suite lên 30 unit & integration tests (`npm test` đạt 30/30).
- Cập nhật Web 3D client với bộ chọn Đêm 1/2/3, hiển thị địa hình 3D, bục nhảy, bùa chú và menu Tạm dừng.

## Phase 1 (Contract v1.0 — "Đêm 1: Đảo Bến")
- Initial core simulation and headless mode.
- Unit tests and determinism verification.
- Web client presentation.
