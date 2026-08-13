import { expect, test, type Locator, type Page } from "@playwright/test";

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

function parseRgb(color: string) {
  const channels = color.match(/[\d.]+/g)?.slice(0, 3).map(Number);
  if (!channels || channels.length !== 3) {
    throw new Error(`지원하지 않는 색상 형식: ${color}`);
  }
  return channels;
}

function contrastRatio(foreground: string, background: string) {
  const luminance = (color: string) => {
    const [red, green, blue] = parseRgb(color).map((channel) => {
      const normalized = channel / 255;
      return normalized <= 0.04045
        ? normalized / 12.92
        : ((normalized + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
  };
  const lighter = Math.max(luminance(foreground), luminance(background));
  const darker = Math.min(luminance(foreground), luminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

async function expectAccessibleNames(page: Page) {
  const elements = [
    page.getByRole("button"),
    page.getByRole("link"),
    page.locator('img:not([alt=""]), [role="img"]'),
  ];

  for (const roleElements of elements) {
    for (const element of await roleElements.all()) {
      await expect(element).toHaveAccessibleName(/.+/);
    }
  }
}

async function expectKeyboardFocusOutline(page: Page, target: Locator) {
  await page.locator("body").click({ position: { x: 1, y: 1 } });

  for (let index = 0; index < 30; index += 1) {
    await page.keyboard.press("Tab");
    if (
      await target.evaluate(
        (element) => element === document.activeElement,
      )
    ) {
      const outline = await target.evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          style: style.outlineStyle,
          width: Number.parseFloat(style.outlineWidth),
        };
      });
      expect(outline.style).not.toBe("none");
      expect(outline.width).toBeGreaterThan(0);
      return;
    }
  }

  throw new Error("키보드 Tab 순서에서 대상 컨트롤을 찾지 못했습니다.");
}

async function getForegroundAndBackground(target: Locator) {
  return target.evaluate((element) => {
    const foreground = getComputedStyle(element).color;
    let current: Element | null = element;

    while (current) {
      const background = getComputedStyle(current).backgroundColor;
      if (!background.endsWith(", 0)") && background !== "transparent") {
        return { foreground, background };
      }
      current = current.parentElement;
    }

    return {
      foreground,
      background: getComputedStyle(document.documentElement).backgroundColor,
    };
  });
}

for (const viewport of viewports) {
  for (const route of pages) {
    test(`${route.name} ${viewport.name} 화면의 접근성과 레이아웃을 유지한다`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await page.goto(route.path);

      await expect(page.locator("h1")).toHaveCount(1);
      await expectAccessibleNames(page);

      const emptyLinks = await page.locator("a").evaluateAll((links) =>
        links
          .filter((link) => {
            if (link.closest('[aria-hidden="true"]')) return false;
            return (link.getAttribute("href")?.trim() ?? "").length === 0;
          })
          .map((link) => link.outerHTML),
      );
      expect(emptyLinks).toEqual([]);

      const hasHorizontalOverflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth,
      );
      expect(hasHorizontalOverflow).toBe(false);
    });
  }
}

test("홈의 주요 링크와 테마 버튼에 키보드 초점이 표시된다", async ({ page }) => {
  await page.setViewportSize(viewports[2]);
  await page.goto("/blog/");

  await expectKeyboardFocusOutline(page, page.getByRole("link", { name: "Field Notes" }));
  await expectKeyboardFocusOutline(
    page,
    page.getByRole("link", { name: "운영 API 테스트 회고" }),
  );
  await expectKeyboardFocusOutline(page, page.getByRole("button", { name: "테마 전환" }));
});

test("글의 주요 링크와 테마 버튼에 키보드 초점이 표시된다", async ({ page }) => {
  await page.setViewportSize(viewports[2]);
  await page.goto("/blog/posts/hello-astro/");

  await expectKeyboardFocusOutline(page, page.getByRole("link", { name: "Field Notes" }));
  await expectKeyboardFocusOutline(page, page.getByRole("link", { name: "Tooling" }).first());
  await expectKeyboardFocusOutline(page, page.getByRole("button", { name: "테마 전환" }));
});

test("검색의 주요 링크, 입력창과 테마 버튼에 키보드 초점이 표시된다", async ({
  page,
}) => {
  await page.setViewportSize(viewports[2]);
  await page.goto("/blog/search/");

  await expectKeyboardFocusOutline(page, page.getByRole("link", { name: "Field Notes" }));
  await expectKeyboardFocusOutline(page, page.getByRole("searchbox", { name: "검색어" }));
  await expectKeyboardFocusOutline(page, page.getByRole("button", { name: "테마 전환" }));
});

test("모바일 메뉴를 키보드로 열고 닫으며 초점을 표시한다", async ({ page }) => {
  await page.setViewportSize(viewports[0]);
  await page.goto("/blog/");

  const menu = page.getByRole("button", { name: "메뉴 열기" });
  await expectKeyboardFocusOutline(page, menu);
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

test("비교 표는 구분선과 헤더를 표시하고 모바일에서 가로 스크롤된다", async ({
  page,
}) => {
  await page.setViewportSize(viewports[0]);
  await page.goto("/blog/posts/nextjs-first-step/");

  const table = page.getByRole("table");
  const styles = await table.evaluate((element) => {
    const tableStyle = getComputedStyle(element);
    const headerStyle = getComputedStyle(element.querySelector("th")!);

    return {
      borderTopWidth: tableStyle.borderTopWidth,
      headerBackground: headerStyle.backgroundColor,
      overflowX: tableStyle.overflowX,
      tableScrolls: element.scrollWidth > element.clientWidth,
      pageHasNoOverflow:
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    };
  });

  expect(styles.borderTopWidth).not.toBe("0px");
  expect(styles.headerBackground).not.toBe("rgba(0, 0, 0, 0)");
  expect(styles.overflowX).toBe("auto");
  expect(styles.tableScrolls).toBe(true);
  expect(styles.pageHasNoOverflow).toBe(true);
});

test("데스크톱 비교 표는 본문 폭에 맞고 내용에 따라 열 너비를 배분한다", async ({
  page,
}) => {
  await page.setViewportSize(viewports[2]);
  await page.goto("/blog/posts/nextjs-first-step/");

  const layout = await page.getByRole("table").evaluate((table) => {
    const body = table.closest(".article-body")!;
    const cellStyle = getComputedStyle(table.querySelector("td")!);
    const headerWidths = [...table.querySelectorAll("th")].map(
      (header) => header.getBoundingClientRect().width,
    );

    return {
      tableWidth: table.getBoundingClientRect().width,
      bodyWidth: body.getBoundingClientRect().width,
      tableScrolls: table.scrollWidth > table.clientWidth,
      headerWidths,
      cellPaddingInline: Number.parseFloat(cellStyle.paddingInlineStart),
      lineHeight: Number.parseFloat(cellStyle.lineHeight),
    };
  });

  expect(Math.abs(layout.tableWidth - layout.bodyWidth)).toBeLessThanOrEqual(1);
  expect(layout.tableScrolls).toBe(false);
  expect(layout.headerWidths[1]).toBeLessThan(layout.headerWidths[0]);
  expect(layout.headerWidths[1]).toBeLessThan(layout.headerWidths[2]);
  expect(layout.cellPaddingInline).toBeGreaterThanOrEqual(16);
  expect(layout.lineHeight).toBeGreaterThanOrEqual(24);
});

test("코드 블록은 충분한 내부 여백과 가로 스크롤을 제공한다", async ({ page }) => {
  await page.setViewportSize(viewports[0]);
  await page.goto("/blog/posts/nextjs-first-step/");

  const styles = await page.locator(".article-body pre").first().evaluate((element) => {
    const style = getComputedStyle(element);

    return {
      paddingInline: Number.parseFloat(style.paddingInlineStart),
      paddingBlock: Number.parseFloat(style.paddingBlockStart),
      overflowX: style.overflowX,
      pageHasNoOverflow:
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    };
  });

  expect(styles.paddingInline).toBeGreaterThanOrEqual(18);
  expect(styles.paddingBlock).toBeGreaterThanOrEqual(16);
  expect(styles.overflowX).toBe("auto");
  expect(styles.pageHasNoOverflow).toBe(true);
});

test("모바일 글 제목은 한 글자 줄 없이 컨테이너 안에서 렌더링된다", async ({
  page,
}) => {
  await page.setViewportSize(viewports[0]);
  await page.goto("/blog/posts/hello-astro/");

  const layout = await page.locator("h1").evaluate((heading) => {
    const text = heading.textContent ?? "";
    const lines = new Map<number, string>();

    for (let index = 0; index < text.length; index += 1) {
      const range = document.createRange();
      range.setStart(heading.firstChild!, index);
      range.setEnd(heading.firstChild!, index + 1);
      const rect = range.getBoundingClientRect();
      const top = Math.round(rect.top);
      lines.set(top, `${lines.get(top) ?? ""}${text[index]}`);
    }

    const headingRect = heading.getBoundingClientRect();
    const containerRect = heading.parentElement!.getBoundingClientRect();
    return {
      lines: [...lines.values()].map((line) => line.trim()).filter(Boolean),
      insideContainer:
        headingRect.left >= containerRect.left &&
        headingRect.right <= containerRect.right,
      noHorizontalOverflow: heading.scrollWidth <= heading.clientWidth,
    };
  });

  expect(layout.lines.length).toBeGreaterThan(1);
  expect(layout.lines.every((line) => [...line].length > 1)).toBe(true);
  expect(layout.insideContainer).toBe(true);
  expect(layout.noHorizontalOverflow).toBe(true);
});

test("데스크톱 대표 글 제목은 마지막 한 글자만 다음 줄로 떨어지지 않는다", async ({
  page,
}) => {
  await page.setViewportSize(viewports[2]);
  await page.goto("/blog/");

  const layout = await page.locator("#featured-title").evaluate((heading) => {
    const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
    const textNode = walker.nextNode();
    if (!(textNode instanceof Text)) {
      throw new Error("대표 글 제목의 텍스트 노드를 찾지 못했습니다.");
    }

    const text = textNode.textContent ?? "";
    const lines = new Map<number, string>();

    for (let index = 0; index < text.length; index += 1) {
      const range = document.createRange();
      range.setStart(textNode, index);
      range.setEnd(textNode, index + 1);
      const rect = range.getBoundingClientRect();
      const top = Math.round(rect.top);
      lines.set(top, `${lines.get(top) ?? ""}${text[index]}`);
    }

    return {
      lines: [...lines.values()].map((line) => line.trim()).filter(Boolean),
      noHorizontalOverflow: heading.scrollWidth <= heading.clientWidth,
    };
  });

  expect(layout.lines.at(-1)).toBeTruthy();
  expect([...(layout.lines.at(-1) ?? "")].length).toBeGreaterThan(1);
  expect(layout.noHorizontalOverflow).toBe(true);
});

test("모바일 홈의 로드맵은 한 열로 세로 배치된다", async ({ page }) => {
  await page.setViewportSize(viewports[0]);
  await page.goto("/blog/");

  const roadmap = page.getByRole("list", { name: "학습 순서" });
  await expect(roadmap).toBeVisible();

  const itemPositions = await roadmap.getByRole("listitem").evaluateAll((items) =>
    items.map((item) => {
      const rect = item.getBoundingClientRect();
      return {
        left: Math.round(rect.left),
        top: Math.round(rect.top),
      };
    }),
  );

  expect(new Set(itemPositions.map(({ left }) => left)).size).toBe(1);
  expect(itemPositions.every((item, index, all) => index === 0 || item.top > all[index - 1].top)).toBe(
    true,
  );
});

test("홈 대표 글과 관심 분야는 반응형 열 수를 유지한다", async ({ page }) => {
  await page.setViewportSize(viewports[1]);
  await page.goto("/blog/");

  const tabletLayout = await page.evaluate(() => {
    const columnsFor = (selector: string) => {
      const element = document.querySelector<HTMLElement>(selector);
      if (!element) {
        throw new Error(`${selector} 요소를 찾지 못했습니다.`);
      }

      const children = [...element.children].filter(
        (child): child is HTMLElement =>
          child instanceof HTMLElement &&
          getComputedStyle(child).position !== "absolute" &&
          child.getBoundingClientRect().width > 0 &&
          child.getBoundingClientRect().height > 0,
      );
      const lefts = children.map((child) => Math.round(child.getBoundingClientRect().left));
      return new Set(lefts).size;
    };

    return {
      featuredColumns: columnsFor(".featured-story"),
      topicColumns: columnsFor(".topic-grid"),
    };
  });

  expect(tabletLayout.featuredColumns).toBe(2);
  expect(tabletLayout.topicColumns).toBe(2);

  await page.setViewportSize(viewports[2]);
  await page.goto("/blog/");

  const desktopLayout = await page.evaluate(() => {
    const columnsFor = (selector: string) => {
      const element = document.querySelector<HTMLElement>(selector);
      if (!element) {
        throw new Error(`${selector} 요소를 찾지 못했습니다.`);
      }

      const children = [...element.children].filter(
        (child): child is HTMLElement =>
          child instanceof HTMLElement &&
          getComputedStyle(child).position !== "absolute" &&
          child.getBoundingClientRect().width > 0 &&
          child.getBoundingClientRect().height > 0,
      );
      const lefts = children.map((child) => Math.round(child.getBoundingClientRect().left));
      return new Set(lefts).size;
    };

    return {
      featuredColumns: columnsFor(".featured-story"),
      topicColumns: columnsFor(".topic-grid"),
      editorialColumns: columnsFor(".editorial-rhythm"),
    };
  });

  expect(desktopLayout.featuredColumns).toBe(2);
  expect(desktopLayout.topicColumns).toBe(4);
  expect(desktopLayout.editorialColumns).toBe(3);
});

for (const theme of ["light", "dark"] as const) {
  test(`${theme} 테마의 본문, 링크와 버튼은 WCAG 명암비를 만족한다`, async ({
    page,
  }) => {
    await page.addInitScript((selectedTheme) => {
      localStorage.setItem("theme", selectedTheme);
    }, theme);

    for (const route of pages) {
      await page.goto(route.path);
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);

      const targets = [
        page.getByRole("main"),
        page.getByRole("link", { name: "Field Notes" }),
        page.getByRole("button", { name: "테마 전환" }),
      ];
      for (const target of targets) {
        const { foreground, background } = await getForegroundAndBackground(target);
        expect(
          contrastRatio(foreground, background),
          `${route.name} ${target} 명암비`,
        ).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
}
