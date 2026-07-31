import { expect, test } from "@playwright/test";

test("대표 이미지와 본문 이미지에 대체 텍스트가 있다", async ({ page }) => {
  await page.goto("/blog/posts/hello-astro/");

  const images = page.locator("main img");
  await expect(images).toHaveCount(2);

  for (let index = 0; index < (await images.count()); index += 1) {
    await expect(images.nth(index)).toHaveAttribute("alt", /.+/);
  }

  await expect(
    page.getByText("업무일지에서 검토 가능한 기술 글이 만들어지는 과정"),
  ).toBeVisible();
});

test("Mermaid 다이어그램이 접근 가능한 그림으로 렌더링된다", async ({
  page,
}) => {
  await page.goto("/blog/posts/hello-astro/");

  const diagram = page.getByRole("img", { name: "Astro 글 발행 흐름" });
  await expect(diagram).toBeVisible();
  await expect(diagram.locator("svg")).toBeVisible();
});

test("Mermaid는 모바일 다크 모드에서도 보이고 넘치지 않는다", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/blog/posts/hello-astro/");

  const diagram = page.getByRole("img", { name: "Astro 글 발행 흐름" });
  await expect(diagram.locator("svg")).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

  const overflow = await diagram.evaluate(
    (element) => element.scrollWidth > element.clientWidth,
  );
  expect(overflow).toBe(false);
});

test("Mermaid 클라이언트 코드는 사용하는 글에서만 로드한다", async ({
  page,
}) => {
  const homeScripts: string[] = [];
  page.on("request", (request) => {
    if (request.resourceType() === "script") {
      homeScripts.push(request.url());
    }
  });
  await page.goto("/blog/");
  expect(homeScripts.some((url) => url.includes("mermaid"))).toBe(false);

  const articleScripts: string[] = [];
  page.removeAllListeners("request");
  page.on("request", (request) => {
    if (request.resourceType() === "script") {
      articleScripts.push(request.url());
    }
  });
  await page.goto("/blog/posts/hello-astro/");
  expect(articleScripts.some((url) => url.includes("mermaid"))).toBe(true);
});
