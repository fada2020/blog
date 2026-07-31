# Astro 블로그 Phase 1 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 공개 글만 노출하는 Astro 기술 블로그를 구현하고 `https://fada2020.github.io/blog/`에 GitHub Actions로 배포한다.

**Architecture:** Astro의 정적 빌드와 Content Collections를 중심으로 구성한다. 글은 저장소의 MD/MDX 파일로 관리하고, 공통 조회 함수가 초안 제외와 정렬을 담당하며, 모든 내부 URL은 `/blog` base path를 인식하는 단일 헬퍼를 통과한다. React 런타임은 도입하지 않고 검색과 테마 전환에 필요한 최소한의 브라우저 JavaScript만 사용한다.

**Tech Stack:** Node.js 24, Astro 7.1.6, TypeScript, MDX, `@astrojs/rss`, `@astrojs/sitemap`, Vitest 4.1.10, Playwright 1.62.1, GitHub Pages

## Global Constraints

- 공개 URL은 `https://fada2020.github.io/blog/`다.
- Astro 설정은 `site: "https://fada2020.github.io"`, `base: "/blog"`를 사용한다.
- UI 문구와 PR 제목·본문은 한국어로 작성한다.
- `draft: true` 글은 목록, 상세 경로, 검색, RSS와 Sitemap 어디에도 포함하지 않는다.
- 글마다 카테고리 하나와 기술 태그 여러 개를 가진다.
- 카테고리는 `Backend`, `Infrastructure`, `DevOps`, `Observability`, `Database`, `Tooling`만 허용한다.
- 글 유형은 `learning`, `trend`, `worklog`, `deep-dive`만 허용한다.
- 모든 공개 글은 `1200x630` 대표 이미지와 구체적인 대체 텍스트를 가진다.
- 외부 이미지는 출처와 사용 조건을 확인하고 저장소에서 직접 관리한다.
- 구조와 흐름 설명은 수정 가능한 Mermaid 다이어그램을 우선한다.
- 카드 모서리는 최대 8px이며 중첩 카드를 만들지 않는다.
- 페이지 섹션을 떠 있는 카드처럼 표현하지 않는다.
- 글 본문과 탐색 기능을 우선하고 마케팅 랜딩 페이지를 만들지 않는다.
- `/blog` 경로가 빠진 절대 내부 링크를 직접 작성하지 않는다.

---

### Task 1: Astro 프로젝트 기반과 base path 헬퍼

**Files:**
- Create: `package.json`
- Create: `package-lock.json`
- Create: `astro.config.mjs`
- Create: `tsconfig.json`
- Create: `src/env.d.ts`
- Create: `src/lib/site.ts`
- Create: `tests/unit/site.test.ts`
- Modify: `.gitignore`

**Interfaces:**
- Produces: `SITE_URL: string`, `BASE_PATH: string`, `withBase(path: string): string`
- Consumes: none

- [ ] **Step 1: base path 동작을 고정하는 실패 테스트 작성**

```ts
import { describe, expect, it } from "vitest";
import { withBase } from "../../src/lib/site";

describe("withBase", () => {
  it.each([
    ["/", "/blog/"],
    ["/posts/hello/", "/blog/posts/hello/"],
    ["posts/hello", "/blog/posts/hello"],
  ])("%s를 %s로 변환한다", (input, expected) => {
    expect(withBase(input)).toBe(expected);
  });

  it("외부 URL은 변경하지 않는다", () => {
    expect(withBase("https://docs.astro.build")).toBe("https://docs.astro.build");
  });
});
```

- [ ] **Step 2: 테스트가 모듈 부재로 실패하는지 확인**

Run: `npm test -- tests/unit/site.test.ts`

Expected: FAIL with `Cannot find module '../../src/lib/site'`

- [ ] **Step 3: Astro와 테스트 의존성 설치**

```json
{
  "name": "fada2020-blog",
  "private": true,
  "type": "module",
  "engines": {
    "node": ">=22.12.0"
  },
  "scripts": {
    "dev": "astro dev",
    "build": "astro check && astro build",
    "preview": "astro preview",
    "test": "vitest run",
    "test:e2e": "playwright test"
  },
  "dependencies": {
    "@astrojs/mdx": "7.0.5",
    "@astrojs/rss": "4.0.19",
    "@astrojs/sitemap": "3.7.3",
    "astro": "7.1.6",
    "mermaid": "11.16.0",
    "sharp": "0.35.3"
  },
  "devDependencies": {
    "@astrojs/check": "0.9.10",
    "@playwright/test": "1.62.1",
    "typescript": "6.0.3",
    "vitest": "4.1.10"
  }
}
```

