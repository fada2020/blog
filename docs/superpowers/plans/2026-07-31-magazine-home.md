# 기술 매거진형 홈 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 실제 공개 글만 사용하면서도 글이 1개일 때 비어 보이지 않는 기술 매거진형 홈을 구현한다.

**Architecture:** 홈의 글 분기와 관심 분야 링크 판정은 순수 TypeScript 함수로 분리해 단위 테스트한다. `index.astro`는 그 결과를 대표 글, 관심 분야, 최신 글, 학습 로드맵, 편집 원칙 섹션에 전달하며 기존 전역 레이아웃과 콘텐츠 스키마는 유지한다.

**Tech Stack:** Astro 7, TypeScript 6, Vitest, Playwright, Astro Assets

## Global Constraints

- 존재하지 않는 글, 가짜 조회수, 임의의 인기 순위를 만들지 않는다.
- 공개 글만 대표 글과 최신 글에 사용한다.
- 기존 카테고리, 태그, 검색, 다크 모드와 `/blog/` 경로를 유지한다.
- 로드맵 순서는 `Next.js → React Native → Kotlin → Flutter`로 고정한다.
- 첫 영업일, 둘째 영업일, 마지막 영업일의 편집 원칙을 표시한다.
- 카드 안에 카드를 넣지 않고, 모서리는 최대 8px로 제한한다.

---

### Task 1: 홈 데이터 모델

**Files:**
- Create: `src/lib/home.ts`
- Create: `tests/unit/home.test.ts`

**Interfaces:**
- Consumes: `CollectionEntry<"blog">[]`
- Produces: `splitHomePosts(posts)`와 `resolveTopicLinks(topics, categories)`

- [ ] **Step 1: 대표 글과 최신 글 분기 실패 테스트 작성**

```ts
import { describe, expect, it } from "vitest";
import { splitHomePosts } from "../../src/lib/home";

describe("홈 글 구성", () => {
  it("첫 공개 글을 대표 글로 사용하고 최신 글에서 제외한다", () => {
    const posts = [{ id: "new" }, { id: "old" }] as never[];
    expect(splitHomePosts(posts)).toEqual({
      featuredPost: posts[0],
      latestPosts: [posts[1]],
    });
  });

  it("글이 없으면 대표 글과 최신 글을 비운다", () => {
    expect(splitHomePosts([])).toEqual({
      featuredPost: undefined,
      latestPosts: [],
    });
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npm test -- tests/unit/home.test.ts`
Expected: FAIL because `src/lib/home.ts` does not exist.

- [ ] **Step 3: 최소 분기 함수 구현**

```ts
import type { CollectionEntry } from "astro:content";

export function splitHomePosts(posts: CollectionEntry<"blog">[]) {
  const [featuredPost, ...latestPosts] = posts;
  return { featuredPost, latestPosts };
}
```

- [ ] **Step 4: 관심 분야 링크 판정 실패 테스트 추가**

```ts
it("실제 카테고리가 있는 관심 분야에만 링크를 설정한다", () => {
  expect(
    resolveTopicLinks(["Backend", "Frontend"], ["Backend"]),
  ).toEqual([
    { name: "Backend", hrefCategory: "Backend" },
    { name: "Frontend", hrefCategory: undefined },
  ]);
});
```

- [ ] **Step 5: 관심 분야 링크 판정 구현**

```ts
export function resolveTopicLinks(
  topics: string[],
  categories: string[],
) {
  const available = new Set(categories);
  return topics.map((name) => ({
    name,
    hrefCategory: available.has(name) ? name : undefined,
  }));
}
```

- [ ] **Step 6: 단위 테스트 통과 확인**

Run: `npm test -- tests/unit/home.test.ts`
Expected: all home unit tests PASS.

- [ ] **Step 7: 커밋**

```bash
git add src/lib/home.ts tests/unit/home.test.ts
git commit -m "홈 매거진 데이터 분기 추가"
```

### Task 2: 매거진 홈 섹션

