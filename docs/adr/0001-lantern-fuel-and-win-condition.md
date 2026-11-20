# ADR-0001: Thay đổi mô hình nhiên liệu Đèn Lồng và Luật thắng giữ sáng tới bình minh

- **Trạng thái**: Accepted (Đã chấp thuận)
- **Ngày**: 2026-11-20
- **Tác giả**: Bùi Quang Huy (2A202603469) & AI Assistant
- **Học phần**: Day 12 — AI SDLC, VinUni AI20K
- **Ticket liên quan**: TICKET-03 (Change Request: "Đèn cạn dầu", Contract v1.2)

---

## 1. Bối cảnh (Context)
Trong Phase 1 và Phase 2, luật chơi quy định người chơi chiến thắng ngay khi tất cả các Đèn Lồng Lớn được thắp sáng (`all_lit`). Qua đợt playtest thực tế, nhà thiết kế phát hiện người chơi có kỹ năng tốt thường hoàn thành việc thắp đèn chỉ trong vòng 2 phút đầu, khiến thời gian còn lại của Đêm (từ 4 đến 5 phút) bị cắt ngắn, làm mất đi sự hồi hộp và kịch tính trong giai đoạn cao trào cuối Đêm.

Ngoài ra, khi một đèn đã sáng, nó trở thành vùng an toàn vĩnh viễn và không còn nhận thêm tương tác nào từ người chơi, dẫn đến việc nửa sau trận đấu trở nên đơn điệu.

---

## 2. Quyết định thiết kế (Decision)

### 2.1. Chuyển đổi mô hình đèn: Trạng thái có Nhiên Liệu (`fuel`)
- **Nhiên liệu (0 - 100)**: Khi vừa thắp, đèn có `fuel = 100`. Đèn sáng tiêu hao tự nhiên `1.0 đơn vị/giây` (1/60 mỗi tick).
- **Châm dầu (Refuel)**: Cho phép nạp thêm đom đóm vào đèn đang sáng với tỷ lệ 1 đom đóm = 10 fuel. Đèn đầy dầu (100) không nhận thêm.
- **Hết dầu & Thắp lại**: Khi `fuel <= 0`, đèn tắt (`lit = false, deposited = 0`). Đèn lưu trạng thái `ever_lit = true`. Khi thắp lại, đèn chỉ yêu cầu 5 đom đóm (thay vì 10 đom đóm cho lần đầu).
- **Vùng an toàn động**: Đèn có `fuel < 30` sẽ mất vùng an toàn 6 m. Khi châm dầu lên $\ge 30$, vùng an toàn kích hoạt lại và đẩy lùi Bóng Mực đang đứng bên trong.

### 2.2. Trạng thái AI mới cho Bóng Mực: Hút dầu (`drain`)
- Khi ở trạng thái `wander`, Bóng Mực tự động tìm đến đèn sáng gần nhất có `fuel < 30`.
- Khi tiếp cận trong khoảng cách $\le 2\text{ m}$, Bóng Mực chuyển sang trạng thái `drain`, đứng yên hút `5 fuel/giây` (cộng dồn nếu có nhiều con).
- Nếu Mây bước vào phạm vi 6 m, Bóng Mực chuyển từ `drain` sang `chase`. Nếu bị Tỏa Sáng, chuyển sang `stunned`.

### 2.3. Thay đổi điều kiện kết thúc: Giữ đảo sáng tới bình minh
- **Loại bỏ thắng sớm**: Không còn sự kiện kết thúc sớm khi thắp hết đèn (`all_lit` bị bãi bỏ).
- **Điều kiện thắng mới (`dawn_survived`)**: Người chơi phải còn sống tại thời điểm hết giờ (bình minh) VÀ số đèn còn đang sáng $\ge \lceil 0.6 \times \text{tổng đèn} \rceil$:
  - Đêm 1: $\ge 3/5$ đèn sáng.
  - Đêm 2: $\ge 4/6$ đèn sáng.
  - Đêm 3: $\ge 5/7$ đèn sáng.
- **Điều kiện thua**: Hết Ngọn Lửa bất kỳ lúc nào (`no_flames`) hoặc tới bình minh mà số đèn sáng không đạt ngưỡng (`dawn`).

### 2.4. Sức chứa tăng dần (Dynamic Bag Capacity)
- Sức chứa bắt đầu ở mức 10, tăng thêm 2 đơn vị mỗi khi thắp sáng thành công một đèn (kể cả thắp lại), tối đa 20 đom đóm.

### 2.5. Tái cấu trúc bảng điểm
- Thưởng nạp đom đóm: +5 mỗi đom đóm nạp (thắp mới, thắp lại hoặc châm dầu).
- Thắp mới: +100; Thắp lại: +40.
- Tỏa Sáng trúng Bóng Mực: +5 nếu bình thường, +15 nếu con đó đang hút dầu (`drain`).
- Khi thắng ở bình minh: +50 cho mỗi Ngọn Lửa còn lại, +50 + floor(fuel) cho mỗi đèn đang sáng.
- Bỏ phần thưởng thời gian còn lại.

---

## 3. Hệ quả (Consequences)
- **Tích cực**:
  - Tạo ra vòng lặp gameplay chiến thuật: vừa mở rộng thắp đèn mới, vừa phải quay lại tuần tra bảo vệ và châm dầu cho các đèn cũ.
  - Giữ vững nhịp độ căng thẳng cho tới giây cuối cùng của Đêm.
- **Thách thức & Điều chỉnh**:
  - Các kịch bản và unit tests cũ từng kỳ vọng game thắng ngay khi thắp hết đèn cần được cập nhật theo Contract v1.2.
  - Cần hiển thị thanh nhiên liệu trên đèn và cảnh báo nhấp nháy trên giao diện 3D để người chơi nắm bắt tình trạng đèn cạn dầu.
