# Đảo Đèn Lồng 3D — Lantern Island v1.0.0 (Bình Minh)

> **Học phần**: Day 12 — AI SDLC, VinUni AI20K  
> **Tác giả**: Bùi Quang Huy (MSSV: `2A202603469`)  
> **Mốc phát hành**: Phase 4 — Phát hành chính thức v1.0.0 · Test Contract v1.3  
> **Video Demo**: [`docs/demo/demo.mp4`](docs/demo/demo.mp4) (hoặc xem tại mục [GitHub Releases v1.0.0](../../releases/tag/v1.0.0))

---

## 1. Giới thiệu trò chơi

**Đảo Đèn Lồng** là một trò chơi hành động 3D góc nhìn thứ ba kết hợp mô phỏng sinh tồn tất định (Deterministic Headless Simulation). Người chơi điều khiển **Mây** — người giữ đèn nhỏ tuổi, thu thập đom đóm trong đêm tối, thắp sáng và châm dầu cho các Ngọn Đèn Lớn trên các hòn đảo lơ lửng, đồng thời né tránh và dùng ánh sáng xua đuổi Bóng Mực và Gió Lạc.

### Các màn chơi (3 Đêm):
- **Đêm 1 (Đảo Bến)**: Đảo tròn bán kính 40m, 5 đèn lớn, làm quen với cơ chế gom đom đóm, thắp đèn và né Bóng Mực.
- **Đêm 2 (Đảo Cau)**: Quần thể đảo đôi kết nối bằng cầu tre và bục nhảy không gian (Jump Pad), đối mặt với Gió Lạc (Drifter) chuyên cướp đom đóm.
- **Đêm 3 (Đảo Chuông)**: Địa hình 3 tầng cao (Y = 0m, 3m, 6m) với đường dốc dạo bộ, gió giật định kỳ và hệ thống chuông gió cổ kính.

---

## 2. Cài đặt & Khởi động nhanh (Tối đa 3 lệnh)

Clone repo sạch trên bất kỳ máy nào (Windows, macOS, Linux) và chạy đúng 3 lệnh sau:

```bash
git clone https://github.com/huybui-vinuni/dao-den-long.git
cd dao-den-long
npm install && npm start
```

Mở trình duyệt tại địa chỉ: **`http://localhost:3000`** để trải nghiệm game ngay lập tức.

---

## 3. Điều khiển trò chơi

Người chơi có thể tùy biến toàn bộ phím điều khiển trong giao diện **Cài đặt phím (Keybindings)**:

| Hành động | Phím mặc định | Mô tả |
|---|---|---|
| **Di chuyển** | `W`, `A`, `S`, `D` | Di chuyển 4 hướng (chuẩn hóa tốc độ 6.0 m/s) |
| **Nhảy (Jump)** | `Space` | Nhảy bổng với vận tốc 7.0 m/s khi tiếp đất |
| **Lướt (Dash)** | `Shift` (trái) | Lướt nhanh 14.0 m/s trong 0.2s, khóa cao độ trên không |
| **Tương tác / Nạp dầu** | `E` | Nạp đom đóm thắp đèn (cost=10) hoặc châm dầu đèn đang sáng |
| **Tỏa Sáng (Pulse)** | `F` | Tốn 3 đom đóm: đẩy lùi & làm choáng Bóng Mực trong bán kính 5m |
| **Tạm dừng (Pause)** | `P` hoặc `Esc` | Đóng băng toàn bộ đồng hồ và trạng thái mô phỏng |
| **Xoay Camera** | Kéo giữ chuột | Xoay góc nhìn 360 độ quanh nhân vật |

---

## 4. Chế độ Kiểm thử & Dòng lệnh (CLI & Verification)

### 4.1. Bộ kiểm thử tự động (Unit Tests)
Chạy toàn bộ 49 ca kiểm thử độc lập bao quát từ Phase 1 đến Phase 4:
```bash
npm test
```

### 4.2. Chế độ Headless (Mô phỏng phi đồ họa tất định)
Chạy mô phỏng không giao diện xuất nhật ký từng khung hình dạng JSONL:
```bash
# Chạy Đêm 2 với seed 42 trong 600 ticks:
node src/headless.js --night 2 --seed 42 --ticks 600 --out output.jsonl
```

### 4.3. Đo lường hiệu năng (Benchmark Mode — Yêu cầu TICKET-04)
Đo hiệu năng cảnh chuẩn (200 Bóng Mực, 100 đom đóm, 3 đèn sáng 100 fuel, camera bay tròn 30m):
```bash
node src/bench.js --seed 42 --duration 30 --out bench.json
```
Kết quả ghi nhận tại `bench.json`:
- `avg_fps`: > 60 FPS (mô phỏng headless đạt > 400,000 FPS).
- `p1_low_fps`: > 30 FPS.
- `load_ms`: <= 10,000 ms (thực tế ~1ms).