**Files:**
- Create: `src/components/FeaturedPost.astro`
- Modify: `src/pages/index.astro`
- Modify: `tests/e2e/content-navigation.spec.ts`

**Interfaces:**
- Consumes: `splitHomePosts`, `resolveTopicLinks`, `CollectionEntry<"blog">`
- Produces: `.featured-story`, `.topic-grid`, `.latest-section`, `.learning-roadmap`, `.editorial-rhythm`

- [ ] **Step 1: 홈 구조 실패 E2E 테스트 작성**

```ts
test("홈은 대표 글과 매거진 편집 섹션을 표시한다", async ({ page }) => {
  await page.goto("/blog/");

  await expect(page.getByRole("region", { name: "대표 글" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "관심 분야" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "학습 로드맵" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "주간 편집 원칙" })).toBeVisible();
  await expect(page.getByText("Next.js")).toBeVisible();
  await expect(page.getByText("React Native")).toBeVisible();
  await expect(page.getByText("Kotlin")).toBeVisible();
  await expect(page.getByText("Flutter")).toBeVisible();
});
```

- [ ] **Step 2: 실패 확인**

Run: `npm run test:e2e -- tests/e2e/content-navigation.spec.ts`
Expected: FAIL because the magazine sections do not exist.

- [ ] **Step 3: 대표 글 컴포넌트 구현**

`FeaturedPost.astro`는 `post: CollectionEntry<"blog">`를 받아 다음을 렌더링한다.

```astro
<section class="featured-story" aria-labelledby="featured-title">
  <Image src={post.data.heroImage} alt={post.data.heroImageAlt} />
  <div class="featured-copy">
    <p class="eyebrow">Featured story</p>
    <PostMeta post={post} />
    <h1 id="featured-title">
      <a href={withBase(`/posts/${post.id}/`)}>{post.data.title}</a>
    </h1>
    <p>{post.data.description}</p>
    <a class="read-link" href={withBase(`/posts/${post.id}/`)}>글 읽기</a>
  </div>
</section>
```

이미지는 데스크톱에서 화면 절반, 모바일에서 전체 너비를 사용하고 1200:630
종횡비를 유지한다.

- [ ] **Step 4: 홈 섹션 구현**

`index.astro`에서 공개 글을 분기하고 다음 순서로 렌더링한다.

```astro
{featuredPost ? (
  <FeaturedPost post={featuredPost} />
) : (
  <section class="empty-featured" aria-labelledby="empty-featured-title">
    <h1 id="empty-featured-title">첫 기록을 준비하고 있습니다</h1>
  </section>
)}
<section class="topic-section" aria-labelledby="topics-title">
  <h2 id="topics-title">관심 분야</h2>
</section>
<section class="latest-section" aria-labelledby="latest-title">
  <h2 id="latest-title">최신 글</h2>
</section>
<section class="roadmap-section" aria-labelledby="roadmap-title">
  <h2 id="roadmap-title">학습 로드맵</h2>
</section>
<section class="editorial-section" aria-labelledby="editorial-title">
  <h2 id="editorial-title">주간 편집 원칙</h2>
</section>
```

별도 `EmptyPublishedState` 컴포넌트는 만들지 않고 글이 0개인 분기 안에 짧은
상태 문구를 직접 작성한다. 관심 분야 설명은 다음으로 고정한다.

- Backend: 안정적인 API와 데이터 흐름
- Frontend: 사용자 경험을 만드는 웹 기술
- DevOps: 반복 가능한 배포와 인프라
- Observability: 로그, 메트릭, 트레이스로 읽는 운영

- [ ] **Step 5: E2E 테스트 통과 확인**

Run: `npm run test:e2e -- tests/e2e/content-navigation.spec.ts`
Expected: all content navigation tests PASS.

- [ ] **Step 6: 전체 단위 테스트 확인**

Run: `npm test`
Expected: all unit tests PASS.

- [ ] **Step 7: 커밋**

