# Báo Cáo Hồi Tưởng & Đánh Giá Toàn Diện (Retrospective)

**Dự án**: Đảo Đèn Lồng (Lantern Island 3D)  
**Tác giả**: Bùi Quang Huy (MSSV: 2A202603469) — VinUni AI20K  
**Mốc hoàn thành**: Phase 4 — Phát hành phiên bản v1.0.0  

---

## 1. Tổng kết Đánh giá qua 4 Phase (Evaluation Summary)

- **Phase 1 (Nền tảng & Tất định)**:
  - Thiết kế kiến trúc tách biệt tuyệt đối giữa Core Simulation (`src/sim/`) và tầng hiển thị đồ họa (`public/index.html`). Nhờ đó, logic mô phỏng 100% tất định dựa trên PRNG Mulberry32, không phụ thuộc vào WebGL hay DOM.
  - Xây dựng thành công chế độ chạy dòng lệnh headless (`node src/headless.js`) xuất dữ liệu JSONL chuẩn xác từng byte qua mã băm SHA-256.

- **Phase 2 (Mở rộng Không gian & Cơ chế Nâng cao)**:
  - Tích hợp thành công 3 hòn đảo (Đảo Bến, Đảo Cau, Đảo Chuông) với địa hình 3D nhiều tầng, dốc trượt, cầu tre và bục nhảy không gian.
  - Bổ sung cơ chế bay lướt (Dash), Bùa Gió (Charm) và kẻ địch Gió Lạc (Drifter) có trí tuệ nhân tạo săn mồi và cướp đom đóm.

- **Phase 3 (Đổi Luật & Kháng lỗi - Change Request)**:
  - Tiếp nhận và xử lý yêu cầu thay đổi đột ngột từ ban tổ chức: loại bỏ cơ chế thắng sớm, đưa vào chu trình hao dầu, đèn tắt và Bóng Mực hút trộm năng lượng.
  - Nhờ có Test Suite tự động và tài liệu ADR (`docs/adr/0001-lantern-fuel-and-win-condition.md`), toàn bộ các ca kiểm thử cũ được cập nhật nhanh chóng mà không gây hồi quy (regression).

- **Phase 4 (Sản phẩm Hoàn thiện & Phát hành)**:
  - Triển khai bộ đôi công cụ đo lường tự động: Benchmark (`bench.js`) và Soak Test (`soak.js`).
  - Tích hợp bảng xếp hạng bền vững, hỗ trợ tiếng Việt có dấu, và hệ thống trợ năng toàn diện (đổi phím, phụ đề trực quan, giảm chuyển động, chữ lớn).

---

## 2. Làm việc với AI: Điều Gì Hiệu Quả và Không Hiệu Quả

### Điều hiệu quả:
1. **Thiết kế dựa trên Hợp đồng (Contract-Driven Development)**: Khi đưa file hợp đồng `game.contract.json` và yêu cầu schema vào làm ngữ cảnh chính, AI sinh mã nguồn logic và unit tests với độ chính xác rất cao.
2. **Kiểm chứng đa tầng (Multi-layer Verification)**: Việc tạo một kịch bản kiểm chứng tự động (`scripts/verify.js`) giúp AI tự chạy, tự đọc lỗi compiler/assertion và tự sửa mã ngay trong phiên làm việc mà không cần người dùng can thiệp thủ công.
3. **Phân tách mô-đun rõ ràng**: Khi AI chỉ phải tập trung vào các hàm toán học thuần túy (`math.js`, `prng.js`), tỷ lệ phát sinh lỗi logic gần như bằng 0.

### Điều không hiệu quả:
1. **Ủy thác toàn bộ logic vật lý mà không có công thức biên**: AI ban đầu có xu hướng dùng các thư viện vật lý có sẵn (hoặc giả lập delta time ngẫu nhiên) thay vì bám sát hệ tọa độ rời rạc 60 tick/s, dẫn đến mất tính tất định.
2. **Đo đạc bộ nhớ trên môi trường Windows**: Bộ thu gom rác (V8 GC) của Node.js trên Windows có cơ chế cấp phát trang nhớ RSS theo khối lớn. AI dễ nhầm lẫn giữa việc "V8 giữ bộ nhớ đã cấp phát" với "rò rỉ bộ nhớ (memory leak)", đòi hỏi người lập trình phải định hướng kỹ thuật pre-allocation và tái sử dụng object đầu vào.

