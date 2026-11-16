// @ts-check
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import playwright from "eslint-plugin-playwright";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig(
  // 1. Bỏ qua các folder output / generated
  globalIgnores([
    "node_modules/",
    "playwright-report/",
    "test-results/",
    "blob-report/",
    "playwright/.cache/",
    "tests-examples/",
  ]),

  // 2. Rule JS cơ bản
  eslint.configs.recommended,

  // 3. Rule TypeScript có đọc type (bắt được lỗi quên await)
  tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // 3b. File JS (như chính file config này) không nằm trong tsconfig → tắt type-check
  {
    files: ["**/*.js", "**/*.mjs"],
    extends: [tseslint.configs.disableTypeChecked],
  },

  // 4. Rule riêng của Playwright, chỉ áp dụng cho file test
  {
    files: ["tests/**/*.ts"],
    ...playwright.configs["flat/recommended"],
  },
);
