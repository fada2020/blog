import rss from "@astrojs/rss";
import { getPublishedPosts } from "../lib/posts";
import { SITE_URL, withBase } from "../lib/site";

export async function GET() {
  const posts = await getPublishedPosts();

  return rss({
    title: "Field Notes",
    description: "현장에서 배운 기술을 차분하게 기록하는 기술 블로그입니다.",
    site: new URL(withBase("/"), SITE_URL),
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.publishedAt,
      link: new URL(withBase(`/posts/${post.id}/`), SITE_URL).toString(),
    })),
    customData: "<language>ko</language>",
  });
}
