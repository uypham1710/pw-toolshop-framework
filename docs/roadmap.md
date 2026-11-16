**Tuần 1 — Setup + TS basics + Playwright core**

- D1: `npm init playwright@latest`, đọc `playwright.config.ts`, chạy example, UI mode, Trace Viewer; git + push; setup tracking.
- D2: TS basics cho tester: types, interface, async/await, import/export; viết smoke test trang chủ.
- D3: Locators: `getByRole`, `getByLabel`, `getByTestId` (cấu hình `testIdAttribute: 'data-test'`), `codegen` chỉ để quan sát.
- D4: Web-first assertions `expect()`, auto-wait, soft assertions; test login happy/negative.
- D5: `test.describe`, hooks, tags (`@smoke`), `test.step`; 5 test login/search.

**Tuần 2 — Page Object Model kiểu Playwright**

- D6: POM bằng class TS: `constructor(private readonly page: Page)`, `readonly` Locator; không BasePage nặng.
- D7: Custom fixtures bằng `test.extend<...>()` để inject page objects.
- D8: Config & env: dotenv, `baseURL`, type-safe config object.
- D9: Test data: factory/builder, data-driven test bằng loop + `test()`.
- D10: Refactor + 10+ tests (Login, Home, Product, Search/Filter).

**Tuần 3 — Auth & API**

- D11: `storageState` + setup project (`dependencies`) để login 1 lần.
- D12: `request` fixture / `APIRequestContext`, gọi API Toolshop (Swagger).
- D13: API client layer có types (interface cho request/response).
- D14: Hybrid: tạo data bằng API → verify bằng UI → cleanup.
- D15: API test suite riêng (`tests/api`).

**Tuần 4 — Advanced & stability**

- D16: Network: `page.route` mock/abort, `waitForResponse`.
- D17: Parallel (`fullyParallel`, workers), test isolation, data không đụng nhau.
- D18: Multi-browser projects (chromium, firefox, webkit) + mobile emulation.
- D19: Flaky: retries, `--repeat-each`, tìm root cause bằng trace.
- D20: Visual comparison `toHaveScreenshot` (1–2 test).

**Tuần 5 — Reporting & CI**

- D21: Reporters: html, list, allure-playwright.
- D22: Trace/video/screenshot on failure; attachments.
- D23: GitHub Actions: install, cache, chạy test, upload report artifact.
- D24: Sharding trên CI, chạy theo tag.
- D25: Publish report (GitHub Pages) + badge.

**Tuần 6 — Polish & capstone**

- D26–27: Capstone E2E: search → add to cart → checkout.
- D28: Refactor theo các review cũ; ESLint/Prettier sạch.
- D29: README (cấu trúc, cách chạy, quyết định thiết kế).
- D30: Retro: tự đánh giá, so sánh với framework Selenium cũ.
