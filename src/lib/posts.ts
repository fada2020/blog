import type { CollectionEntry } from "astro:content";

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
  const { getCollection } = await import("astro:content");
  const posts = await getCollection("blog", ({ data }) => isPublishedPost(data, now));
  return sortPostsNewestFirst(posts);
}
