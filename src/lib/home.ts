import type { CollectionEntry } from "astro:content";

import type { Category } from "../content.config";
import { isPublishedPost, sortPostsNewestFirst } from "./posts";

export function splitHomePosts(posts: CollectionEntry<"blog">[], now = new Date()) {
  const publishedPosts = sortPostsNewestFirst(
    posts.filter(({ data }) => isPublishedPost(data, now)),
  );
  const [featuredPost, ...latestPosts] = publishedPosts;

  return { featuredPost, latestPosts };
}

export function resolveTopicLinks(topics: Category[], categories: Category[]) {
  const available = new Set(categories);

  return topics.map((name) => ({
    name,
    hrefCategory: available.has(name) ? name : undefined,
  }));
}
