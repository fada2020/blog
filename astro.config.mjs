import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://fada2020.github.io",
  base: "/blog",
  integrations: [mdx(), sitemap()],
});
