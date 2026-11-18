# Review day08 — 2026-11-17

**Mục tiêu D8 (roadmap):** Config & env: dotenv, `baseURL`, type-safe config object.
**Phạm vi:** commit `9399aa5` (`src/config/env.ts` thêm `AppConfig` + `config`, `playwright.config.ts` lấy `baseURL` từ config, `.env.example` thêm `BASE_URL`/`API_URL`, `src/data/users.ts` bỏ `testUser` và thêm data negative, refactor `login.spec.ts`, daily-log).

## Kiểm tra tự động

| Lệnh                                                        | Kết quả                                                                                                  |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `npx tsc --noEmit`                                          | ✅ 0 lỗi                                                                                                 |
| `npx eslint .`                                              | ✅ 0 lỗi                                                                                                 |
| `npx playwright test --reporter=list`                       | ✅ 9/9 passed (6 workers)                                                                                |
| Giả lập CI: `BASE_URL= API_URL= npx playwright test --list` | ❌ `Error: Missing required environment variable "BASE_URL"`, crash ngay khi load `playwright.config.ts` |

Mục tiêu D8 đạt về mặt code: có `AppConfig` type-safe, `baseURL` không còn hardcode, credential đi qua `.env`, fail-fast với message rõ. Lỗi ở dòng cuối không phải bug trên máy bạn, nhưng là bug thật trên CI (xem issue Medium).

## Issues

**[Medium] src/config/env.ts:22-30 + playwright.config.ts:2,21 + .github/workflows/playwright.yml:24-26 — config bắt buộc mọi biến ngay lúc import, nhưng workflow CI chỉ truyền 2 secret**
— Hiện tượng: workflow chỉ set `CUSTOMER_EMAIL`/`CUSTOMER_PASSWORD`. Trên runner không có file `.env`, nên `BASE_URL` và `API_URL` rỗng. `playwright.config.ts` import `config`, và `requireEnv("BASE_URL")` throw ngay lúc **load config**, trước khi có test nào chạy. Mình đã giả lập bằng lệnh ở bảng trên và xác nhận lỗi này. Workflow hiện chỉ chạy tay (`workflow_dispatch`) nên chưa ai thấy, nhưng lần chạy tay tiếp theo hoặc lúc bật lại ở D23 sẽ đỏ ngay.
— Vấn đề thiết kế phía sau: `config` là một object được **evaluate eager ở module-level**, giống `settings = Settings()` trong `config.py` của Python. Vì vậy _mọi_ biến đều thành bắt buộc với _mọi_ lệnh. Chạy `npx playwright test home.smoke` (không cần login) hay `npx playwright test --list` cũng đòi đủ credential. Hiện `API_URL` còn chưa được dùng ở đâu (D12 mới cần) mà đã chặn cả suite.
— Hint:

1. Phân loại biến: **secret** (email/password) khác với **non-secret có default hợp lý** (`BASE_URL`, `API_URL` của site public). Biến non-secret có thể có fallback, nên CI/máy mới chạy được ngay. Biến secret thì vẫn fail-fast.
2. Biến nào chỉ vài test cần thì chỉ nên được đọc **khi** test đó cần (lazy). Tra keyword: TS `get` accessor (getter), tương đương `@property` trong Python, hoặc một fixture cung cấp credential.
3. Dù chọn cách nào, workflow CI cũng nên khai báo rõ mọi biến nó cần (`env:` ở cấp job hoặc step), để `.env.example` và CI không lệch nhau.
4. Tự kiểm chứng: `BASE_URL= API_URL= npx playwright test --list` phải chạy được.
   — Docs: https://playwright.dev/docs/test-parameterize#env-files · https://playwright.dev/docs/test-use-options

**[Low] tests/ui/login.spec.ts:20-29 + src/data/users.ts:6-9 — test "Invalid password" giờ dùng email _chưa đăng ký_**
— Vì sao: data tên là `unregisteredUser`, tức là test đang kiểm tra "email không tồn tại", chứ không phải "đúng email, sai password". Hai case này khác nhau về nghiệp vụ, dù app trả cùng message (đó là điều tốt về security). Tên test và data đang nói hai chuyện khác nhau. Người đọc report thấy "Invalid password" pass sẽ tưởng case sai password đã được cover.
— Hint: hoặc đổi tên test cho khớp với data, hoặc giữ tên test và ghép email thật từ config với một password sai. Nếu muốn cover cả 2 case thì đây là bài tập rất hợp cho D9 (data-driven bằng loop + `test()`). Cẩn thận một điều: sai password nhiều lần với account thật có thể bị **lock/rate-limit**, nhất là khi chạy song song. Hãy ghi lại điều này nếu chọn hướng đó.

**[Low] .env.example:1-4 — format không nhất quán và thiếu giá trị mẫu cho biến non-secret**
— Vì sao: 2 dòng đầu có trailing space sau `=`, 2 dòng sau lại có space hai bên `=` (`BASE_URL = `). dotenv vẫn parse được, nhưng file này là "tài liệu" cho người clone repo (kể cả bạn trên máy khác). `BASE_URL` là URL public, không bí mật, nên để trống sẽ buộc người dùng tự đoán. Không có newline cuối file.
— Hint: viết theo `KEY=value` không có space. Điền sẵn giá trị thật cho biến non-secret. Biến secret có thể kèm comment `#` mô tả, ví dụ lấy account demo ở đâu.