Run: `npm install`

Expected: `package-lock.json` 생성

- [ ] **Step 4: Astro 설정과 URL 헬퍼 구현**

```js
// astro.config.mjs
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://fada2020.github.io",
  base: "/blog",
  integrations: [mdx(), sitemap()],
});
```

```ts
// src/lib/site.ts
export const SITE_URL = "https://fada2020.github.io";
export const BASE_PATH = "/blog";

export function withBase(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (normalized === "/") return `${BASE_PATH}/`;
  return `${BASE_PATH}${normalized}`;
}
```

- [ ] **Step 5: 단위 테스트와 Astro 설정 검사**

Run: `npm test -- tests/unit/site.test.ts && npx astro check`

Expected: PASS

- [ ] **Step 6: 기반 구성 커밋**

```bash
git add package.json package-lock.json astro.config.mjs tsconfig.json src/env.d.ts src/lib/site.ts tests/unit/site.test.ts .gitignore
git commit -m "Astro 블로그 프로젝트 기반 구성"
```

---

### Task 2: 콘텐츠 스키마와 공개 글 조회

**Files:**
- Create: `src/content.config.ts`
- Create: `src/lib/posts.ts`
- Create: `src/content/blog/hello-astro.mdx`
- Create: `src/content/blog/draft-example.mdx`
- Create: `src/assets/blog/hello-astro/cover.webp`
- Create: `src/assets/blog/draft-example/cover.webp`
- Create: `tests/unit/posts.test.ts`

**Interfaces:**
- Produces: `Category`, `PostKind`, `isPublishedPost(data, now)`, `getPublishedPosts()`
- Consumes: Astro `blog` content collection

- [ ] **Step 1: 공개 조건과 정렬 테스트 작성**

```ts
import { describe, expect, it } from "vitest";
import { isPublishedPost, sortPostsNewestFirst } from "../../src/lib/posts";

const now = new Date("2026-07-31T00:00:00Z");

describe("공개 글 필터", () => {
  it("초안과 미래 글을 제외한다", () => {
    expect(isPublishedPost({ draft: true, publishedAt: new Date("2026-07-01") }, now)).toBe(false);
    expect(isPublishedPost({ draft: false, publishedAt: new Date("2026-08-01") }, now)).toBe(false);
    expect(isPublishedPost({ draft: false, publishedAt: new Date("2026-07-01") }, now)).toBe(true);
  });

  it("최신 글부터 정렬한다", () => {
    const result = sortPostsNewestFirst([
      { data: { publishedAt: new Date("2026-07-01") } },
      { data: { publishedAt: new Date("2026-07-20") } },
    ]);
    expect(result[0].data.publishedAt.toISOString()).toContain("2026-07-20");
  });
});
```

- [ ] **Step 2: 테스트가 export 부재로 실패하는지 확인**

Run: `npm test -- tests/unit/posts.test.ts`

Expected: FAIL with missing exports

- [ ] **Step 3: Content Collection 스키마 작성**

```ts
import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const blog = defineCollection({
  loader: glob({ base: "./src/content/blog", pattern: "**/*.{md,mdx}" }),
  schema: ({ image }) => z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
    draft: z.boolean().default(true),
    category: z.enum([
      "Backend",
      "Infrastructure",
      "DevOps",
      "Observability",
      "Database",
      "Tooling",
    ]),
    tags: z.array(z.string().min(1)).min(1),
    kind: z.enum(["learning", "trend", "worklog", "deep-dive"]),
    heroImage: image(),
    heroImageAlt: z.string().min(10),
    imageCredit: z
      .object({
        label: z.string().min(1),
        url: z.url().optional(),
      })
      .optional(),
    series: z.string().optional(),
    lesson: z.number().int().positive().optional(),
  }),
});

export const collections = { blog };
```

- [ ] **Step 4: 공개 글 조회 함수 구현**

```ts
import { getCollection, type CollectionEntry } from "astro:content";

type Publishable = Pick<CollectionEntry<"blog">["data"], "draft" | "publishedAt">;

export function isPublishedPost(data: Publishable, now = new Date()): boolean {
  return !data.draft && data.publishedAt.getTime() <= now.getTime();
}

export function sortPostsNewestFirst<T extends { data: { publishedAt: Date } }>(posts: T[]): T[] {
  return [...posts].sort(
    (left, right) => right.data.publishedAt.getTime() - left.data.publishedAt.getTime(),
  );
}

export async function getPublishedPosts(now = new Date()) {
  const posts = await getCollection("blog", ({ data }) => isPublishedPost(data, now));
  return sortPostsNewestFirst(posts);
}
```