### 4.4. Kiểm thử ổn định dài hạn (Soak Test — Yêu cầu TICKET-04)
Chạy liên tục 10 Đêm với đầu vào ngẫu nhiên tất định nhằm kiểm tra rò rỉ bộ nhớ và độ ổn định tiến trình:
```bash
node src/soak.js --seed 7 --nights 10 --out soak.json
```
Kết quả ghi nhận tại `soak.json`:
- `crashes`: 0 (không có lỗi hay dừng tiến trình đột ngột).
- `mem_end_mb <= 1.2 * mem_start_mb` (bộ nhớ kiểm soát tối ưu, không rò rỉ).

### 4.5. Xuất Bảng xếp hạng qua CLI
Xuất danh sách top 10 điểm cao nhất ra tệp JSON:
```bash
npm start -- --export-leaderboard out.json
# Hoặc qua lệnh headless:
node src/headless.js --export-leaderboard out.json
```

### 4.6. Kiểm chứng toàn diện (Full Verification Pipeline)
Chạy pipeline kiểm chứng toàn diện bao gồm: Unit tests, kịch bản Quick-win, kiểm tra đa màn chơi, xác minh SHA-256 tính tất định 100%, benchmark 18,000 tick và xuất báo cáo nghiệm thu:
```bash
npm run verify
```

---

## 5. Tính năng Trợ năng (Accessibility)

Trò chơi được thiết kế hướng tới mọi đối tượng người dùng, tuân thủ các tiêu chuẩn công thái học:
1. **Tùy biến phím bấm linh hoạt**: Phát hiện trùng phím, cảnh báo xung đột tức thời và cho phép khôi phục cấu hình mặc định chỉ với một nút bấm.
2. **Hỗ trợ thị giác & Thính giác (Visual Cues)**:
   - Mũi tên định hướng mép màn hình báo vị trí Bóng Mực đang tiếp cận từ sau lưng.
   - Banner cảnh báo trước khi có luồng gió giật (hướng gió & tốc độ).
   - Đèn có nguy cơ tắt (nhiên liệu < 30%) hiển thị viền cảnh báo nhấp nháy.
   - Viền màn hình đỏ đếm ngược 10 giây cuối cùng của màn chơi.
3. **Giảm chuyển động (Reduced Motion)**: Tắt rung giật camera và loại bỏ hoàn toàn các hiệu ứng chớp sáng bảo vệ người chơi nhạy cảm ánh sáng.
4. **Phông chữ lớn (Large Font UI)**: Cỡ chữ mặc định đảm bảo tối thiểu 18px ở độ phân giải 1280×720, hỗ trợ chế độ phóng to 1.25x.
5. **Chế độ màu tương phản cao (Colorblind Support)**: Đổi màu mắt Bóng Mực sang xanh Cyan `#00B3FF` và làm xẹp 20% hình khối đèn đã tắt để nhận diện không cần dựa vào màu sắc.

---

## 6. Cấu trúc Thư mục Dự án

```
dao-den-long/
├── .agents/skills/          # AI Agent Skills (verify-game)
├── data/
│   └── leaderboard.json     # Tệp dữ liệu Bảng xếp hạng cục bộ
├── docs/
│   ├── adr/                 # Tài liệu quyết định kiến trúc (ADR)
│   ├── proof/               # Bằng chứng kiểm chứng từng phase
│   └── RETROSPECTIVE.md     # Báo cáo hồi tưởng & tổng kết 4 phase
├── public/
│   └── index.html           # Ứng dụng web 3D Three.js & UI
├── scripts/
│   └── verify.js            # Kịch bản kiểm chứng tự động toàn diện
├── src/
│   ├── sim/                 # Nhân mô phỏng tất định thuần JavaScript
│   ├── bench.js             # Bộ đo lường hiệu năng benchmark v1.3
│   ├── headless.js          # CLI mô phỏng không giao diện
│   ├── leaderboard.js       # Quản lý & xác thực Bảng xếp hạng
│   └── soak.js              # Kịch bản soak test dài hạn v1.3
├── tests/                   # 49 ca kiểm thử tự động Node.js test runner
├── bench.json               # Kết quả benchmark thực tế của Phase 4
├── soak.json                # Kết quả soak test thực tế của Phase 4
├── game.contract.json       # Hợp đồng Test Contract v1.3 (Single Source of Truth)
├── CHANGELOG.md             # Lịch sử thay đổi qua 4 Phase
├── CREDITS.md               # Ghi nhận đóng góp & công cụ AI
├── LICENSE                  # Giấy phép phần mềm mở
└── package.json             # Khai báo cấu hình dự án
```
