import { mergeTests } from "@playwright/test";
import { test as pagesTest } from "./pages.fixture";
import { test as dataTest } from "./data.fixture";

export const test = mergeTests(pagesTest, dataTest);
export { expect } from "@playwright/test";