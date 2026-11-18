# Review Day09: Test data (factory/builder) + data-driven test

**Commit:** `880d144 day09: test data: factory/builder and data-driven test`
**Mục tiêu roadmap D9:** Test data: factory/builder, data-driven test bằng loop + `test()`.

## Kiểm tra tự động

| Lệnh                                  | Kết quả                                     |
| ------------------------------------- | ------------------------------------------- |
| `npx tsc --noEmit`                    | ✅ exit 0                                   |
| `npx eslint .`                        | ✅ exit 0                                   |
| `npx playwright test --reporter=list` | ✅ 15/15 passed (9.5s, 6 workers, chromium) |

Không có lệnh nào fail, nên không có issue High từ phần này.

## Issues

### Medium

- **[Medium] `src/data/user.factory.ts:4` + `src/data/types.ts:12`: `createUser()` và `RegisterForm` chưa được test nào dùng.**
  Vì sao: nửa "factory" của mục tiêu D9 mới có code chứ chưa có bằng chứng là chạy đúng. Một factory chưa ai gọi là dead code: không biết default có hợp lệ với form register thật không (ví dụ `country: "Viet Nam"` có khớp `value`/label của `<select>` không, `dateOfBirth` có qua validation tuổi không). Bạn cũng chưa biết `Partial<RegisterForm>` override có tiện khi dùng thật không.
  Hint: hoặc viết 1 test nhỏ dùng `createUser()` (register qua UI, hoặc chờ tuần API với `POST /users/register`), hoặc bỏ factory ra khỏi commit này và thêm lại khi có chỗ dùng (YAGNI). Nếu muốn làm cả "builder" theo roadmap: keyword _builder pattern TypeScript fluent `return this`_. Nên so sánh xem với TS thì `createUser({ ...overrides })` đã đủ chưa. Thường là đủ, đó cũng là một bài học.

- **[Medium] `tests/ui/login.negative.spec.ts` trùng với `tests/ui/login.spec.ts:20-47`, và có 2 nguồn data cho cùng mục đích (`src/data/users.ts` và `src/data/login.data.ts`).**
  Vì sao: "Invalid password", "Invalid email", "Empty email/password" giờ được test ở cả hai file. Khi UI đổi message lỗi sẽ phải sửa 2 chỗ, và report cũng bị nhân đôi. Mục tiêu của data-driven là **thay thế** các test copy-paste, chứ không phải chạy song song với chúng.
  Hint: giữ `login.spec.ts` cho happy path (và case nào có assertion khác biệt, ví dụ `not.toHaveURL` hoặc soft assert 2 lỗi cùng lúc). Phần negative đơn lẻ nên dồn hết sang bảng `loginCases`. Sau đó xem `users.ts` còn cần không.

### Low

- **[Low] `src/data/login.data.ts:22,37`: `uniqueEmail()` chạy lúc import module, không chạy lúc test.**
  Vì sao: `loginCases` là mảng module-level nên email được sinh **mỗi lần file được import**, tức là trong main process (để collect test) và trong từng worker process. Hiện tại không lỗi vì title không chứa email. Nhưng "factory" ở đây thực chất vẫn là data tĩnh được sinh sớm. Với case "Empty password" thì email random cũng không cần thiết. Đây giống `@pytest.mark.parametrize` gọi hàm random lúc collection trong `pytest-xdist`.
  Hint: data cần unique cho từng test thì gọi factory **bên trong** body của test (hoặc trong fixture), đừng gọi trong mảng ở module scope. Một cách khác là lưu trong case một function (`email: () => uniqueEmail()`). Xem thêm câu hỏi cuối bài.

