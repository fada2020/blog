import { expect, test, type Page } from "@playwright/test";

const pages = [
  { name: "home", path: "/blog/" },
  { name: "article", path: "/blog/posts/hello-astro/" },
  { name: "search", path: "/blog/search/" },
];

const viewports = [
  { name: "mobile", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 1000 },
];

async function expectNamedInteractiveMedia(page: Page) {
  const unnamedElements = await page
    .locator("button, img:not([alt]), img[alt=''], [role='img']")
    .evaluateAll((elements) =>
      elements
        .filter((element) => {
          if (element instanceof HTMLImageElement && element.alt === "") {
            return !element.closest('[aria-hidden="true"]');
          }

          const name =
            element.getAttribute("aria-label") ??
            element.getAttribute("alt") ??
            element.textContent ??
            "";
          return name.trim().length === 0;
        })
        .map((element) => element.outerHTML),
    );

  expect(unnamedElements).toEqual([]);
}

for (const viewport of viewports) {
  for (const route of pages) {
    test(`${route.name} ${viewport.name} 화면의 접근성과 레이아웃을 유지한다`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await page.goto(route.path);

      await expect(page.locator("h1")).toHaveCount(1);

      const emptyLinks = await page.locator("a").evaluateAll((links) =>
        links
          .filter((link) => {
            if (link.closest('[aria-hidden="true"]')) return false;

            const href = link.getAttribute("href")?.trim() ?? "";
            const name =
              link.getAttribute("aria-label")?.trim() ??
              link.textContent?.trim() ??
              "";
            return href.length === 0 || name.length === 0;
          })
          .map((link) => link.outerHTML),
      );
      expect(emptyLinks).toEqual([]);

      await expectNamedInteractiveMedia(page);

      const hasHorizontalOverflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth,
      );
      expect(hasHorizontalOverflow).toBe(false);

      await page.keyboard.press("Tab");
      const focusStyle = await page.evaluate(() => {
        const focused = document.activeElement;
        if (!(focused instanceof HTMLElement)) return null;
        const style = getComputedStyle(focused);
        return {
          tag: focused.tagName,
          outlineStyle: style.outlineStyle,
          outlineWidth: style.outlineWidth,
        };
      });
      expect(focusStyle?.tag).not.toBe("BODY");
      expect(focusStyle?.outlineStyle).not.toBe("none");
      expect(focusStyle?.outlineWidth).not.toBe("0px");
    });
  }
}

test("모바일 메뉴를 키보드로 열고 닫는다", async ({ page }) => {
  await page.setViewportSize(viewports[0]);
  await page.goto("/blog/");

  const menu = page.getByRole("button", { name: "메뉴 열기" });
  await menu.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("navigation", { name: "모바일 주요 메뉴" })).toBeVisible();
  await expect(page.getByRole("button", { name: "메뉴 닫기" })).toHaveAttribute(
    "aria-expanded",
    "true",
  );

  await page.keyboard.press("Space");
  await expect(page.getByRole("navigation", { name: "모바일 주요 메뉴" })).toBeHidden();
});

test("긴 글 콘텐츠와 Mermaid가 모바일 본문을 넘지 않는다", async ({ page }) => {
  await page.setViewportSize(viewports[0]);
  await page.goto("/blog/posts/hello-astro/");

  const overflowingElements = await page.locator("main *").evaluateAll((elements) =>
    elements
      .filter(
        (element) =>
          element.scrollWidth > element.clientWidth &&
          getComputedStyle(element).overflowX !== "auto",
      )
      .map((element) => ({
        tag: element.tagName,
        className: element.className,
        text: element.textContent?.trim().slice(0, 80),
      })),
  );

  expect(overflowingElements).toEqual([]);
});

test("모바일 글 제목은 한국어 어절 중간에서 끊지 않는다", async ({ page }) => {
  await page.setViewportSize(viewports[0]);
  await page.goto("/blog/posts/hello-astro/");

  await expect(page.locator("h1")).toHaveCSS("word-break", "keep-all");
});

for (const theme of ["light", "dark"] as const) {
  test(`${theme} 테마에서 주요 화면을 읽을 수 있다`, async ({ page }) => {
    await page.addInitScript((selectedTheme) => {
      localStorage.setItem("theme", selectedTheme);
    }, theme);

    for (const route of pages) {
      await page.goto(route.path);
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);

      const colors = await page.evaluate(() => {
        const body = getComputedStyle(document.body);
        return {
          background: body.backgroundColor,
          text: body.color,
        };
      });
      expect(colors.background).not.toBe(colors.text);
    }
  });
}
