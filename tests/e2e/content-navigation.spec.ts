import { expect, test } from "@playwright/test";

test("홈에서 공개 글을 열 수 있다", async ({ page }) => {
  await page.goto("/blog/");

  await page.getByRole("link", { name: "Astro로 기술 블로그 시작하기" }).click();

  await expect(page).toHaveURL(/\/blog\/posts\/hello-astro\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Astro로 기술 블로그 시작하기",
  );
  const heroImage = page.locator(".hero img");
  await expect(heroImage).toHaveAttribute("data-image-component", "true");
  await expect(heroImage).toHaveAttribute("src", /^\/blog\/_image/);
  await expect(heroImage).toHaveAttribute(
    "alt",
    "어두운 작업 공간에서 코드와 문서가 정돈된 기술 블로그 편집 화면",
  );
});

test("홈은 대표 글과 매거진 편집 섹션을 표시한다", async ({ page }) => {
  await page.goto("/blog/");

  await expect(page.getByRole("region", { name: "대표 글" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "관심 분야" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "학습 로드맵" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "주간 편집 원칙" })).toBeVisible();
  await expect(page.getByText("Next.js", { exact: true })).toBeVisible();
  await expect(page.getByText("React Native")).toBeVisible();
  await expect(page.getByText("Kotlin", { exact: true })).toBeVisible();
  await expect(page.getByText("Flutter", { exact: true })).toBeVisible();
});

test("홈은 관심 분야 링크 계약과 현재 학습 단계 표식을 유지한다", async ({ page }) => {
  await page.goto("/blog/");

  const frontendLink = page
    .getByRole("region", { name: "관심 분야" })
    .getByRole("link", { name: "Frontend", exact: true });
  const backendLink = page
    .getByRole("region", { name: "관심 분야" })
    .getByRole("link", { name: "Backend", exact: true });
  await expect(frontendLink).toHaveAttribute("href", "/blog/categories/Frontend/");
  await expect(backendLink).toHaveAttribute("href", "/blog/categories/Backend/");

  const roadmap = page.getByRole("list", { name: "학습 순서" });
  const currentStep = roadmap.getByRole("listitem").filter({ hasText: "Kotlin" });

  await expect(currentStep).toHaveAttribute("aria-current", "step");
  await expect(currentStep.getByText("현재 단계")).toBeVisible();

  for (const label of ["Next.js", "React Native", "Flutter"]) {
    await expect(roadmap.getByRole("listitem").filter({ hasText: label })).not.toHaveAttribute(
      "aria-current",
      "step",
    );
  }
});

test("가장 최근 글을 대표 글로, 이전 글을 최신 글 목록에 표시한다", async ({ page }) => {
  await page.goto("/blog/");

  await expect(
    page.locator(".featured-story").getByRole("link", {
      name: /Spring Boot 관측성 파이프라인/,
    }),
  ).toBeVisible();
  await expect(
    page.locator(".post-list").getByRole("link", {
      name: /Kotlin 심화/,
    }),
  ).toBeVisible();
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

test("글 유형 링크로 학습 글을 모아볼 수 있다", async ({ page }) => {
  await page.goto("/blog/posts/nextjs-first-step/");

  await page.getByRole("link", { name: "학습", exact: true }).click();

  await expect(page).toHaveURL(/\/blog\/kinds\/learning\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("학습 글");
  await expect(
    page.getByRole("link", {
      name: "Spring Boot 개발자를 위한 Next.js 첫걸음",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Astro로 기술 블로그 시작하기" }),
  ).toBeVisible();
});

test("초안 URL은 생성되지 않는다", async ({ request }) => {
  const response = await request.get("/blog/posts/draft-example/");

  expect(response.status()).toBe(404);
});
