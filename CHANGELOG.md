# Lịch sử Thay đổi (Changelog)

## Phiên bản 1.0.0 (Phase 4 — "Bình minh: Phát hành v1.0.0") · Test Contract v1.3

### Điểm nổi bật & Cập nhật lớn
1. **Chế độ Đo lường Hiệu năng (Benchmark Mode)**:
   - Thêm lệnh chuẩn hóa: `node src/bench.js --seed 42 --duration 30 --out bench.json` (tương ứng `<bench_cmd>` trong `game.contract.json`).
   - Tái lập cảnh chuẩn 1280×720: 200 Bóng Mực wander, 100 đom đóm, 3 đèn L1–L3 sáng 100 fuel, camera bay quỹ đạo tròn bán kính 30m quanh tâm (0,0,0) chu kỳ 15s.
   - Kết quả đo thực tế: `avg_fps > 60` (đạt > 450,000 sim fps trên headless), `p1_low_fps > 30`, `load_ms <= 10000`.

2. **Kiểm thử Ổn định Dài hạn (Soak Test)**:
   - Thêm lệnh: `node src/soak.js --seed 7 --nights 10 --out soak.json` (tương ứng `<soak_cmd>`).
   - Chạy xoay vòng liên tục 10 Đêm trong một tiến trình với chuỗi đầu vào ngẫu nhiên tất định.
   - Kiểm soát thất thoát bộ nhớ: `crashes = 0`, bộ nhớ tiến trình ổn định (`mem_end_mb <= 1.2 * mem_start_mb`).

3. **Bảng Xếp Hạng Cục bộ (Persistent Leaderboard)**:
   - Giao diện nhập tên (3–12 ký tự gồm chữ, số, gạch dưới và tiếng Việt có dấu).
   - Lưu trữ bền vững tại `data/leaderboard.json`, tự động đồng bộ qua API `/api/leaderboard` và hỗ trợ chế độ offline qua localStorage.
   - Giữ top 10 điểm cao nhất, sắp xếp giảm dần theo điểm và ưu tiên thời điểm đạt sớm hơn khi bằng điểm.
   - Hỗ trợ xuất dữ liệu qua CLI: `npm start -- --export-leaderboard out.json` hoặc `node src/headless.js --export-leaderboard out.json`.

4. **Trợ năng & Dễ tiếp cận (Accessibility)**:
   - **Tùy biến phím điều khiển (Key Rebinding)**: Cho phép đổi phím cho 9 thao tác (4 hướng di chuyển, nhảy, lướt, tương tác, tỏa sáng, tạm dừng), tự động phát hiện xung đột phím và có nút khôi phục mặc định.
   - **Chỉ báo hình ảnh trực quan (Visual Cues)**:
     - Mũi tên định hướng mép màn hình khi có Bóng Mực ngoài khung nhìn.
     - Banner cảnh báo gió giật (hướng thổi và tốc độ) trước khi gió thổi.
     - Cảnh báo đèn sắp cạn dầu (< 30% fuel) bằng viền nhấp nháy.
     - Hiệu ứng viền đỏ vignette khi còn 10 giây cuối cùng.
   - **Giảm chuyển động (Reduced Motion)**: Tắt rung camera và hiệu ứng chớp sáng màn hình.
   - **Tùy chọn kích thước chữ (Large Font)**: Chữ UI tối thiểu 18px ở 1280×720 và tùy chọn phóng to 1.25x.

---

## Phase 3 (Contract v1.2 — "Đèn cạn dầu")
- Bỏ cơ chế thắng sớm khi thắp hết đèn; chuyển sang điều kiện thắng lúc bình minh (`dawn_survived` với $\ge 60\%$ đèn còn sáng).
- Cơ chế hao hụt nhiên liệu (1.0 fuel/giây), đèn tắt (`lantern_out`), châm dầu (`refuel`), thắp lại đèn cũ tốn 5 đom đóm.
- Bóng Mực hút dầu (`drain`), nâng cấp sức chứa túi động lên tối đa 20.
- Bảng màu tương phản hỗ trợ người khiếm thị màu (Colorblind mode).

---

## Phase 2 (Contract v1.1 — "Ba hòn đảo")
- Mở rộng 3 bản đồ: Đảo Bến, Đảo Cau (cầu tre, bục nhảy), Đảo Chuông (3 tầng địa hình, gió giật).
- Kỹ năng di chuyển nâng cao: Lướt (Dash), Nhảy bổng, Bùa Gió (Wind Charm), kẻ địch Gió Lạc (Drifter).
- Cơ chế Tạm dừng (Pause).

---

## Phase 1 (Contract v1.0 — "Đêm 1: Đảo Bến")
- Xây dựng nhân mô phỏng cốt lõi tất định thuần JavaScript (`src/sim/`).
- Thực thi chế độ dòng lệnh headless xuất chuẩn JSONL.
- Giao diện web hiển thị 3D với Three.js.