```bash
git add src/components/FeaturedPost.astro src/pages/index.astro tests/e2e/content-navigation.spec.ts
git commit -m "기술 매거진형 홈 구성"
```

### Task 3: 반응형과 시각 검증

**Files:**
- Modify: `tests/e2e/accessibility-layout.spec.ts`
- Modify: `PLAN.md`

**Interfaces:**
- Consumes: Task 2의 홈 섹션 클래스와 접근 가능한 제목
- Produces: 모바일·태블릿·데스크톱 회귀 검증

- [ ] **Step 1: 모바일 로드맵 배치 테스트 작성**

```ts
test("모바일 홈의 로드맵은 세로 단계로 배치된다", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/blog/");

  const roadmap = page.getByRole("list", { name: "학습 순서" });
  await expect(roadmap).toBeVisible();
  expect(
    await roadmap.evaluate((element) => getComputedStyle(element).gridTemplateColumns),
  ).toBe("374px");
});
```

실제 콘텐츠 폭에 따라 픽셀값이 달라지지 않도록 구현 후에는 한 열인지
검사하는 방식으로 조정한다.

- [ ] **Step 2: 실패 확인**

Run: `npm run test:e2e -- tests/e2e/accessibility-layout.spec.ts`
Expected: FAIL until the roadmap list and mobile layout exist.

- [ ] **Step 3: 접근성 및 반응형 스타일 보완**

`index.astro`와 `FeaturedPost.astro`의 기존 컴포넌트 전용 스타일에서 다음을
보장한다.

- 1440px: 대표 글 2열, 관심 분야 4열, 편집 원칙 3열
- 768px: 대표 글 2열 유지, 관심 분야 2열
- 390px: 모든 섹션 1열, 로드맵 세로 배치
- 모든 섹션의 구분선과 배경 밴드는 중첩 카드 없이 렌더링
- 링크와 대표 글 제목에 기존 `:focus-visible` 적용

- [ ] **Step 4: E2E 전체 통과 확인**

Run: `npm run test:e2e`
Expected: all E2E tests PASS at 390px, 768px, and 1440px.

- [ ] **Step 5: 빌드와 공개 안전장치 확인**

Run: `npm run build`
Expected: Astro check 0 errors and public output verification PASS.

- [ ] **Step 6: 실제 화면 캡처 확인**

Run: `npm run dev -- --host 127.0.0.1`

Playwright로 다음 화면을 캡처해 여백, 겹침, 이미지 로딩을 직접 확인한다.

- 홈 1440x1000 라이트
- 홈 768x1024 다크
- 홈 390x844 라이트

- [ ] **Step 7: 계획 상태 갱신**

`PLAN.md`의 Phase 1 후속 작업에 기술 매거진형 홈 완료 사실과 검증 결과를
한 줄로 기록한다.

- [ ] **Step 8: 커밋**

```bash
git add tests/e2e/accessibility-layout.spec.ts PLAN.md src/pages/index.astro src/components/FeaturedPost.astro
git commit -m "매거진 홈 반응형 검증 보강"
```

### Task 4: 최종 검토와 PR

**Files:**
- Review: all files changed from `origin/main`

**Interfaces:**
- Consumes: Tasks 1-3의 전체 변경
- Produces: 검증된 한국어 PR

- [ ] **Step 1: 전체 검증**

Run:

```bash
npm test
npm run build
npm run test:e2e
git diff --check origin/main...HEAD
```

Expected: all commands PASS.

- [ ] **Step 2: 변경 범위 검토**

Run: `git diff --stat origin/main...HEAD`
Expected: 홈 개편, 테스트, 계획 문서 외의 파일이 없어야 한다.

- [ ] **Step 3: 브랜치 푸시**

```bash
git push -u origin codex/magazine-home
```

- [ ] **Step 4: 한국어 PR 생성**

PR 제목은 `기술 매거진형 홈 개편`으로 하고 변경 사항, 검증 결과, 배포 후
확인 사항을 한국어로 작성한다.
