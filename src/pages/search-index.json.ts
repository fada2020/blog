import type { APIRoute } from "astro";
import type { SearchEntry } from "../lib/search";
import { getPublishedPosts } from "../lib/posts";
import { withBase } from "../lib/site";

export const GET: APIRoute = async () => {
  const posts = await getPublishedPosts();
  const entries: SearchEntry[] = posts.map(({ id, data }) => ({
    title: data.title,
    description: data.description,
    href: withBase(`/posts/${id}/`),
    category: data.category,
    tags: data.tags,
    publishedAt: data.publishedAt.toISOString(),
  }));

  return new Response(JSON.stringify(entries), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  });
};