- [ ] **Step 5: 공개 글과 초안 fixture 작성 후 검증**

Generate a `1200x630` bitmap cover for each fixture. The public fixture uses a quiet technical
editorial composition with no text baked into the bitmap. The draft fixture can use a plain local
test image. Reference each image through `heroImage`, provide a concrete `heroImageAlt`, and set
`imageCredit.label` to `AI 생성 이미지` for the generated asset.

Run: `npm test -- tests/unit/posts.test.ts && npm run build`

Expected: PASS, content schema errors 없음

- [ ] **Step 6: 콘텐츠 계층 커밋**

```bash
git add src/content.config.ts src/lib/posts.ts src/content/blog src/assets/blog tests/unit/posts.test.ts
git commit -m "블로그 콘텐츠 스키마와 공개 조건 추가"
```

---

### Task 3: Figma 화면 설계와 UI 기반

**Files:**
- Create: `src/styles/global.css`
- Create: `src/layouts/BaseLayout.astro`
- Create: `src/components/SiteHeader.astro`
- Create: `src/components/SiteFooter.astro`
- Create: `src/components/ThemeToggle.astro`
- Create: `tests/e2e/layout.spec.ts`

**Interfaces:**
- Produces: `BaseLayout` props `{ title, description, image?, article? }`
- Consumes: `withBase()`, Figma 화면 설계

- [ ] **Step 1: Figma에 데스크톱과 모바일 화면 설계**

Create a Figma design file named `AI 기술 블로그 Phase 1`.
Search available design-system assets before drawing.
Design these frames:

- 홈 데스크톱 1440px
- 홈 모바일 390px
- 글 상세 데스크톱 1440px
- 글 상세 모바일 390px

The visual direction is a quiet technical publication: white/near-black surfaces, green accent,
blue link color, coral warning/accent support, compact 8px-radius post cards, readable code blocks,
no gradients, no nested cards, and no oversized marketing hero.

- [ ] **Step 2: 레이아웃 E2E 실패 테스트 작성**

```ts
import { expect, test } from "@playwright/test";

test("홈에 헤더와 테마 전환 버튼이 표시된다", async ({ page }) => {
  await page.goto("/blog/");
  await expect(page.getByRole("banner")).toBeVisible();
  await expect(page.getByRole("button", { name: "테마 전환" })).toBeVisible();
});

test("모바일에서 가로 스크롤이 생기지 않는다", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/blog/");
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);
});
```

- [ ] **Step 3: 테스트가 페이지 부재로 실패하는지 확인**

Run: `npm run test:e2e -- tests/e2e/layout.spec.ts`

Expected: FAIL because `/blog/` page/layout does not exist

- [ ] **Step 4: 디자인 토큰과 공통 레이아웃 구현**

Define CSS custom properties for:

```css
:root {
  --color-bg: #f7f8f5;
  --color-surface: #ffffff;
  --color-text: #17201b;
  --color-muted: #5f6b64;
  --color-border: #d8ded9;
  --color-accent: #16794b;
  --color-link: #1769aa;
  --color-support: #c75b3f;
  --radius: 8px;
  --content-width: 1120px;
  --reading-width: 760px;
}
```

Implement semantic header, main and footer landmarks.
Persist theme in `localStorage`, while defaulting to `prefers-color-scheme`.
Use an icon button with accessible label `테마 전환`.

- [ ] **Step 5: Playwright에서 데스크톱과 모바일 레이아웃 확인**

Run: `npm run test:e2e -- tests/e2e/layout.spec.ts`

Expected: PASS

- [ ] **Step 6: UI 기반 커밋**

```bash
git add src/styles src/layouts src/components tests/e2e/layout.spec.ts playwright.config.ts
git commit -m "기술 블로그 공통 레이아웃과 테마 구현"
```

---

### Task 4: 홈, 글 상세, 카테고리와 태그 탐색

**Files:**
- Create: `src/pages/index.astro`
- Create: `src/pages/posts/[...id].astro`
- Create: `src/pages/categories/[category].astro`
- Create: `src/pages/tags/[tag].astro`
- Create: `src/components/PostList.astro`
- Create: `src/components/PostMeta.astro`
- Create: `tests/e2e/content-navigation.spec.ts`

