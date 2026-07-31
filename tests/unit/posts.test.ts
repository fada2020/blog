import { describe, expect, it } from "vitest";
import {
  assertPublishedHeroImages,
  isPublishedPost,
  sortPostsNewestFirst,
} from "../../src/lib/posts";

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

  it("잘못된 크기의 공개 글 대표 이미지 fixture로 빌드를 중단한다", () => {
    const invalidPublicPostFixture = [
      {
        id: "invalid-cover",
        data: {
          draft: false,
          heroImage: {
            src: "/invalid-cover.webp",
            width: 1199,
            height: 630,
            format: "webp" as const,
          },
        },
      },
    ];

    expect(() => assertPublishedHeroImages(invalidPublicPostFixture)).toThrow(
      '공개 글 "invalid-cover"의 대표 이미지는 정확히 1200x630이어야 합니다.',
    );
  });
});
