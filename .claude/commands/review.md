---
description: Review today's Playwright + TypeScript work (hint-first, no full fixes)
argument-hint: dayNN (vd: day05)
---

Review code tôi viết cho **$ARGUMENTS** trong framework Playwright + TypeScript.

## Phạm vi

- Xem các commit hôm nay: `git log --since=midnight -p`
- Nếu chưa commit thì xem `git diff` và `git diff --staged`
- Đọc `docs/roadmap.md` để biết mục tiêu của $ARGUMENTS và chấm theo mục tiêu đó.

## Kiểm tra tự động (chạy trước, đưa kết quả vào review)

1. `npx tsc --noEmit`
2. `npx eslint .`
3. `npx playwright test --reporter=list`
   Nếu lệnh nào fail → đó là issue High.

## Checklist review

1. **Locator strategy**: ưu tiên `getByRole` > `getByLabel`/`getByText` > `getByTestId` (`data-test`). Flag XPath, CSS dài phụ thuộc DOM, `.nth()`/`.first()` không cần thiết.
2. **Waiting**: KHÔNG có `waitForTimeout`, sleep, `waitForSelector` thừa. Dùng auto-wait + web-first assertion.
3. **Assertions**: dùng `await expect(locator).toHaveText/toBeVisible/...`; flag kiểu `expect(await locator.textContent()).toBe(...)`.
4. **async/await**: mọi Playwright call phải `await`; flag floating promise, `await` thiếu trong `expect`, `forEach` với async callback.
5. **Test isolation**: test độc lập, chạy được song song (`fullyParallel`) và theo bất kỳ thứ tự nào; không share state qua biến module-level.
6. **Fixtures**: dùng `test.extend<...>()` để inject page objects/data; setup/teardown bằng `await use(...)`; login dùng `storageState` + setup project (từ tuần 3), không login lặp trong từng test.
7. **POM**: class với `constructor(private readonly page: Page)`, locator là `readonly` property; assertion chính nằm ở test. Không inheritance chain kiểu Selenium BasePage.
8. **Config & data**: không hardcode URL/credential; dùng `baseURL` trong config, env qua dotenv, có `.env.example`. Test data không đụng nhau khi chạy parallel.
9. **TypeScript quality**: không `any` vô lý do, có type/interface cho data và API response, naming rõ ràng, không dead code, không `console.log` debug, không `test.only`.
10. **Flakiness risk**: chỉ ra chỗ có thể flaky khi chạy nhiều workers, nhiều browser, hoặc trên CI.

## Quy tắc trả lời (QUAN TRỌNG)

- Tôi đang học: **hint-first**. Mỗi issue: chỉ ra vấn đề + vì sao + gợi ý hướng sửa (+ link playwright.dev nếu có). **KHÔNG viết sẵn code fix** trừ khi tôi gõ "full answer".
- Nếu thấy "thói quen Selenium/Python" → gọi tên rõ và so sánh cách làm trong Playwright/TS.
- Ngôn ngữ: giải thích bằng tiếng Việt, technical terms giữ tiếng Anh.
- Format từng issue: `[High|Medium|Low] file:line — vấn đề — vì sao — hint`
- Thêm mục **"Làm tốt"**: 1–3 điểm thực sự đúng (không khen chung chung).
- Cuối review: **Score /10** theo rubric: Correctness 3 · Locator & waiting 3 · Structure/POM 2 · Readability & TS quality 2.
- Kết luận **PASS** nếu score ≥ 7 và không còn issue High; ngược lại **NEEDS FIX**.
- Thêm 1 câu hỏi kiểm tra hiểu bài liên quan đến chủ đề hôm nay.

## Output

Ghi toàn bộ review vào `reviews/$ARGUMENTS.md` (tạo thư mục nếu chưa có). Nếu file đã tồn tại (review lần 2 sau khi fix), append section `## Re-review <giờ>` thay vì ghi đè.
Sau đó in tóm tắt ra terminal: score + PASS/NEEDS FIX + số issue High/Medium/Low.
