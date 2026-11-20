# Ghi nhận Đóng góp & Bản quyền (Credits)

Dự án: **Đảo Đèn Lồng (Lantern Island 3D)** — Phát hành v1.0.0 (Phase 4)
Tác giả: **Bùi Quang Huy** (MSSV: 2A202603469) — VinUni AI20K

## 1. Công nghệ & Thư viện
- **Runtime & Simulation**: Node.js v22 (ESM modules, thuần JS không phụ thuộc DOM cho Core Sim).
- **Thư viện Đồ họa 3D**: Three.js (r128) phát hành theo giấy phép MIT.
- **Web Audio API**: Bộ tổng hợp âm thanh dạng sóng (Synthesizer Tones: Sine, Triangle, Square, Sawtooth) tự tạo không dùng file âm thanh bên ngoài.

## 2. Công cụ Trợ lý Trí tuệ Nhân tạo (AI Pair Programming)
- **Mô hình AI**: Claude 3.5 Sonnet / Claude Code và Google Antigravity (Gemini).
- **Harness & Automation**: Hệ thống quy tắc `AGENTS.md`, `CLAUDE.md`, Custom Verification Skills (`verify-game`).
- **Nội dung tạo bởi AI**: Hỗ trợ đề xuất cấu trúc mã nguồn, refactoring toán học XZ, xây dựng kịch bản kiểm thử (test suite 49 tests) và tối ưu hóa bộ nhớ soak test.

## 3. Bản quyền & Phân phối
- Toàn bộ mã nguồn cốt lõi trò chơi và dữ liệu kiểm thử thuộc bản quyền của tác giả Bùi Quang Huy theo giấy phép phân phối mở trong file `LICENSE`.