**Interfaces:**
- Produces: static routes for home, post, category and tag pages
- Consumes: `getPublishedPosts()`, `BaseLayout`, `withBase()`

- [ ] **Step 1: 공개 글 탐색 실패 테스트 작성**

```ts
import { expect, test } from "@playwright/test";

test("홈에서 공개 글을 열 수 있다", async ({ page }) => {
  await page.goto("/blog/");
  await page.getByRole("link", { name: "Astro 블로그를 시작하며" }).click();
  await expect(page).toHaveURL(/\/blog\/posts\/hello-astro\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Astro 블로그를 시작하며");
});

test("초안 URL은 생성되지 않는다", async ({ request }) => {
  const response = await request.get("/blog/posts/draft-example/");
  expect(response.status()).toBe(404);
});
```

- [ ] **Step 2: 테스트가 경로 부재로 실패하는지 확인**

Run: `npm run test:e2e -- tests/e2e/content-navigation.spec.ts`

Expected: FAIL

- [ ] **Step 3: 페이지와 목록 컴포넌트 구현**

Implementation requirements:

- 홈 첫 화면에 블로그 이름, 설명, 최신 글 목록과 카테고리 탐색을 표시한다.
- H1은 블로그 이름으로 사용하고 마케팅 문구를 H1로 사용하지 않는다.
- 글 목록은 날짜, 유형, 카테고리, 제목, 설명과 태그를 제공한다.
- 글 목록과 상세 페이지는 Astro `<Image>`로 대표 이미지를 최적화하여 표시한다.
- 대표 이미지 아래에는 출처가 있을 때만 출처 링크를 표시한다.
- 상세 페이지는 읽기 폭 760px을 유지하고 목차보다 본문을 우선한다.
- 카테고리와 태그 값은 `encodeURIComponent()`로 경로를 생성한다.
- 모든 링크는 `withBase()`를 사용한다.
- `getStaticPaths()`는 `getPublishedPosts()` 결과만 사용한다.

- [ ] **Step 4: 탐색 테스트와 정적 빌드 실행**

Run: `npm run test:e2e -- tests/e2e/content-navigation.spec.ts && npm run build`

Expected: PASS and no `dist/posts/draft-example/index.html`

- [ ] **Step 5: 핵심 페이지 커밋**

```bash
git add src/pages src/components/PostList.astro src/components/PostMeta.astro tests/e2e/content-navigation.spec.ts
git commit -m "블로그 글 목록과 탐색 페이지 구현"
```

---

### Task 5: 본문 이미지와 Mermaid 다이어그램

**Files:**
- Create: `src/components/ArticleImage.astro`
- Create: `src/components/Mermaid.astro`
- Create: `src/scripts/mermaid.ts`
- Create: `tests/e2e/media.spec.ts`
- Modify: `src/content/blog/hello-astro.mdx`
- Modify: `src/styles/global.css`

**Interfaces:**
- Produces: `ArticleImage` props `{ src, alt, caption?, credit?, creditUrl? }`, `Mermaid` props `{ title }`
- Consumes: Astro image service, `mermaid` package

- [ ] **Step 1: 미디어 접근성 실패 테스트 작성**

```ts
import { expect, test } from "@playwright/test";

test("대표 이미지와 본문 이미지에 대체 텍스트가 있다", async ({ page }) => {
  await page.goto("/blog/posts/hello-astro/");
  const images = page.locator("main img");
  await expect(images).not.toHaveCount(0);
  for (let index = 0; index < (await images.count()); index += 1) {
    await expect(images.nth(index)).toHaveAttribute("alt", /.+/);
  }
});

test("Mermaid 다이어그램이 접근 가능한 그림으로 렌더링된다", async ({ page }) => {
  await page.goto("/blog/posts/hello-astro/");
  await expect(page.getByRole("img", { name: "Astro 글 발행 흐름" })).toBeVisible();
});
```

- [ ] **Step 2: 컴포넌트 부재로 테스트가 실패하는지 확인**

Run: `npm run test:e2e -- tests/e2e/media.spec.ts`

Expected: FAIL

- [ ] **Step 3: 이미지와 Mermaid 컴포넌트 구현**

`ArticleImage.astro` must:

- require non-empty `alt`
- render optional caption
- render `credit` as text or a link when `creditUrl` exists
- use Astro `<Image>` for local assets
- reserve dimensions to avoid layout shift

`Mermaid.astro` must:

- accept diagram source through its slot
- wrap the source in a `.mermaid` element
- set `role="img"` and `aria-label={title}`
- load `src/scripts/mermaid.ts` only on pages that use the component

