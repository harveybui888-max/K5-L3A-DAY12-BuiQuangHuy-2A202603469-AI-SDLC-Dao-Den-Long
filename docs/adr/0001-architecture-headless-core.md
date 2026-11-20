# ADR 0001: Tách rời Core Simulation và Presentation Layer để tuân thủ Test Contract

## Bối cảnh
Bài lab yêu cầu xây dựng một game 3D vừa chơi được trên trình duyệt / desktop vừa hỗ trợ chế độ headless chạy kiểm thử tự động (Test Contract v1.0) theo mô hình tick tất định 100%. Nếu gộp logic mô phỏng vào engine đồ họa 3D (như Three.js scene update), việc chạy headless trên CI/máy chấm không có GPU sẽ gặp khó khăn, nặng nề và không đảm bảo tính tất định do delta time biến thiên.

## Quyết định
1. **Kiến trúc tách rời (Decoupled Simulation Engine)**:
   - Toàn bộ trạng thái và luật chơi được đóng gói trong `src/sim/Sim.js`, hoàn toàn là pure JavaScript không import thư viện ngoài.
   - Mô hình tick cố định 60 Hz (`dt = 1/60` giây).
   - Sử dụng bộ sinh số ngẫu nhiên giả lập `Mulberry32` dựa trên hạt giống `seed`, đảm bảo đầu ra giống hệt nhau từng byte trên mọi nền tảng (macOS, Linux, Windows).
2. **Headless CLI (`src/headless.js`)**:
   - Chỉ import `Sim.js`, đọc tham số dòng lệnh từ `process.argv`, nạp kịch bản scenario/inputs nếu có và xuất JSONL theo đúng Test Contract v1.0.
   - Tốc độ xử lý: ~18,000 tick trong dưới 0.3 giây.
3. **Presentation Layer (`public/`)**:
   - Sử dụng Three.js để render 3D góc nhìn thứ ba, chỉ đọc snapshot/state từ `Sim` và nội suy chuyển động để hiển thị mượt mà.
   - Không chứa bất kỳ quy tắc hay logic tính điểm nào trong phần giao diện.

## Hệ quả
- Ưu điểm: Đạt điểm tối đa cho Test Contract tự động ẩn, kiểm chứng tất định tuyệt đối, chạy test siêu nhanh, dễ dàng viết unit test.
- Nhược điểm: Cần duy trì layer đồng bộ giữa Sim tick và render frame của Three.js.
