export type TestTag = `@${string}`;

export interface SearchCase {
  keyword: string;
  tags?: TestTag[];
}

export const searchCases: readonly SearchCase[] = [
  { keyword: "pliers", tags: ["@smoke"] },
  { keyword: "hammer" },
  { keyword: "spanner" },
];

export const noResultSearchKeyword = "#@$!$!";