```ts
import mermaid from "mermaid";

const dark = document.documentElement.dataset.theme === "dark";
mermaid.initialize({
  startOnLoad: false,
  securityLevel: "strict",
  theme: dark ? "dark" : "neutral",
});
await mermaid.run({ querySelector: ".mermaid" });
```

- [ ] **Step 4: 샘플 글에 본문 이미지와 다이어그램 추가**

Add one image with a descriptive caption and one Mermaid flow:

```mermaid
flowchart LR
  Draft[초안] --> Review[사람 검토]
  Review --> Approve[승인]
  Approve --> Deploy[GitHub Pages 배포]
```

- [ ] **Step 5: 모바일과 다크 모드 렌더링 검증**

Run: `npm run build && npm run test:e2e -- tests/e2e/media.spec.ts`

Expected: PASS, Mermaid SVG is visible at 390px and 1440px widths

- [ ] **Step 6: 미디어 지원 커밋**

```bash
git add src/components/ArticleImage.astro src/components/Mermaid.astro src/scripts/mermaid.ts src/content/blog/hello-astro.mdx src/styles/global.css tests/e2e/media.spec.ts
git commit -m "블로그 이미지와 Mermaid 다이어그램 지원"
```

---

### Task 6: 정적 검색

**Files:**
- Create: `src/pages/search-index.json.ts`
- Create: `src/pages/search.astro`
- Create: `src/components/SearchPanel.astro`
- Create: `src/scripts/search.ts`
- Create: `tests/unit/search.test.ts`
- Create: `tests/e2e/search.spec.ts`

**Interfaces:**
- Produces: `normalizeSearchText(value: string)`, `/search-index.json`, `/search/`
- Consumes: `getPublishedPosts()`, `withBase()`

- [ ] **Step 1: 검색 정규화와 초안 제외 테스트 작성**

```ts
import { expect, it } from "vitest";
import { normalizeSearchText } from "../../src/lib/search";

it("대소문자와 연속 공백을 정규화한다", () => {
  expect(normalizeSearchText("  Spring   BOOT ")).toBe("spring boot");
});
```

- [ ] **Step 2: 모듈 부재 실패 확인**

Run: `npm test -- tests/unit/search.test.ts`

Expected: FAIL with module not found

- [ ] **Step 3: 빌드 시 검색 인덱스와 클라이언트 필터 구현**

The JSON endpoint must emit only:

```ts
{
  title: string;
  description: string;
  href: string;
  category: Category;
  tags: string[];
  publishedAt: string;
}
```

The browser script fetches `withBase("/search-index.json")`, normalizes the query,
and matches title, description, category and tags. Empty input displays guidance rather than all posts.

- [ ] **Step 4: 단위 및 브라우저 검색 검증**

Run: `npm test -- tests/unit/search.test.ts && npm run test:e2e -- tests/e2e/search.spec.ts`

Expected: PASS, draft title absent from search results

- [ ] **Step 5: 검색 커밋**

```bash
git add src/lib/search.ts src/pages/search-index.json.ts src/pages/search.astro src/components/SearchPanel.astro src/scripts/search.ts tests
git commit -m "정적 블로그 검색 기능 추가"
```

---

### Task 7: RSS, SEO, Sitemap와 오류 페이지

**Files:**
- Create: `src/pages/rss.xml.ts`
- Create: `src/pages/404.astro`
- Create: `src/components/SeoHead.astro`
- Create: `tests/e2e/metadata.spec.ts`

**Interfaces:**
- Produces: `/rss.xml`, canonical URL, Open Graph metadata, 404 page
- Consumes: `SITE_URL`, `BASE_PATH`, `getPublishedPosts()`

- [ ] **Step 1: 메타데이터 실패 테스트 작성**

```ts
import { expect, test } from "@playwright/test";

test("글 상세에 canonical과 Open Graph 메타가 있다", async ({ page }) => {
  await page.goto("/blog/posts/hello-astro/");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://fada2020.github.io/blog/posts/hello-astro/",
  );
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute("content", "article");
});

test("RSS에 초안이 포함되지 않는다", async ({ request }) => {
  const response = await request.get("/blog/rss.xml");
  const body = await response.text();
  expect(body).toContain("Astro 블로그를 시작하며");
  expect(body).not.toContain("공개되지 않을 초안");
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm run test:e2e -- tests/e2e/metadata.spec.ts`

Expected: FAIL

- [ ] **Step 3: SEO와 피드 구현**

Requirements:

