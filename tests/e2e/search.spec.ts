import { expect, test } from "@playwright/test";

test("검색 인덱스는 공개 글의 여섯 필드만 포함한다", async ({ request }) => {
  const response = await request.get("/blog/search-index.json");
  expect(response.ok()).toBe(true);

  const entries = await response.json();
  expect(entries).toHaveLength(1);
  expect(Object.keys(entries[0]).sort()).toEqual(
    ["category", "description", "href", "publishedAt", "tags", "title"].sort(),
  );
  expect(entries[0].title).toBe("Astro로 기술 블로그 시작하기");
  expect(entries[0].href).toBe("/blog/posts/hello-astro/");
  expect(JSON.stringify(entries)).not.toContain("작성 중인 배포 점검 메모");
});

test("빈 검색어는 안내를 표시하고 공개 글 전체를 노출하지 않는다", async ({
  page,
}) => {
  await page.goto("/blog/search/");

  await expect(page.getByLabel("검색어")).toBeVisible();
  await expect(page.getByRole("status")).toHaveText(
    "제목, 설명, 카테고리 또는 태그를 검색해 보세요.",
  );
  await expect(
    page.getByRole("link", { name: "Astro로 기술 블로그 시작하기" }),
  ).toHaveCount(0);
});

test("제목과 태그를 검색하고 결과 변경을 알린다", async ({ page }) => {
  await page.goto("/blog/search/");
  const input = page.getByLabel("검색어");

  await input.fill("  STATIC   site ");
  await expect(page.getByRole("status")).toHaveText("검색 결과 1개");
  await expect(
    page.getByRole("link", { name: "Astro로 기술 블로그 시작하기" }),
  ).toHaveAttribute("href", "/blog/posts/hello-astro/");

  await input.fill("없는 검색어");
  await expect(page.getByRole("status")).toHaveText(
    '"없는 검색어" 검색 결과가 없습니다.',
  );
});

test("데스크톱과 모바일 헤더에서 검색 페이지로 이동한다", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/blog/");
  await page.getByRole("navigation", { name: "주요 메뉴" }).getByRole("link", {
    name: "검색",
  }).click();
  await expect(page).toHaveURL(/\/blog\/search\/$/);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/blog/");
  await page.getByRole("button", { name: "메뉴 열기" }).click();
  await page
    .getByRole("navigation", { name: "모바일 주요 메뉴" })
    .getByRole("link", { name: "검색" })
    .click();
  await expect(page).toHaveURL(/\/blog\/search\/$/);
});
