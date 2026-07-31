import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { expect, test } from "@playwright/test";

const publicTitle = "Astro로 기술 블로그 시작하기";
const draftTitle = "작성 중인 배포 점검 메모";
const articleUrl = "https://fada2020.github.io/blog/posts/hello-astro/";

test("글 상세에 canonical과 공유 메타데이터가 있다", async ({ page }) => {
  await page.goto("/blog/posts/hello-astro/");

  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", articleUrl);
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
  await expect(page.locator('meta[name="description"]')).toHaveCount(1);
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute("content", "article");
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    "content",
    `${publicTitle} | Field Notes`,
  );
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content", articleUrl);
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
    "content",
    "summary_large_image",
  );

  const openGraphImage = await page.locator('meta[property="og:image"]').getAttribute("content");
  const twitterImage = await page.locator('meta[name="twitter:image"]').getAttribute("content");

  expect(openGraphImage).toMatch(
    /^https:\/\/fada2020\.github\.io\/blog\/_image(?:\/|\?)/,
  );
  expect(twitterImage).toBe(openGraphImage);
});

test("RSS는 공개 글과 base가 포함된 절대 링크만 제공한다", async ({ request }) => {
  const response = await request.get("/blog/rss.xml");
  const body = await response.text();

  expect(response.ok()).toBe(true);
  expect(response.headers()["content-type"]).toMatch(/^application\/(?:rss\+)?xml/);
  expect(body).toContain(publicTitle);
  expect(body).toContain(articleUrl);
  expect(body).not.toContain(draftTitle);
  expect(body).not.toContain("draft-example");
});

test("404 페이지에서 홈과 검색으로 이동할 수 있다", async ({ page }) => {
  const response = await page.goto("/blog/not-found/");

  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("페이지를 찾을 수 없습니다");
  await expect(page.getByRole("link", { name: "홈으로 이동" })).toHaveAttribute(
    "href",
    "/blog/",
  );
  await expect(page.getByRole("link", { name: "글 검색" })).toHaveAttribute(
    "href",
    "/blog/search/",
  );
});

test("빌드 산출물에 RSS, Sitemap, 404가 있고 초안은 없다", async () => {
  const dist = path.resolve("dist");
  const rssPath = path.join(dist, "rss.xml");
  const sitemapPath = path.join(dist, "sitemap-0.xml");
  const sitemapIndexPath = path.join(dist, "sitemap-index.xml");
  const notFoundPath = path.join(dist, "404.html");

  await Promise.all([
    access(rssPath),
    access(sitemapPath),
    access(sitemapIndexPath),
    access(notFoundPath),
  ]);

  const [rss, sitemap] = await Promise.all([
    readFile(rssPath, "utf8"),
    readFile(sitemapPath, "utf8"),
  ]);

  expect(rss).toContain(articleUrl);
  expect(sitemap).toContain(articleUrl);
  expect(rss).not.toContain(draftTitle);
  expect(rss).not.toContain("draft-example");
  expect(sitemap).not.toContain("draft-example");
  await expect(access(path.join(dist, "posts", "draft-example", "index.html"))).rejects.toThrow();
});