- **[Low] `src/pages/LoginPage.ts:2`: Page object import type từ module test data (`../data/login.data`).**
  Vì sao: chiều phụ thuộc bị ngược. `pages` là tầng thấp hơn `data` (data mô tả case test), vậy mà page lại phụ thuộc vào file data. Sau này đổi hoặc xoá `login.data.ts` sẽ kéo theo page object.
  Hint: khai báo `ErrorPosition` ngay trong `LoginPage.ts` (hoặc `src/data/types.ts`) rồi để `login.data.ts` import từ đó. Hàm `errorFor` với `Record<ErrorPosition, Locator>` thì hay, nên giữ (xem "Làm tốt").

- **[Low] `package.json:29`: thêm `tsx` vào devDependencies nhưng không có file/script nào dùng.**
  Vì sao: dependency thừa làm `npm ci` chậm hơn trên CI và khiến người đọc thắc mắc. `scripts` vẫn là `{}` (đã nhắc ở day08).
  Hint: nếu bạn dùng `tsx` để thử nhanh `createUser()` thì nói rõ bằng một script `"try": "tsx ..."`, còn không thì `npm uninstall tsx`. Playwright Test tự transpile TS nên không cần `tsx` để chạy test.

- **[Low] `tests/ui/search.spec.ts:13`: mọi keyword trong data đều tự động mang tag `@smoke`.**
  Vì sao: smoke suite sẽ phình ra theo độ dài mảng data. Thêm 10 keyword là có 10 smoke test, dù smoke nên nhỏ và cố định.
  Hint: chỉ gắn `@smoke` cho 1 case đại diện (ví dụ thêm field `tags` vào data), phần còn lại gắn `@regression`.

- **[Low] `src/data/helpers.ts:3`: `prefix: string = "user"`**: annotation thừa, TS tự suy ra `string` từ default (giống Python `def f(prefix="user")` vẫn đủ rõ). Keyword: `@typescript-eslint/no-inferrable-types`.

- **[Low] `docs/daily-log.md`:** `# Day09` vẫn là H1 nằm dưới `## 2026-11-18` (đã nhắc ở day08). Câu trả lời day08 (a) "1 lần" **chưa đúng**: mỗi worker là một process Node riêng nên `env.ts` được evaluate trong main process **và** trong từng worker, giống `settings = Settings()` chạy lại trong mỗi process `pytest-xdist`. Hãy đếm lại số dòng `injected env` khi chạy 6 workers. Câu (c) chưa trả lời.

### Không phát hiện

- Không có `waitForTimeout`/sleep, không có `expect(await ...textContent())`, không có floating promise, không có `test.only`, không có `any`.
- Loop `for...of` + `test()` đúng cách. Không dùng `forEach(async ...)`.

## Làm tốt

1. **Thêm "anchor" assertion trước negative assertion** (`search.spec.ts:21`): assert `searchCaption` = `Searched for: ${keyword}` **trước** `filter({ hasNotText }).toHaveCount(0)`. Nếu thiếu bước này, `toHaveCount(0)` có thể pass ngay trên trang cũ hoặc trang rỗng trước khi search xong. Bạn tự giải thích được lý do trong daily-log, đây là hiểu biết thật về web-first assertion, không phải chép pattern.
2. **`errorFor(position): Locator` với `Record<ErrorPosition, Locator>`**: type union `"email" | "password" | "form"` cộng với `Record` cho bạn **exhaustiveness check** lúc compile. Thêm position mới mà quên map thì `tsc` báo lỗi ngay. Hàm trả về `Locator` để test tự `expect`, đúng nguyên tắc "assertion nằm ở test".
3. **Title test unique và mô tả được case** (`login fail: ${loginCase.title}`, `Search for ${keyword}`): Playwright bắt buộc title không trùng trong cùng file. Title lấy từ field cố định chứ không lấy từ email random, nên ổn định giữa các process (xem câu hỏi bên dưới). Có thêm `readonly LoginCase[]` và interface rõ ràng cho data.

## Score

