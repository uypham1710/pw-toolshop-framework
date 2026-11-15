# Daily Log
## 2026-11-15
**Học:** 
Setup và làm quen với Playwright core
**Làm:**
Init project
Đọc hiểu file playwright config
Chạy test example + xem report, đọc log trace
Chạy thử UI mode
**Blocker:**
lỗi process không được nhận diện, rồi lỗi ESM/CJS với nodenext + verbatimModuleSyntax, cách đã fix bằng bundler.
exactOptionalPropertyTypes xung đột với workers: undefined
**Câu hỏi reviewer**
Config hiện tại có `trace: 'on-first-retry'` và `retries: process.env.CI ? 2 : 0`. **Khi chạy local và một test fail, bạn có trace để mở bằng Trace Viewer không? Vì sao?** Nếu không, có những cách nào để có trace khi debug local *mà không sửa vĩnh viễn* config? (Gợi ý: CLI flag của `npx playwright test`.)
trả lời: Khi chạy local và một test fail, không mở trace viewer. vì local khong có retry, trace chỉ có ở lần retry đầu tiên
dùng command: npx playwright test --trace on