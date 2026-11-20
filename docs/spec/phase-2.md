# Spec Phase 2 — Ba hòn đảo (Đêm 1, Đêm 2, Đêm 3)

Nguồn: TICKET-02 + Test Contract v1.1. Mỗi tiêu chí dưới đây có kiểm chứng tự động tương ứng trong `tests/`.

## 1. Tiêu chí nghiệm thu (Acceptance Criteria)

| Mã AC | Tiêu chí nghiệm thu | Cách kiểm chứng |
| :--- | :--- | :--- |
| **AC-P2-01** | `game.contract.json` đạt chuẩn `v1.1`; bổ sung đầy đủ `dash_speed`, `dash_duration_s`, `dash_cooldown_s`, `night2_duration_s`, `night3_duration_s`. | `tests/contract.test.js` |
| **AC-P2-02** | Cơ chế Lướt (Dash): tốc độ 14 m/s trong 0.2s (12 ticks), hồi chiêu 1.5s (90 ticks). Giữ nguyên độ cao khi lướt trên không; phát sự kiện `dash`. | `tests/phase2_dash.test.js` |
| **AC-P2-03** | Cơ chế Nhảy & Rơi đảo: vận tốc nhảy 7 m/s, trọng lực -20 m/s², chỉ nhảy khi chạm đất (`grounded`). Khi Y < -10: mất 1 Ngọn Lửa, mất toàn bộ đom đóm, chờ 60 tick rồi hồi sinh tại điểm xuất phát với 90 tick bất tử; phát sự kiện `player_hit` kèm `lost: true`. | `tests/phase2_jump_fall.test.js` |
| **AC-P2-04** | Đèn Lồng chuẩn hóa: Chi phí 10 đom đóm; tương tác trong 2.0 m; vùng an toàn 6.0 m đẩy lùi Bóng Mực trong 30 tick và không gây sát thương khi đang đẩy. | `tests/phase2_lanterns.test.js` |
| **AC-P2-05** | Tỏa Sáng (Pulse) v1.1: Chi phí 3 đom đóm; bán kính 3D 5.0 m; hồi chiêu 3s; choáng 120 tick và đẩy lùi 4m trong 15 tick đầu; điểm +5 mỗi Bóng Mực. | `tests/phase2_pulse.test.js` |
| **AC-P2-06** | AI Bóng Mực v1.1: 5 trạng thái chuẩn (`spawning`, `wander`, `chase`, `recoil`, `stunned`). Phát hiện Mây ở $\le 12$m, bỏ đuổi ở $> 18$m. Khi gây hit bị lùi 2m trong 60 tick (`recoil`). | `tests/phase2_shades.test.js` |
| **AC-P2-07** | Bị đánh rơi đom đóm: rơi `floor(carried / 2)` ra vành 1.5 - 2.5m quanh Mây (tồn tại 480 tick, nhặt lại được từ tick sau); bất tử 90 tick. | `tests/phase2_shades.test.js` |
| **AC-P2-08** | Gió Lạc (Drifters) ở Đêm 2 & 3: tốc độ 7 m/s, tối đa 2 con, sinh lúc tick 1200, 2400... Trạng thái: `idle` $\rightarrow$ `chase` (khi Mây có $\ge 5$ đom đóm và cách $\le 15$m) $\rightarrow$ `flee` (cướp `min(3, carried)` rồi bay xa 7 m/s trong 240 tick và biến mất). | `tests/phase2_drifters.test.js` |
| **AC-P2-09** | Tỏa Sáng tương tác với Gió Lạc: trúng con đang chase $\rightarrow$ ép flee không cướp; trúng con đang flee có mang đồ $\rightarrow$ thả lại toàn bộ đom đóm tại chỗ và biến mất sau 120 tick. | `tests/phase2_drifters.test.js` |
| **AC-P2-10** | Bùa Gió (Charms): nhặt được hiệu lực 600 tick: tốc độ chạy 7.2 m/s, Lướt không hồi chiêu; xuất hiện lại sau 2700 tick; phát sự kiện `charm_picked`. | `tests/phase2_charms.test.js` |
| **AC-P2-11** | Bản đồ Đêm 2 (Đảo Cau): Hai đảo r=28m tâm A (0,0,0) và B (70,0,0) nối bằng cầu tre x ∈ [26, 44], z ∈ [-2, 2]; bục nhảy vận tốc Y=14 m/s và ngang 24 m/s. 6 đèn L1..L6. | `tests/phase2_night2_3.test.js` |
| **AC-P2-12** | Bản đồ Đêm 3 (Đảo Chuông): 3 tầng Y=0, Y=3, Y=6; vách đứng; 2 dốc góc 30° và 150°; bục nhảy tại (0,3,13) lên tầng 2; gió giật mỗi 30s đẩy 2 m/s kéo dài 5s; 7 đèn L1..L7; Bóng Mực tốc độ 4.5 m/s. | `tests/phase2_night2_3.test.js` |
| **AC-P2-13** | Cơ chế Tạm Dừng (Pause): nhận input `pause`; snapshot ghi `state: "paused"`; thời gian, hồi chiêu, sim_tick và TTL đứng yên; phát sự kiện `paused` và `resumed`. | `tests/phase2_pause.test.js` |
| **AC-P2-14** | Snapshot v1.1 đầy đủ: thêm `night`, `wind`, `player.vel`, `grounded`, `invuln`, `dash_cd_s`, `pulse_cd_s`, `charm_s`, và các mảng `motes`, `drifters`, `charms`. | `tests/format.test.js` |
| **AC-P2-15** | Hiệu năng Headless: Mô phỏng đầy đủ một Đêm (tối đa 21,600 tick) hoàn thành trong $\le 30$ giây. | `scripts/verify.js` |
