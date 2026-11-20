---
name: verify-game
description: Chạy kiểm chứng toàn diện cho game Đảo Đèn Lồng (test suite, headless contract, determinism)
---

# Verification Skill

Kỹ năng này chạy toàn bộ quy trình kiểm chứng độc lập:
1. Chạy tất cả unit tests (`npm test`).
2. Kiểm tra Test Contract với các kịch bản chuẩn (quick-win, full-night).
3. Kiểm tra tính tất định bằng cách chạy 2 lần độc lập cùng seed và so sánh mã băm SHA-256 của output.
4. Xuất log bằng chứng vào `docs/proof/phase-N/`.

Lệnh thực thi:
```bash
npm run verify
```
Chỉ khi kết quả báo "ALL CHECKS PASSED" thì phase mới được coi là hoàn thành.
