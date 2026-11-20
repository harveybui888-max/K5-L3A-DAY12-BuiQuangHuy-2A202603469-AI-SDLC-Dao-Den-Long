# Spec Phase 3 — Change Request "Đèn cạn dầu"

Nguồn: TICKET-03 + Test Contract v1.2.

## 1. Tiêu chí nghiệm thu (Acceptance Criteria)

| Mã AC | Tiêu chí nghiệm thu | Cách kiểm chứng |
| :--- | :--- | :--- |
| **AC-P3-01** | `game.contract.json` đạt chuẩn `v1.2`; bổ sung đầy đủ các trường `fuel_max`, `fuel_decay_per_s`, `fuel_per_mote`, `relight_cost`, `win_ratio`, `drain_per_s`, `low_fuel_threshold`, `capacity_max`; cập nhật thời lượng các đêm 240/270/300 s. | `tests/contract.test.js` |
| **AC-P3-02** | Đèn sáng có nhiên liệu ban đầu 100, tự tiêu hao 1.0/s (1/60 mỗi tick). Khi `fuel <= 0`, đèn tắt (`lit = false`, `deposited = 0`), nhớ `ever_lit = true`, phát sự kiện `lantern_out`. | `tests/phase3_fuel.test.js` |
| **AC-P3-03** | Châm dầu đèn đang sáng: tiêu tốn `used = min(carried, ceil((100 - fuel) / 10))` đom đóm, hồi `10 * used` fuel; đèn đầy dầu (100) không nhận đom đóm. Phát sự kiện `refuel`. | `tests/phase3_fuel.test.js` |
| **AC-P3-04** | Thắp lại đèn đã từng sáng (`ever_lit = true`) chỉ tốn 5 đom đóm; đèn chưa từng sáng tốn 10 đom đóm. Phát sự kiện `lantern_lit` với `relight: true` hoặc `false`. | `tests/phase3_fuel.test.js` |
| **AC-P3-05** | Đèn có `fuel < 30` mất vùng an toàn 6 m. Đèn có đúng `fuel == 30` vẫn giữ vùng an toàn. | `tests/phase3_drain.test.js` |
| **AC-P3-06** | Bóng Mực ở trạng thái `wander` ưu tiên tìm đèn sáng gần nhất có `fuel < 30`. Khi cách đèn $\le 2\text{ m}$, chuyển sang trạng thái `drain` hút 5 fuel/s (phát sự kiện `fuel_drain` mỗi 60 tick). | `tests/phase3_drain.test.js` |
| **AC-P3-07** | Bóng Mực đang `drain` chuyển sang `chase` khi Mây cách $\le 6\text{ m}$; chuyển sang `stunned` khi trúng Tỏa Sáng; chuyển về `wander` khi đèn tắt, khi đèn được châm lên $\ge 30$, hoặc cách đèn $> 2\text{ m}$. | `tests/phase3_drain.test.js` |
| **AC-P3-08** | Khi đèn được châm dầu lên $\ge 30$, Bóng Mực đang trong vùng 6 m bị đẩy ra mép trong tối đa 30 tick vô hại (như khi đèn vừa thắp). | `tests/phase3_drain.test.js` |
| **AC-P3-09** | Bỏ thắng sớm: Thắp sáng tất cả các đèn không làm kết thúc game. | `tests/phase3_win.test.js` |
| **AC-P3-10** | Luật thắng mới: Kết thúc thời gian Đêm (bình minh), Mây còn sống và số đèn sáng $\ge \lceil 0.6 \times \text{tổng đèn} \rceil$ thì thắng với lý do `dawn_survived`. Ngược lại thua với lý do `dawn`. | `tests/phase3_win.test.js` |
| **AC-P3-11** | Hết Ngọn Lửa lập tức thua với lý do `no_flames` (kể cả ở tick cuối). | `tests/phase3_win.test.js` |
| **AC-P3-12** | Sức chứa tăng dần: $\text{capacity} = \min(20, 10 + 2 \times \text{successful\_lights})$. | `tests/phase3_fuel.test.js` |
| **AC-P3-13** | Hệ thống điểm v1.2: +5 mỗi đom đóm nạp; +100 thắp mới, +40 thắp lại; +5 Tỏa Sáng thường (+15 nếu con đó đang hút dầu); bình minh thắng +50 mỗi lửa còn lại, +50 + floor(fuel) mỗi đèn sáng; bỏ thưởng thời gian. | `tests/phase3_scoring.test.js` |
| **AC-P3-14** | Snapshot v1.2: mỗi đèn có `fuel` (số thực 1 chữ số thập phân), `ever_lit`, `relit_count`; player có `capacity`; Bóng Mực có `drain`. | `tests/format.test.js` |
| **AC-P3-15** | Chế độ mù màu (Bảng màu dễ phân biệt): mắt Bóng Mực đổi sang `#00B3FF`, cảnh báo màu trắng kèm ⚠, đèn tắt xẹp 20%. | `public/index.html` |