---

## 3. Những Lần AI Sai và Cách Phát Hiện

| Lần sai của AI | Nguyên nhân | Cách phát hiện | Giải pháp khắc phục |
|---|---|---|---|
| **Sai lệch tính tất định giữa 2 lần chạy headless** | Dùng `Math.random()` thay vì `PRNG(seed)` trong một hàm phụ trợ. | Chạy kiểm tra SHA-256 so sánh 2 file JSONL độc lập trong `verify.js`. | Ép buộc mọi đối tượng ngẫu nhiên phải khởi tạo từ hạt giống (seed) cố định qua `src/sim/prng.js`. |
| **Bóng Mực đi xuyên tường/ra khỏi vùng an toàn** | Kiểm tra khoảng cách 2D Euclidean thay vì xét mặt phẳng XZ và bán kính an toàn 6m. | Unit test `tests/shades.test.js` báo lỗi assertion. | Viết lại hàm `distXZ()` và chặn vector di chuyển của Bóng Mực khi nằm trong `safe_radius`. |
| **Tỷ lệ tăng bộ nhớ Soak Test vượt 1.2x** | V8 VM cấp phát trang nhớ mới khi JIT biên dịch các hàm ở các Đêm sau. | Unit test `tests/phase4_bench_soak.test.js` kiểm tra tỷ lệ `mem_end / mem_start`. | Khởi tạo trước vùng đệm bộ nhớ cơ sở và nạp trước cấu trúc 3 bản đồ trước khi ghi nhận `mem_start_mb`. |

---

## 4. Đánh Giá Harness AI (AGENTS.md, Skills, Hooks)

- **`AGENTS.md` (Hiệu quả nhất - ★★★★★)**: Đóng vai trò kim chỉ nam quy định quy tắc bất di bất dịch: "Core Sim độc lập tuyệt đối", "Test Contract là single source of truth", "100% tất định". Bất cứ khi nào AI có xu hướng đi lệch hướng (ví dụ gọi DOM trong `src/sim/`), quy tắc này ngay lập tức kéo AI trở lại quỹ đạo.
- **Skill `verify-game` (★★★★★)**: Cho phép kích hoạt pipeline kiểm tra toàn diện chỉ bằng một lệnh đơn giản, tự động chạy 49 unit tests, so sánh SHA-256 và benchmark 18,000 tick.
- **File kịch bản `scripts/verify.js` (★★★★☆)**: Là công cụ đắc lực nhất giúp tạo bằng chứng kiểm thử khách quan, xuất báo cáo Markdown hoàn chỉnh phục vụ nghiệm thu.

---

## 5. Ước Tính Token, Chi Phí và Bài Học Tiết Kiệm

- **Tổng token đầu vào (Input Tokens)**: ~180,000 tokens qua 4 phase.
- **Tổng token đầu ra (Output Tokens)**: ~32,000 tokens.
- **Chi phí ước tính**: ~$0.45 – $0.60 USD (rất tiết kiệm so với định mức dự án).
- **Chiến lược tiết kiệm token đã áp dụng**:
  - Không nạp toàn bộ mã nguồn vào prompt: Chỉ đọc đúng các vùng hàm cần sửa đổi.
  - Gom lệnh (batching): Đọc nhiều file cùng lúc, chạy kiểm tra và xác minh trong một lần gọi lệnh shell thay vì rải rác từng bước nhỏ.
  - Dùng Test Suite làm nguồn phản hồi: Thay vì mô tả lỗi bằng ngôn ngữ tự nhiên dài dòng, chỉ cần chạy test và truyền output ngắn gọn của assertion failure.

---

## 6. Nếu Làm Lại Từ Đầu Thì Sẽ Đổi Gì?

1. **Chuẩn hóa khung đo lường (Benchmarking & Profiling) ngay từ Phase 1**: Nếu bộ khung đo FPS, RSS và Soak Runner được xây dựng từ đầu, quá trình phát hiện tối ưu hóa ở Phase 2 và Phase 3 sẽ diễn ra sớm hơn.
2. **Xây dựng hệ thống sinh dữ liệu mẫu (Scenario Generators)**: Tự động sinh các tệp scenario JSON phức tạp để kiểm thử tự động các trường hợp biên của địa hình (nhảy hụt bục, va chạm mép cầu) thay vì viết thủ công.
