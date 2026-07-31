import { describe, expect, it } from "vitest";
import {
  filterSearchEntries,
  normalizeSearchText,
  type SearchEntry,
} from "../../src/lib/search";

const entries: SearchEntry[] = [
  {
    title: "Astro로 기술 블로그 시작하기",
    description: "Content Collections로 글을 관리합니다.",
    href: "/blog/posts/hello-astro/",
    category: "Tooling",
    tags: ["Astro", "Static Site"],
    publishedAt: "2026-07-20T00:00:00.000Z",
  },
];

describe("정적 검색", () => {
  it("대소문자와 연속 공백을 정규화한다", () => {
    expect(normalizeSearchText("  Spring   BOOT ")).toBe("spring boot");
  });

  it.each([
    ["제목", "기술 블로그"],
    ["설명", "content collections"],
    ["카테고리", "tooling"],
    ["태그", "static site"],
  ])("%s에서 정규화된 검색어를 찾는다", (_, query) => {
    expect(filterSearchEntries(entries, query)).toEqual(entries);
  });

  it("빈 검색어에는 글 전체를 반환하지 않는다", () => {
    expect(filterSearchEntries(entries, "   ")).toEqual([]);
  });
});
