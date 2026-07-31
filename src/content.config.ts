import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

export type Category =
  | "Backend"
  | "Frontend"
  | "Infrastructure"
  | "DevOps"
  | "Observability"
  | "Database"
  | "Tooling";

export type PostKind = "learning" | "trend" | "worklog" | "deep-dive";

const blog = defineCollection({
  loader: glob({ base: "./src/content/blog", pattern: "**/*.{md,mdx}" }),
  schema: ({ image }) => z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
    draft: z.boolean().default(true),
    category: z.enum([
      "Backend",
      "Frontend",
      "Infrastructure",
      "DevOps",
      "Observability",
      "Database",
      "Tooling",
    ]),
    tags: z.array(z.string().min(1)).min(1),
    kind: z.enum(["learning", "trend", "worklog", "deep-dive"]),
    heroImage: image(),
    heroImageAlt: z.string().min(10),
    imageCredit: z
      .object({
        label: z.string().min(1),
        url: z.url().optional(),
      })
      .optional(),
    series: z.string().optional(),
    lesson: z.number().int().positive().optional(),
  }),
});

export const collections = { blog };
