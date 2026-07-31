import type { CollectionEntry } from "astro:content";

export function splitHomePosts(posts: CollectionEntry<"blog">[]) {
  const [featuredPost, ...latestPosts] = posts;

  return { featuredPost, latestPosts };
}

export function resolveTopicLinks(topics: string[], categories: string[]) {
  const available = new Set(categories);

  return topics.map((name) => ({
    name,
    hrefCategory: available.has(name) ? name : undefined,
  }));
}
