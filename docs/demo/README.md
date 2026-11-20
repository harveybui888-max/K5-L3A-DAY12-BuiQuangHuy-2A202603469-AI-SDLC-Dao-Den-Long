# Hướng dẫn Video Demo (Demo Video Guide — Phase 4 Release v1.0.0)

> Tệp video: `demo.mp4` (độ dài dưới 5 phút, dung lượng < 100 MB).  
> Vị trí lưu: đính kèm tại [GitHub Releases v1.0.0](https://github.com/harveybui888-max/K5-L3A-Day12-BuiQuangHuy-2A202603469-AI-SDLC/releases/tag/v1.0.0) hoặc đặt tại `docs/demo/demo.mp4`.

---

## Cấu trúc kịch bản video (Dưới 5 phút)

1. **Phần 1: Chơi trực tiếp (Gameplay) (~1.5 - 2 phút)**
   - Mở trình duyệt tại `http://localhost:3000`.
   - Di chuyển nhân vật Mây, nhặt đom đóm xanh phát sáng.
   - Trình diễn kỹ năng Lướt (Dash với Shift) và Nhảy bổng (Space).
   - Tiếp cận Đèn Lớn, nhấn `E` để thắp sáng và châm dầu.
   - Thao tác Tỏa Sáng (`F`) xua đuổi và đẩy lùi Bóng Mực / Gió Lạc.
   - Chuyển đổi qua Đêm 2 (cầu tre, bục nhảy) hoặc Đêm 3 (địa hình dốc 3 tầng, gió thổi).
   - Trình diễn tính năng Trợ năng: Bật Cài đặt phím (Keybindings), phóng to Chữ lớn (1.25x), Giảm chuyển động, và xem Bảng xếp hạng (Leaderboard).

2. **Phần 2: Bằng chứng game chạy đúng (~1 phút)**
   - Mở terminal trong thư mục dự án và chạy:
     ```bash
     npm test
     ```
   - Cho thấy toàn bộ **49/49 unit tests passed** (100%).
   - Chạy pipeline kiểm chứng toàn diện:
     ```bash
     npm run verify
     ```
   - Cho thấy kết quả: Quick-win đạt, 3 Đêm headless đạt, tính tất định SHA-256 trùng khớp 100% từng byte, benchmark mô phỏng 18,000 tick đạt > 120,000 tick/s.

3. **Phần 3: Đo lường hiệu năng Benchmark & Soak Test (~1 phút)**
   - Chạy lệnh Benchmark theo Test Contract v1.3:
     ```bash
     node src/bench.js --seed 42 --duration 30 --out bench.json
     ```
     Mở tệp `bench.json` cho thấy `avg_fps >= 60`, `p1_low_fps >= 30`, `load_ms <= 10000`.
   - Chạy lệnh Soak Test:
     ```bash
     node src/soak.js --seed 7 --nights 10 --out soak.json
     ```
     Mở tệp `soak.json` cho thấy 10 đêm chạy liên tục không sập (`crashes: 0`), bộ nhớ ổn định (`mem_end_mb <= 1.2 * mem_start_mb`).

4. **Phần 4: Lướt nhanh Harness AI & Lịch sử Git (~30 giây)**
   - Mở xem nhanh file `AGENTS.md` và `.agents/skills/verify-game/SKILL.md`.
   - Mở `docs/RETROSPECTIVE.md` (báo cáo đánh giá và token/chi phí).
   - Chạy `git log --oneline` và `git tag` cho thấy các mốc `phase-1`, `phase-2`, `phase-3`, `phase-4` và `v1.0.0`.

---

## Hướng dẫn quay & nén video

- **Trên Windows**:
  - Nhấn `Win + Alt + R` (hoặc `Win + G` mở Xbox Game Bar) để bắt đầu quay màn hình.
  - Video được lưu tại thư mục `Videos/Captures`.
- **Trên macOS**:
  - Nhấn `Cmd + Shift + 5` để quay toàn màn hình hoặc vùng chọn.
- **Lệnh nén video bằng ffmpeg** (đảm bảo độ phân giải sắc nét, dung lượng < 50MB):
  ```bash
  ffmpeg -i input.mp4 -t 300 -c:v libx264 -crf 26 -preset fast -c:a aac -b:a 128k demo.mp4
  ```

## Đưa video lên GitHub

- **Cách A (Khuyến nghị)**: Đính kèm trực tiếp vào GitHub Release `v1.0.0`:
  - Truy cập: `https://github.com/harveybui888-max/K5-L3A-Day12-BuiQuangHuy-2A202603469-AI-SDLC/releases/tag/v1.0.0`
  - Bấm **Edit Release** và tải file `demo.mp4` lên.
  - Hoặc dùng GitHub CLI:
    ```bash
    gh release upload v1.0.0 demo.mp4
    ```
- **Cách B**: Sao chép file vào thư mục `docs/demo/demo.mp4` rồi commit:
  ```bash
  git add docs/demo/demo.mp4
  git commit -m "docs: add phase-4 demo video"
  git push origin main
  ```
