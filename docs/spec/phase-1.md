# Spec Phase 1 — Đêm 1: Đảo Bến

Nguồn: PRD-0 + Test Contract v1.0 (Lab board). Mỗi tiêu chí dưới đây có kiểm chứng tự động tương ứng trong `tests/`.

## 1. Tiêu chí nghiệm thu (Acceptance Criteria)

| Mã AC | Tiêu chí nghiệm thu | Cách kiểm chứng |
| :--- | :--- | :--- |
| **AC-P1-01** | `game.contract.json` có đầy đủ các trường của Test Contract v1.0; trường `tuning` là nguồn dữ liệu cấu hình duy nhất. | `tests/contract.test.js` kiểm tra schema và sự đồng bộ |
| **AC-P1-02** | Di chuyển nhân vật với vận tốc `player_speed` (6 m/s), xoay theo `cam_yaw_deg`, vector di chuyển chuẩn hóa khi độ dài > 1. | `tests/movement.test.js` |
| **AC-P1-03** | Tự động nhặt đom đóm trong phạm vi `pickup_radius` (1.5 m), số lượng mang theo không vượt quá `carry_capacity` (10). | `tests/motes.test.js` |
| **AC-P1-04** | Nhấn `interact` (sự kiện cạnh lên false $\rightarrow$ true) trong `interact_radius` (3.0 m) nạp đom đóm vào đèn gần nhất chưa sáng; đủ `lantern_cost` (5) thì đèn sáng (`lantern_lit`). | `tests/lanterns.test.js` |
| **AC-P1-05** | Bóng Mực truy đuổi nhân vật với tốc độ `shade_speed` (3.5 m/s); chạm trong `shade_hit_radius` (1.0 m) gây sát thương: mất 1 Ngọn Lửa, bất tử `invuln_s` (1.5 s), rơi `floor(carried * 0.5)` đom đóm. | `tests/shades.test.js` |
| **AC-P1-06** | Xung sáng (Pulse): tiêu tốn `pulse_cost` (1 đom đóm), làm choáng mọi Bóng Mực trong `pulse_radius` (6.0 m) trong `pulse_stun_s` (2.0 s) và đẩy lùi `pulse_push_m` (4.0 m), thời gian hồi chiêu `pulse_cooldown_s` (1.0 s). | `tests/pulse.test.js` |
| **AC-P1-07** | Vùng an toàn: Bóng Mực không thể tiến vào phạm vi `safe_radius` (5.0 m) quanh các đèn **đã thắp sáng**. | `tests/shades.test.js` |
| **AC-P1-08** | Điều kiện kết thúc: Thắng khi thắp sáng toàn bộ 5 đèn (`all_lit`), Thua khi hết Ngọn Lửa (`no_flames`) hoặc hết thời gian (`dawn`). | `tests/game_over.test.js` |
| **AC-P1-09** | Chế độ Headless CLI tuân thủ Test Contract v1.0: nhận đúng các cờ `--seed`, `--night`, `--ticks`, `--snapshot-every`, `--scenario`, `--inputs`, `--out`. Thoát mã 0 khi hợp lệ, mã 2 khi input sai. | `tests/cli.test.js` |
| **AC-P1-10** | Định dạng output JSONL chuẩn xác: các dòng `snapshot`, `event`, `end` với số thực làm tròn 3 chữ số thập phân. | `tests/format.test.js` |
| **AC-P1-11** | Tính tất định tuyệt đối (Determinism): Cùng seed, scenario, inputs cho ra kết quả trùng khớp từng byte (so sánh mã băm SHA-256). | `tests/determinism.test.js` |
| **AC-P1-12** | Tính khả thi của màn chơi: Bot có thể giành chiến thắng với thuật toán gom đom đóm và nạp đèn cơ bản. | `tests/bot.test.js` |

---

## 2. Các giả định cho phần mơ hồ trong PRD-0

1. **Bản đồ Đảo**: Đảo hình tròn phẳng có bán kính 40.0 m, tâm tại `(0, 0, 0)`. Người chơi xuất phát tại `(0, 0, 0)`. Mép đảo có tường vô hình ngăn người chơi rơi khỏi đảo (`fall_enabled = false`).
2. **Vị trí 5 Đèn Lồng Lớn**: Đặt đều trên vòng tròn bán kính 25.0 m, Đèn `L1` tại `(0, 0, 25)`, các đèn tiếp theo `L2`..`L5` cách nhau 72° theo chiều kim đồng hồ.
3. **Phân bố đom đóm ban đầu**: Sinh ngẫu nhiên 30 đom đóm trong vành đai bán kính 5.0 m đến 33.0 m dựa theo seed.
4. **Bóng Mực ban đầu**: 2 Bóng Mực xuất phát ở vòng tròn bán kính 36.0 m. Mỗi 30 giây sinh thêm 1 Bóng Mực ở mép đảo (tối đa 6 con). Khi bị choáng, Bóng Mực không gây sát thương và không di chuyển.
5. **Cơ chế nạp đom đóm**: Cho phép nạp từng phần `min(carried, lantern_cost - deposited)`. Đèn chỉ phát sáng khi nạp đủ `lantern_cost = 5`.
6. **Thứ tự xử lý trong 1 tick (60 Hz)**:
   - Cập nhật bộ đếm thời gian (invulnerability, stun, pulse cooldown).
   - Xử lý input người chơi (cạnh lên của interact, pulse).
   - Di chuyển nhân vật và cập nhật vị trí.
   - Nhặt đom đóm lân cận.
   - Nạp đom đóm vào đèn gần nhất.
   - Kích hoạt xung sáng (nếu có).
   - Cập nhật AI Bóng Mực (di chuyển, né vùng an toàn).
   - Kiểm tra va chạm Bóng Mực - nhân vật.
   - Sinh quái / đom đóm theo chu kỳ.
   - Kiểm tra điều kiện thắng / thua (ưu tiên: thắng > hết máu > hết giờ).
