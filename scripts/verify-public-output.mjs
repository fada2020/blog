import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { parseFrontmatter } from "@astrojs/markdown-remark";

const root = process.cwd();
const contentDir = path.join(root, "src", "content", "blog");
const distDir = path.join(root, "dist");

async function listContentFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);
      return entry.isDirectory() ? listContentFiles(entryPath) : [entryPath];
    }),
  );

  return files.flat().filter((file) => /\.(md|mdx)$/.test(file));
}

const contentFiles = await listContentFiles(contentDir);
const unpublished = [];
const now = Date.now();

for (const file of contentFiles) {
  const source = await readFile(file, "utf8");
  const { frontmatter } = parseFrontmatter(source);
  const publishedAt = new Date(frontmatter.publishedAt).getTime();

  if (frontmatter.draft || !Number.isFinite(publishedAt) || publishedAt > now) {
    const relativePath = path.relative(contentDir, file);
    unpublished.push({
      id: relativePath
        .split(path.sep)
        .join("/")
        .replace(/\.(md|mdx)$/, ""),
      title: String(frontmatter.title ?? ""),
    });
  }
}

const outputs = await Promise.all(
  ["rss.xml", "sitemap-0.xml"].map(async (name) => ({
    name,
    content: await readFile(path.join(distDir, name), "utf8"),
  })),
);

for (const post of unpublished) {
  const generatedPost = path.join(distDir, "posts", post.id, "index.html");
  const hasGeneratedPost = await stat(generatedPost).then(
    () => true,
    () => false,
  );

  if (hasGeneratedPost) {
    throw new Error(`비공개 글 산출물이 생성되었습니다: ${post.id}`);
  }

  for (const output of outputs) {
    if (
      output.content.includes(`/posts/${post.id}/`) ||
      (post.title && output.content.includes(post.title))
    ) {
      throw new Error(`${output.name}에 비공개 글이 포함되었습니다: ${post.id}`);
    }
  }
}

console.log(`공개 산출물 검증 완료: 비공개 글 ${unpublished.length}개 제외`);
