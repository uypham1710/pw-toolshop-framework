# Review day01 — 2026-11-15

**Phạm vi:** commit `5a22886 day01: init playwright project, tsconfig, eslint, tracking setup` + file chưa commit `.gitattributes`.
**Mục tiêu D1 (roadmap):** `npm init playwright@latest`, đọc `playwright.config.ts`, chạy example, UI mode, Trace Viewer; git + push; setup tracking.

| Mục tiêu | Trạng thái |
|---|---|
| Init project Playwright | ✅ |
| Đọc `playwright.config.ts` | ✅ (theo daily-log; chưa thấy dấu vết trong code — xem Low #6) |
| Chạy example + report + trace | ✅ |
| UI mode | ✅ (theo daily-log) |
| git + push | ✅ `main` đồng bộ `origin/main` |
| Tracking setup | ✅ (sửa luôn bug thiếu `)` trong `check_progress.ps1`) |

## Kiểm tra tự động

| Lệnh | Kết quả |
|---|---|
| `npx tsc --noEmit` | ✅ pass, 0 error |
| `npx eslint .` | ✅ pass, 0 warning |
| `npx playwright test --reporter=list` | ✅ 2/2 passed (chromium, 2 workers, 4.1s) |

Env: Node v24.11.0 · Playwright 1.65.1 · TypeScript 6.0.3

## Issues

Không có issue **High**.

**[Medium] `.gitignore` — thiếu `.env`**
— CLAUDE.md quy định không commit `.env`, nhưng `.gitignore` chưa có dòng này. Dotenv để đến D8 mới dùng, nhưng lỗi kiểu này thường xảy ra đúng ngày bạn tạo `.env` lần đầu rồi `git add .`. Một khi credential đã lên GitHub thì xoá commit cũng không thu hồi được.
— Hint: thêm `.env` (và có thể `.env.*` kèm ngoại lệ `!.env.example`) ngay bây giờ. Keyword: *gitignore negation pattern*.

**[Medium] `package.json:17` — `"type": "commonjs"` không khớp với `tsconfig` (`module: esnext`, `verbatimModuleSyntax`)**
— Daily-log ghi bạn bị lỗi ESM/CJS rồi "fix bằng `bundler`". Bản chất: `moduleResolution: bundler` chỉ *tắt cảnh báo* của `tsc` vì nó giả định có một bundler đứng sau. Thực tế chạy test là Playwright tự transpile TS nên mới chạy được. Cấu hình hiện tại chạy ổn, nhưng nó "nói" với tool rằng project là CJS trong khi code viết theo ESM. Lỗi sẽ quay lại khi bạn chạy một file `.ts` bằng tool khác (vd `tsx`, script seed data ở D14), hoặc dùng `__dirname` trong ESM (dòng dotenv đang comment ở `playwright.config.ts:9` sẽ là chỗ đầu tiên gặp).
— So với Python: giống như trộn `import` kiểu package và chạy script trực tiếp; chạy được hay không tùy *ai* chạy.
— Hint: chọn hẳn một bên. Hoặc `"type": "module"` + `module/moduleResolution: nodenext` (phải hiểu `import.meta.dirname` thay `__dirname`), hoặc giữ `bundler` và ghi rõ trong daily-log *vì sao* chọn. Tra: *TypeScript "Choosing compiler options" → moduleResolution*, *Playwright docs "TypeScript" → tsconfig*.

**[Low] `docs/revi` — file rỗng, có lẽ do gõ nhầm**
— File 0 byte được commit vào repo. Đây là rác, có thể do lỡ tay khi tạo `reviews/`.
— Hint: `git rm` và trước khi commit tập xem `git status`/`git diff --staged --stat`.

**[Low] `.gitattributes` — chưa commit**
— File đã tạo (`* text=auto eol=lf`) nhưng còn untracked, nên CI/máy khác chưa nhận rule line-ending. Ngoài ra file thiếu newline cuối.
— Hint: commit file này cùng commit sửa các mục trên. Sau khi thêm `.gitattributes`, tra *`git add --renormalize .`* để chuẩn hoá các file đã commit trước đó.

**[Low] `package.json:9,28` — `scripts` rỗng; `"typescript": "<6.1"` là range lạ; `"main": "index.js"` là dead field**
— `<6.1` cho phép cả TS 2.x, 3.x… về lý thuyết. Chỉ `package-lock.json` đang bảo vệ bạn. Đồng thời `scripts: {}` nghĩa là CI và bạn phải nhớ lệnh dài; CLAUDE.md đã có list lệnh nhưng chưa có trong `package.json`.
— Hint: dùng `~6.0.3` (khóa minor) hoặc `^6.0.3`. Tra *npm semver ranges*. Thêm script `test`, `typecheck`, `lint`, `report`, rồi CI gọi `npm run ...`. Ở pytest bạn có `pytest.ini`/`Makefile`, còn ở Node chỗ đó là `npm scripts`.

**[Low] `playwright.config.ts:3-9, 28-29, 42-78` — nhiều boilerplate comment, chưa đặt `baseURL`**
— Mục tiêu D1 là "đọc hiểu config", nhưng file vẫn y nguyên bản generate, nên reviewer không thấy được bạn hiểu gì. Code comment để chết (firefox/webkit/webServer) cũng là dead code. `baseURL` cho Toolshop chưa set, nên khi viết test D2 bạn sẽ dễ hardcode URL như `example.spec.ts`.
— Hint: xoá block không dùng (`webServer` không áp dụng vì target là site public), giữ lại/viết comment *bằng lời của bạn* cho từng option bạn đã tìm hiểu (`fullyParallel`, `forbidOnly`, `retries`, `trace`). Set `baseURL: 'https://practicesoftwaretesting.com'` luôn, D8 chuyển sang env sau. Tra: *playwright.dev/docs/test-configuration*, *playwright.dev/docs/api/class-testoptions#test-options-base-url*.

**[Low] `.github/workflows/playwright.yml:19` — `npx playwright install --with-deps` cài cả 3 browser trong khi config chỉ có chromium**
— Mỗi lần chạy CI tốn thêm vài phút tải firefox/webkit. `setup-node` cũng chưa bật cache npm.
— Hint: truyền tên browser vào lệnh install; tra option `cache` của `actions/setup-node`. (D23 sẽ làm kỹ, giờ chỉ cần ghi nhận.)

**[Low] `tests/example.spec.ts:17` — assertion thừa (code generate, ghi nhận cho thói quen sau)**
— `getByRole('heading', { name: 'Installation' })` rồi `toHaveText('Installation')` tức là kiểm tra cùng một điều hai lần. Locator đã lọc theo name, nên `toBeVisible()` là đủ để nói "heading này xuất hiện". File này dùng URL hardcode `playwright.dev`, nên khi bắt đầu viết test Toolshop (D2) hãy xoá file này, nếu không CI sẽ phụ thuộc site bên thứ ba.
— Hint: tra *web-first assertions*: `toBeVisible` vs `toHaveText` dùng khi nào.

## Thói quen Selenium/Python

Hôm nay chưa có, vì code chủ yếu là boilerplate. Một điểm cần để ý: bạn **không** tạo `DriverFactory`/`conftest` tự quản lý browser, mà dùng `projects` + `devices` trong config và để fixture `page` built-in lo lifecycle. Đây là đúng cách Playwright. Giữ tư duy này khi sang D6–D7 và đừng dựng lại BasePage/driver singleton.

## Làm tốt

1. **ESLint dùng `recommendedTypeChecked` + `projectService`** (`eslint.config.mjs:22-30`). Đây là phần quan trọng nhất của hôm nay: nó bật `@typescript-eslint/no-floating-promises`, nên lỗi *quên `await`* (lỗi số 1 của người từ Selenium sync sang Playwright async) sẽ bị bắt ngay. Bạn còn tách `disableTypeChecked` cho `.mjs` và chỉ áp `eslint-plugin-playwright` cho `tests/**`, nên config gọn và đúng phạm vi.
2. **`tsconfig` chặt hơn mặc định**: `strict` + `noUncheckedIndexedAccess`. Với flag này, `arr[0]` có type `T | undefined`, nên bạn sẽ được nhắc khi lấy phần tử từ list sản phẩm/API response mà không check. Python không có thứ tương đương ở compile-time (gần nhất là `mypy --strict` + `Optional`).
3. **Debug blocker có ghi lại**: daily-log ghi cụ thể xung đột `exactOptionalPropertyTypes` vs `workers: undefined`, và commit sửa luôn bug thiếu `)` trong `check_progress.ps1` (thêm BOM để PowerShell 5.1 đọc đúng tiếng Việt).

## Score

| Tiêu chí | Điểm |
|---|---|
| Correctness (3) | 3 — tsc/eslint/test đều pass, đã push |
| Locator & waiting (3) | 3 — chỉ có code example, không có wait/sleep; ghi chú nhỏ ở Low #8 |
| Structure/POM (2) | 1.5 — file rác `docs/revi`, `.gitattributes` chưa commit, chưa có npm scripts |
| Readability & TS quality (2) | 1 — CJS/ESM mismatch chưa giải quyết tận gốc, config còn nguyên boilerplate/dead code |
| **Tổng** | **8.5 / 10** |

**Kết luận: ✅ PASS** (≥ 7, không có issue High). Nên fix 2 issue Medium trước khi bắt đầu D2.

## Câu hỏi kiểm tra hiểu bài

Config hiện tại có `trace: 'on-first-retry'` và `retries: process.env.CI ? 2 : 0`. **Khi chạy local và một test fail, bạn có trace để mở bằng Trace Viewer không? Vì sao?** Nếu không, có những cách nào để có trace khi debug local *mà không sửa vĩnh viễn* config? (Gợi ý: CLI flag của `npx playwright test`.)
