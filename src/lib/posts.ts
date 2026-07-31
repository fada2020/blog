import type { CollectionEntry } from "astro:content";

import { hasValidPublicHeroImage } from "./hero-image";

type Publishable = Pick<CollectionEntry<"blog">["data"], "draft" | "publishedAt">;
type PostWithHeroImage = Pick<CollectionEntry<"blog">, "id"> & {
  data: Pick<CollectionEntry<"blog">["data"], "draft" | "heroImage">;
};

export function isPublishedPost(data: Publishable, now = new Date()): boolean {
  return !data.draft && data.publishedAt.getTime() <= now.getTime();
}

export function sortPostsNewestFirst<T extends { data: { publishedAt: Date } }>(posts: T[]): T[] {
  return [...posts].sort(
    (left, right) => right.data.publishedAt.getTime() - left.data.publishedAt.getTime(),
  );
}

export function assertPublishedHeroImages(
  posts: PostWithHeroImage[],
): void {
  for (const post of posts) {
    if (!hasValidPublicHeroImage(post.data)) {
      throw new Error(
        `공개 글 "${post.id}"의 대표 이미지는 정확히 1200x630이어야 합니다.`,
      );
    }
  }
}

export async function getPublishedPosts(now = new Date()) {
  const { getCollection } = await import("astro:content");
  const posts = await getCollection("blog", ({ data }) => isPublishedPost(data, now));

  assertPublishedHeroImages(posts);

  return sortPostsNewestFirst(posts);
}
