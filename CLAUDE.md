# CLAUDE.md — pw-toolshop-framework

## Mục đích repo

Repo HỌC: tôi tự build Playwright + TypeScript framework từ đầu, target
https://practicesoftwaretesting.com (Toolshop: UI + REST API + Swagger).
Tôi có kinh nghiệm Selenium + Python + pytest + POM, nhưng MỚI với TypeScript và Playwright Test.
Hãy chỉ ra chỗ nào tôi đang mang "thói quen Selenium/Python" vào Playwright/TS
(DriverFactory, BasePage nặng, explicit wait, sleep, getText rồi assert thủ công...).

## Cách làm việc với tôi

- **Hint-first**: khi tôi hỏi hoặc bị lỗi, đưa gợi ý/hướng/keyword tra docs trước.
  Chỉ đưa full code khi tôi nói "full answer".
- Khi đưa full answer: đưa **file hoàn chỉnh**, không đưa patch rời rạc.
- **Không tự ý sửa code** của tôi trừ khi tôi yêu cầu rõ. Review = chỉ comment.
- Giải thích bằng tiếng Việt, technical terms giữ tiếng Anh.
- Khi gặp khái niệm TS mới, so sánh ngắn với Python tương đương.

## Tech stack

- Node.js LTS, npm, TypeScript (`strict: true`), `@playwright/test`
- ESLint (typescript-eslint + eslint-plugin-playwright), Prettier, dotenv
- allure-playwright (từ tuần 5), GitHub Actions

## Lệnh thường dùng

- Chạy toàn bộ test: `npx playwright test`
- Chạy 1 test: `npx playwright test -g "<tên test>"`
- UI mode: `npx playwright test --ui`
- Debug: `npx playwright test --debug`
- Xem report: `npx playwright show-report`
- Mở trace: `npx playwright show-trace <path/to/trace.zip>`
- Type check: `npx tsc --noEmit`
- Lint: `npx eslint .`

## Cấu trúc

- `src/pages` page objects · `src/api` API clients + types · `src/fixtures` test.extend
- `src/data` test data/factories · `src/config` env/config
- `tests/ui` · `tests/api` · `tests/e2e` · `tests/auth.setup.ts`

## Quy ước

- Commit message: `dayNN: <việc đã làm>` (vd: `day03: add LoginPage + 2 login tests`)
- Mỗi ngày ghi `docs/daily-log.md` với heading `## YYYY-MM-DD` (học gì / làm gì / blocker)
- Review lưu ở `reviews/dayNN.md` (dùng slash command `/review dayNN`)
- Roadmap ở `docs/roadmap.md`
- Không commit `.env`, `test-results/`, `playwright-report/`, `playwright/.auth/`
