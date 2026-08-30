import { expect, test } from "@playwright/test";

test("홈에서 공개 글을 열 수 있다", async ({ page }) => {
  await page.goto("/blog/");

  await page
    .locator(".featured-story")
    .getByRole("link", { name: /일요일 주식 학습/ })
    .click();

  await expect(page).toHaveURL(
    /\/blog\/posts\/sunday-stock-rebalancing-checklist-2026-08-30\/$/,
  );
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "일요일 주식 학습: 주말 리밸런싱은 예측이 아니라 노출 점검이다",
  );
  const heroImage = page.locator(".hero img");
  await expect(heroImage).toHaveAttribute("data-image-component", "true");
  await expect(heroImage).toHaveAttribute("src", /^\/blog\/_image/);
  await expect(heroImage).toHaveAttribute(
    "alt",
    "주말 포트폴리오 리밸런싱을 금리, 환율, 유가, 미국 지수, 한국 지수 노출로 나눠 점검하는 대시보드",
  );
});

test("홈은 대표 글과 매거진 편집 섹션을 표시한다", async ({ page }) => {
  await page.goto("/blog/");

  await expect(page.getByRole("region", { name: "대표 글" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "관심 분야" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "학습 로드맵" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "주간 편집 원칙" })).toBeVisible();
  await expect(page.getByText("Next.js", { exact: true })).toBeVisible();
  await expect(page.getByText("React Native", { exact: true })).toBeVisible();
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
      name: /일요일 주식 학습/,
    }),
  ).toBeVisible();
  await expect(
    page.locator(".post-list").getByRole("link", {
      name: /일요일 기술 심화/,
    }),
  ).toBeVisible();
});

test("홈 최신 글은 페이지네이션으로 다음 페이지를 탐색할 수 있다", async ({ page }) => {
  await page.goto("/blog/");

  const pagination = page.getByRole("navigation", { name: "최신 글 페이지 이동" });
  await expect(pagination).toBeVisible();
  await expect(pagination.getByText("1", { exact: true })).toHaveAttribute(
    "aria-current",
    "page",
  );

  const nextPage = pagination.getByRole("link", { name: "다음" });
  await expect(nextPage).toHaveAttribute("href", "/blog/page/2/");
  await nextPage.click();

  await expect(page).toHaveURL(/\/blog\/page\/2\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("최신 글 2페이지");
  await expect(
    page.getByRole("navigation", { name: "최신 글 페이지 이동" }).getByRole("link", {
      name: "이전",
    }),
  ).toHaveAttribute("href", "/blog/");
});

test("카테고리와 태그로 공개 글을 탐색할 수 있다", async ({ page }) => {
  await page.goto("/blog/");

  await page.getByRole("link", { name: "Frontend", exact: true }).first().click();
  await expect(page).toHaveURL(/\/blog\/categories\/Frontend\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Frontend 글");
  await expect(
    page.getByRole("link", { name: /Spring Boot 개발자를 위한 Flutter 넷째 걸음/ }),
  ).toBeVisible();

  await page.getByRole("link", { name: "#Flutter", exact: true }).first().click();
  await expect(page).toHaveURL(/\/blog\/tags\/Flutter\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("#Flutter");
  await expect(
    page.getByRole("link", { name: /Spring Boot 개발자를 위한 Flutter 넷째 걸음/ }),
  ).toBeVisible();
});

test("글이 많은 태그는 페이지네이션으로 다음 페이지를 제공한다", async ({ page }) => {
  await page.goto("/blog/tags/Spring%20Boot/");

  const pagination = page.getByRole("navigation", { name: "#Spring Boot 페이지 이동" });
  await expect(pagination).toBeVisible();

  const nextPage = pagination.getByRole("link", { name: "다음" });
  await expect(nextPage).toHaveAttribute("href", "/blog/tags/Spring%20Boot/page/2/");
  await nextPage.click();

  await expect(page).toHaveURL(/\/blog\/tags\/Spring%20Boot\/page\/2\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("#Spring Boot");
  await expect(
    page.getByRole("navigation", { name: "#Spring Boot 페이지 이동" }).getByRole("link", {
      name: "이전",
    }),
  ).toHaveAttribute("href", "/blog/tags/Spring%20Boot/");
});

test("글 유형 링크로 학습 글을 모아볼 수 있다", async ({ page }) => {
  await page.goto("/blog/posts/nextjs-first-step/");

  await page.getByRole("link", { name: "학습", exact: true }).click();

  await expect(page).toHaveURL(/\/blog\/kinds\/learning\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("학습 글");
  await expect(
    page.getByRole("link", {
      name: /Spring Boot 개발자를 위한 Flutter 넷째 걸음/,
    }),
  ).toBeVisible();

  await page.getByRole("link", { name: "다음" }).click();
  await expect(page).toHaveURL(/\/blog\/kinds\/learning\/page\/2\/$/);
  await expect(
    page.getByRole("link", { name: "Spring Boot 개발자를 위한 Next.js 첫걸음" }),
  ).toBeVisible();
});

test("초안 URL은 생성되지 않는다", async ({ request }) => {
  const response = await request.get("/blog/posts/draft-example/");

  expect(response.status()).toBe(404);
});
