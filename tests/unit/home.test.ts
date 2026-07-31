import { describe, expect, it } from "vitest";
import { resolveTopicLinks, splitHomePosts } from "../../src/lib/home";

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

  it("실제 카테고리가 있는 관심 분야에만 링크를 설정한다", () => {
    expect(
      resolveTopicLinks(["Backend", "Frontend"], ["Backend"]),
    ).toEqual([
      { name: "Backend", hrefCategory: "Backend" },
      { name: "Frontend", hrefCategory: undefined },
    ]);
  });
});