| Tiêu chí                     | Điểm                                                                                           |
| ---------------------------- | ---------------------------------------------------------------------------------------------- |
| Correctness (3)              | 3: 15/15 xanh, data-driven chạy đúng và song song được                                         |
| Locator & waiting (3)        | 3: `getByTestId`/`getByLabel` hợp lý, thêm anchor assertion giảm flaky                         |
| Structure/POM (2)            | 1.5: trừ vì test login trùng ở 2 file, 2 nguồn data, page phụ thuộc ngược vào data             |
| Readability & TS quality (2) | 1: factory và `RegisterForm` chưa dùng, dependency `tsx` thừa, sinh data random ở module scope |
| **Tổng**                     | **8.5 / 10**                                                                                   |

**Kết luận: PASS** ✅. Không có issue High, score ≥ 7. Issues: High 0 · Medium 2 · Low 6.
Nên xử lý 2 issue Medium (cho factory một test dùng thật và gộp login negative) trước khi sang D10.

## Câu hỏi kiểm tra hiểu bài

Giả sử bạn đổi title thành `` `login fail: ${loginCase.title} (${loginCase.email})` ``. Case "Invalid email or password" dùng `uniqueEmail()` ở module scope.

(a) Chạy `npx playwright test --list` rồi chạy thật với 6 workers thì chuyện gì xảy ra, và **vì sao**? (Gợi ý: main process collect test theo title, sau đó worker **import lại** file spec.)
--list chạy bình thường, nhưng chạy thật thì các case có email random bị lỗi

Với --list: không lỗi. Chỉ có main process import file spec để liệt kê test. Mỗi lần chạy --list bạn sẽ thấy một email khác nhau trong title.

Với 6 worker: các case có uniqueEmail() trong title bị lỗi:

Error: Test not found in the worker process. Make sure test title does not change.

Các case có title cố định vẫn chạy bình thường.

Vì sao:

Main process import spec để collect test. Lúc import, uniqueEmail() chạy và sinh user_aaa@.... Test được đăng ký với title có chứa aaa, và test ID được tính từ file + title.
Main process giao cho worker việc: “chạy test có ID X”.
Worker là một process Node riêng, nó import lại file spec từ đầu. uniqueEmail() chạy lại và sinh user_bbb@..., nên title mới chứa bbb.
Worker tìm test có ID X (ứng với aaa) nhưng không thấy, vì chỉ có test ứng với bbb. Kết quả: lỗi.
(b) Từ đó rút ra quy tắc: giá trị random nên được sinh ở đâu (module scope, trong `test()`, hay trong fixture)?
Sinh random ở đâu Dùng được không Lý do
Module scope, đặc biệt khi nằm trong title ❌ Mỗi process sinh một giá trị khác, nên collect bị lệch
Trong body của test() ✅ Chỉ chạy lúc test thực thi, mỗi lần chạy có một giá trị mới
Trong fixture ✅ (tốt nhất khi cần dùng chung hoặc cần cleanup) Có setup và teardown rõ ràng, phù hợp với D14 (tạo data qua API rồi dọn dẹp)

Áp vào code của bạn:

Bảng loginCases chỉ chứa giá trị tĩnh, hoặc chứa một hàm sinh như email: () => uniqueEmail() để body test gọi.
Title chỉ dùng field cố định như loginCase.title.
Muốn biết email nào đã được dùng (để debug), đừng nhét vào title mà ghi vào report bằng test.info().annotations.
(c) So với Python: `pytest-xdist` báo lỗi gì khi `parametrize` sinh id khác nhau giữa các worker?
Different tests were collected between gw0 and gw1. The difference is: ...

Mỗi worker gw0, gw1... collect lại test riêng. Nếu parametrize dùng giá trị random (hoặc ids= random) thì danh sách test giữa các worker khác nhau, và xdist từ chối chạy. Cách fix giống hệt: id phải cố định, giá trị random sinh trong test hoặc fixture.
Docs: https://playwright.dev/docs/test-parameterize · https://playwright.dev/docs/test-parallel#worker-processes
