# Ghi chú Phase 2 — Ba hòn đảo (Đêm 1, Đêm 2, Đêm 3)

- **Sinh viên**: Bùi Quang Huy (MSSV: 2A202603469)
- **Học phần**: Day 12 — AI SDLC, VinUni AI20K
- **Thời gian**: Mốc Phase 2
- **Trạng thái**: Hoàn thành toàn bộ AC-P2-01 đến AC-P2-15, Test Contract v1.1, Headless CLI, Web 3D client 3 Đêm.

---

## 1. Nhật ký sử dụng AI & Quản lý Token

- **Công cụ sử dụng**: Antigravity Assistant (Gemini 3.8 Flash & Deep Thinking).
- **Chiến lược tối ưu hóa token**:
  - Tách bạch rõ ràng giữa Spec (`docs/spec/phase-2.md`), Contract (`game.contract.json`), Core Sim (`src/sim/`), và Test Suites.
  - Tận dụng quy tắc trong `AGENTS.md` và `CLAUDE.md` để AI luôn tuân thủ strict contract mà không cần lặp lại ngữ cảnh dài.
  - Chạy test tự động với Node built-in test runner (`node --test`), phản hồi lỗi tức thì giúp AI phát hiện và sửa đúng nguyên nhân gốc rễ thay vì đoán mò.
- **Ước tính mức tiêu thụ token Phase 2**:
  - Input tokens: ~26,000 tokens
  - Output tokens: ~14,000 tokens
  - Tổng chi phí ước tính: < $0.08.

---

## 2. Các lỗi gặp phải và cách xử lý (AI Error & Debugging Log)

1. **Lỗi `node:fs` / `node:path` trên trình duyệt**:
   - *Triệu chứng*: Khi mở `public/index.html`, trình duyệt nạp `constants.js` và báo lỗi CORS: `Access to script at 'node:fs' ... blocked by CORS policy`.
   - *Nguyên nhân*: `constants.js` từng import `node:fs` để đọc `game.contract.json`. Browser ES modules không hỗ trợ native Node built-in modules nếu không có bundler.
   - *Khắc phục*: Tách biệt tuyệt đối — `src/sim/constants.js` chứa các hằng số thuần JS, tệp `tests/contract.test.js` kiểm tra tính trùng khớp 100% giữa `src/sim/constants.js` và `game.contract.json`.
2. **Lỗi reset vận tốc phóng của Bục nhảy (Jump Pad)**:
   - *Triệu chứng*: Khi bước lên bục nhảy, Mây bị dính lại đất thay vì được phóng lên không trung.
   - *Nguyên nhân*: Vị trí người chơi được kiểm tra bục nhảy sau đó kiểm tra mặt đất ngay trong cùng tick khi $Y$ chưa kịp tăng lên ($Y=0 \le 0$), dẫn đến hệ thống vật lý ngỡ người chơi đang tiếp đất và reset `vel[1] = 0` và `ballistic_horiz = false`.
   - *Khắc phục*: Thêm điều kiện tiếp đất `vel[1] <= 0` (chỉ tiếp đất khi đang rơi xuống hoặc vận tốc đứng triệt tiêu, không tiếp đất khi đang bay lên).
3. **Lỗi khởi tạo `flee_ticks` của Gió Lạc trong kịch bản**:
   - *Triệu chứng*: Kịch bản test với Gió Lạc ở trạng thái `flee` bị biến mất ngay tick đầu tiên (`removed`).
   - *Nguyên nhân*: Hàm `applyScenario` khởi tạo mặc định `flee_ticks: 0`, dẫn đến bộ đếm giảm xuống $\le 0$ ngay đầu tick và đổi trạng thái thành `removed`.
   - *Khắc phục*: Đọc đúng `d.flee_ticks` từ kịch bản hoặc gán mặc định 240 ticks nếu trạng thái là `flee`.
4. **Lỗi đảo chiều trục camera W/S**:
   - *Triệu chứng*: Người chơi bấm W lại đi lùi về phía người xem thay vì đi về phía trước hòn đảo.
   - *Nguyên nhân*: Hệ tọa độ Three.js nhìn từ $+Z$ sang $-Z$.
   - *Khắc phục*: Tính toán vector hướng di chuyển tương đối theo góc quay camera (`camYaw`), đảm bảo W luôn là tiến về hướng nhìn camera.

---

## 3. Đánh giá chất lượng và kiểm chứng (Verification Evaluation)

| Tiêu chí | Kết quả | Ghi chú |
| :--- | :--- | :--- |
| **Test Suite** | **30/30 tests pass** | Bao phủ 100% các tính năng mới: Lướt, Nhảy, Rơi đảo, Bục nhảy, Gió Lạc, Bùa Gió, Gió giật, Tạm dừng, 3 Đêm. |
| **Tính tất định** | **Đạt 100%** | Chạy 2 tiến trình độc lập với seed 42 (1200 ticks trên Đêm 2) cho ra SHA-256 hoàn toàn trùng khớp từng byte: `2ff9669f73e11bc02471ac40fb02e4c4e6fa4f581052d716bcab992969f49ceb`. |
| **Hiệu năng Headless** | **173.20 ms / 21,600 ticks** | Đạt **124,712 ticks/giây** (nhanh gấp ~2,000 lần thời gian thực 360 giây của Đêm 3). |
| **Giao diện Web 3D** | **Hoạt động trơn tru** | Đầy đủ nút chuyển 3 Đêm, hiển thị cầu tre, bục nhảy, đĩa 3 tầng, tháp chuông, Gió Lạc, Bùa Gió, hiệu ứng Lướt và bảng Pause. |
