import { expect, test } from "@playwright/test";

test("홈에서 공개 글을 열 수 있다", async ({ page }) => {
  await page.goto("/blog/");

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Field Notes");
  await page.getByRole("link", { name: "Astro로 기술 블로그 시작하기" }).click();

  await expect(page).toHaveURL(/\/blog\/posts\/hello-astro\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Astro로 기술 블로그 시작하기",
  );
  await expect(page.locator("article img")).toHaveAttribute("data-image-component", "true");
  await expect(page.locator("article img")).toHaveAttribute("src", /^\/blog\/_image/);
  await expect(page.locator("article img")).toHaveAttribute(
    "alt",
    "어두운 작업 공간에서 코드와 문서가 정돈된 기술 블로그 편집 화면",
  );
});

test("글 목록은 카드마다 접근 가능한 상세 링크를 하나만 노출한다", async ({ page }) => {
  await page.goto("/blog/");

  const article = page.locator(".post-list article").filter({
    hasText: "Astro로 기술 블로그 시작하기",
  });
  const detailLinks = article
    .getByRole("link")
    .and(article.locator('a[href="/blog/posts/hello-astro/"]'));

  await expect(detailLinks).toHaveCount(1);
  await expect(detailLinks).toHaveAccessibleName("Astro로 기술 블로그 시작하기");
});

test("카테고리와 태그로 공개 글을 탐색할 수 있다", async ({ page }) => {
  await page.goto("/blog/");

  await page.getByRole("link", { name: "Tooling", exact: true }).first().click();
  await expect(page).toHaveURL(/\/blog\/categories\/Tooling\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Tooling 글");
  await expect(page.getByRole("link", { name: "Astro로 기술 블로그 시작하기" })).toBeVisible();

  await page.getByRole("link", { name: "#Astro", exact: true }).click();
  await expect(page).toHaveURL(/\/blog\/tags\/Astro\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("#Astro");
  await expect(page.getByRole("link", { name: "Astro로 기술 블로그 시작하기" })).toBeVisible();
});

test("초안 URL은 생성되지 않는다", async ({ request }) => {
  const response = await request.get("/blog/posts/draft-example/");

  expect(response.status()).toBe(404);
});
