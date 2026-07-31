import { execFile } from "node:child_process";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { afterEach, expect, test } from "vitest";

const execFileAsync = promisify(execFile);
const verifier = path.resolve("scripts/verify-public-output.mjs");
const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) =>
      rm(directory, { recursive: true, force: true }),
    ),
  );
});

test("중첩 경로의 초안 ID가 Sitemap에 있으면 검증에 실패한다", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "blog-output-verifier-"));
  temporaryDirectories.push(root);

  await mkdir(path.join(root, "src", "content", "blog", "series"), {
    recursive: true,
  });
  await mkdir(path.join(root, "dist"), { recursive: true });
  await writeFile(
    path.join(root, "src", "content", "blog", "series", "draft-note.mdx"),
    `---
title: "중첩 초안"
publishedAt: 2026-07-01
draft: true
---
`,
  );
  await writeFile(path.join(root, "dist", "rss.xml"), "<rss></rss>");
  await writeFile(
    path.join(root, "dist", "sitemap-0.xml"),
    "<loc>https://example.com/blog/posts/series/draft-note/</loc>",
  );

  await expect(
    execFileAsync(process.execPath, [verifier], { cwd: root }),
  ).rejects.toMatchObject({
    stderr: expect.stringContaining(
      "sitemap-0.xml에 비공개 글이 포함되었습니다: series/draft-note",
    ),
  });
});
