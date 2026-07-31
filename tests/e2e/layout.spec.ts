import { expect, test } from "@playwright/test";

test("홈에 헤더와 테마 전환 버튼이 표시된다", async ({ page }) => {
  await page.goto("/blog/");

  await expect(page.getByRole("banner")).toBeVisible();
  await expect(page.getByRole("button", { name: "테마 전환" })).toBeVisible();
});

test("페이지에 본문과 푸터 랜드마크가 표시된다", async ({ page }) => {
  await page.goto("/blog/");

  await expect(page.getByRole("main")).toBeVisible();
  await expect(page.getByRole("contentinfo")).toBeVisible();
});

test("테마 선택을 저장한다", async ({ page }) => {
  await page.goto("/blog/");
  await page.getByRole("button", { name: "테마 전환" }).click();

  const theme = await page.evaluate(() => localStorage.getItem("theme"));
  expect(theme).toMatch(/light|dark/);
});

test("모바일에서 가로 스크롤이 생기지 않는다", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/blog/");

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);
});