**[Low] src/config/env.ts:1,3 — log `◇ injected env (N) from .env` lặp lại theo từng worker, và `requireEnv` không cần export**
— Vì sao:

- dotenv bản mới tự in log mỗi lần load. Mỗi worker là một **process riêng** và import lại `env.ts`, nên output của `--reporter=list` bị lẫn 7 dòng log. Khi CI có nhiều test hơn, log này làm khó đọc kết quả.
- `requireEnv` giờ chỉ dùng nội bộ trong `env.ts`, nhưng vẫn `export`. API công khai của module nên càng nhỏ càng tốt.
- `baseUrl` không được validate format. Một typo như `htps://...` sẽ chỉ lộ ra khi `page.goto` fail ở giữa test.
  — Hint: tra option `quiet` của dotenv. Bỏ `export` nếu không có chỗ khác dùng. Validate URL có thể dùng constructor `URL` có sẵn (giống `urllib.parse` nhưng throw khi sai). Bước tiếp theo xa hơn là schema validation (keyword: `zod`, tương tự `pydantic-settings`), nhưng hiện chưa cần.

**[Low] Carry-over từ day07 (không lặp chi tiết)**

- `src/pages/AccountPage.ts:4,7`: field `page` vẫn không được dùng. Ở D8, đây là chỗ hợp lý để `AccountPage` "sở hữu" path `/account` thay vì để hardcode ở `login.spec.ts:15`.
- `playwright.config.ts:24`: vẫn `trace: "on-first-retry"`, nên chạy local (retries 0) không có trace.
- `package.json:9`: `scripts` vẫn rỗng. Hôm nay là ngày config nên rất hợp để thêm vài script như `test`, `test:smoke`, `typecheck`, `lint`.
- Parameter property `constructor(private readonly page: Page)` chưa dùng.
- `docs/daily-log.md`: heading `# Day08` vẫn là H1 nằm dưới `## 2026-11-17`. File cũng không có newline cuối.

## Làm tốt

1. **Fail-fast với message hướng dẫn cách sửa**: `Missing required environment variable "BASE_URL". Copy .env.example to .env and fill in the value.` Message chỉ rõ thiếu gì và làm gì, thay vì để test chạy với `undefined` rồi fail khó hiểu ở `page.goto(undefined)`. Bạn cũng tự kiểm chứng và ghi vào daily-log. Return type `string` (không phải `string | undefined`) giúp mọi chỗ dùng không cần check `undefined` nữa. Đây là ví dụ đúng của việc dùng **type narrowing** để đẩy kiểm tra về một chỗ.
2. **Một nguồn sự thật cho config, có type**: `AppConfig` với `readonly` lồng nhau, `playwright.config.ts` và test cùng đọc từ `config`. Không còn `"https://practicesoftwaretesting.com/"` hardcode, không còn `process.env.X` rải rác trong test. Đây là bản TS của pattern `settings.py`/`pydantic-settings` mà bạn quen, nhưng có autocomplete `config.customer.` trong IDE.
3. **Tách credential khỏi test data**: `users.ts` giờ chỉ chứa data negative giả, không còn đọc env. Credential thật nằm ở `config`. Data giả và secret không còn trộn lẫn, đúng hướng cho D9 (factory/builder).

## Score

| Tiêu chí                     | Điểm                                                                                        |
| ---------------------------- | ------------------------------------------------------------------------------------------- |
| Correctness (3)              | 2.5: local xanh 9/9; trừ 0.5 vì config crash khi chạy trên CI (đã kiểm chứng)               |
| Locator & waiting (3)        | 3: không thay đổi locator/wait, không có regression                                         |
| Structure/POM (2)            | 1.5: config tập trung, có type; trừ vì mọi biến bắt buộc eager, `/account` vẫn nằm ở test   |
| Readability & TS quality (2) | 1.5: interface `readonly` tốt; trừ vì tên test lệch data, `.env.example` lộn xộn, log noise |
| **Tổng**                     | **8.5 / 10**                                                                                |

**Kết luận: PASS** ✅. Không có issue High, score ≥ 7. Issues: High 0 · Medium 1 · Low 4.
Nên sửa issue Medium trước D11, vì `storageState` + setup project sẽ còn phụ thuộc vào config nhiều hơn.

## Câu hỏi kiểm tra hiểu bài

(a) Khi chạy 6 workers, `env.ts` (và `dotenv/config`) được evaluate **bao nhiêu lần**, và vì sao? So với Python: một module-level `settings = Settings()` được import trong 6 process `pytest-xdist` thì sao? Gợi ý: nhìn số dòng `◇ injected env` trong output.
(b) `AppConfig` khai báo `readonly baseUrl`. Nếu ở đâu đó viết `(config as any).baseUrl = "x"`, thì runtime có chặn không? `readonly` của TS bảo vệ ở **compile-time** hay **runtime**? Muốn chặn ở runtime thì dùng gì? (keyword: `Object.freeze`, `as const`)
(c) Với `baseURL` hiện tại, `page.goto("/auth/login")` và `page.goto("auth/login")` khác nhau thế nào nếu sau này `BASE_URL` có path, ví dụ `https://example.com/toolshop/`? (keyword: URL resolution, `new URL(relative, base)`)
Docs: https://playwright.dev/docs/api/class-testoptions#test-options-base-url