- canonical은 `new URL(withBase(path), SITE_URL)`로 생성한다.
- 기본 `og:type`은 `website`, 글 상세는 `article`이다.
- 모든 페이지에 title, description, canonical, Open Graph와 Twitter card를 제공한다.
- 글 상세의 `og:image`와 `twitter:image`는 대표 이미지에서 생성한 절대 URL을 사용한다.
- RSS item link에도 `/blog/` base가 포함돼야 한다.
- Sitemap integration이 생성한 URL에서 초안이 발견되면 빌드를 실패시킨다.
- 404 페이지에는 홈과 검색 링크를 제공한다.

- [ ] **Step 4: 메타데이터와 빌드 산출물 검증**

Run: `npm run build && npm run test:e2e -- tests/e2e/metadata.spec.ts`

Expected: PASS; `dist/rss.xml`, `dist/sitemap-index.xml`, `dist/404.html` 존재

- [ ] **Step 5: SEO 커밋**

```bash
git add src/pages/rss.xml.ts src/pages/404.astro src/components/SeoHead.astro tests/e2e/metadata.spec.ts
git commit -m "RSS와 검색 메타데이터 구성"
```

---

### Task 8: 접근성, 반응형 화면과 시각 검증

**Files:**
- Create: `tests/e2e/accessibility-layout.spec.ts`
- Modify: `src/styles/global.css`
- Modify: affected Astro components

**Interfaces:**
- Produces: verified desktop/mobile UI
- Consumes: all Phase 1 pages

- [ ] **Step 1: 레이아웃 안정성 테스트 작성**

The test must cover 390x844, 768x1024 and 1440x1000 viewports and assert:

```ts
const hasHorizontalOverflow = await page.evaluate(
  () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
);
expect(hasHorizontalOverflow).toBe(false);
```

Also verify one H1 per page, visible keyboard focus, named icon buttons, and no empty links.

- [ ] **Step 2: 테스트 실행 후 실패 항목 기록**

Run: `npm run test:e2e -- tests/e2e/accessibility-layout.spec.ts`

Expected: at least one failure before responsive refinement

- [ ] **Step 3: Figma와 구현 화면 비교 및 CSS 보정**

Run local server at `http://localhost:4321/blog/`.
Capture the home and article pages at desktop and mobile sizes.
Push the live pages into the existing Figma design file as temporary references,
compare spacing, typography, colors and wrapping, refine the component design,
then remove the temporary screenshot references.

- [ ] **Step 4: 전체 화면 검증**

Run:

```bash
npm test
npm run build
npm run test:e2e
```

Expected: all commands exit 0

- [ ] **Step 5: UI 검증 커밋**

```bash
git add src tests/e2e
git commit -m "반응형 화면과 접근성 보완"
```

---

### Task 9: GitHub Pages 배포

**Files:**
- Create: `.github/workflows/deploy.yml`
- Modify: `README.md`
- Test: `.github/workflows/deploy.yml`

**Interfaces:**
- Produces: GitHub Pages deployment from `main`
- Consumes: successful `npm run build`, committed `package-lock.json`

- [ ] **Step 1: 배포 워크플로 작성**

```yaml
name: GitHub Pages 배포

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: 저장소 체크아웃
        uses: actions/checkout@v7
      - name: Astro 빌드 결과 업로드
        uses: withastro/action@v6
        with:
          node-version: 24

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: GitHub Pages 배포
        id: deployment
        uses: actions/deploy-pages@v5
```

- [ ] **Step 2: README에 로컬 실행과 공개 주소 추가**

Document:

```bash
npm ci
npm run dev
npm test
npm run build
npm run test:e2e
```

Also link `https://fada2020.github.io/blog/`.

- [ ] **Step 3: 최종 로컬 검증**

Run:

```bash
npm ci
npm test
npm run build
npm run test:e2e
git diff --check
```

Expected: all commands exit 0

- [ ] **Step 4: 배포 구성 커밋**

```bash
git add .github/workflows/deploy.yml README.md
git commit -m "GitHub Pages 자동 배포 구성"
```

- [ ] **Step 5: 구현 브랜치 푸시 후 한국어 PR 생성**

PR title:

```text
Astro 기술 블로그 Phase 1 구현
```

PR body must include:

- 구현한 페이지와 기능
- `draft: true` 공개 차단 검증
- `/blog/` base path 검증
- 단위 테스트, 빌드와 Playwright 결과
- Figma 디자인 링크
- GitHub Pages는 `main` 병합 후 배포된다는 안내
