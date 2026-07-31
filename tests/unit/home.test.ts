import { describe, expect, it } from "vitest";
import { resolveTopicLinks, splitHomePosts } from "../../src/lib/home";

describe("홈 글 구성", () => {
  it("공개 글만 최신순으로 정렬한 뒤 첫 글을 대표 글로 사용한다", () => {
    const now = new Date("2026-07-31T00:00:00Z");
    const posts = [
      { id: "old", data: { draft: false, publishedAt: new Date("2026-07-29") } },
      { id: "future", data: { draft: false, publishedAt: new Date("2026-08-01") } },
      { id: "draft", data: { draft: true, publishedAt: new Date("2026-07-31") } },
      { id: "new", data: { draft: false, publishedAt: new Date("2026-07-30") } },
    ] as never[];

    expect(splitHomePosts(posts, now)).toEqual({
      featuredPost: posts[3],
      latestPosts: [posts[0]],
    });
  });

  it("글이 없으면 대표 글과 최신 글을 비운다", () => {
    expect(splitHomePosts([])).toEqual({
      featuredPost: undefined,
      latestPosts: [],
    });
  });

  it("실제 카테고리가 있는 관심 분야에만 링크를 설정한다", () => {
    expect(
      resolveTopicLinks(["Backend", "Tooling"], ["Backend"]),
    ).toEqual([
      { name: "Backend", hrefCategory: "Backend" },
      { name: "Tooling", hrefCategory: undefined },
    ]);
  });
});
