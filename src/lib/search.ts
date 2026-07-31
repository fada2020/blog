import type { Category } from "../content.config";

export interface SearchEntry {
  title: string;
  description: string;
  href: string;
  category: Category;
  tags: string[];
  publishedAt: string;
}

export function normalizeSearchText(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("ko-KR");
}

export function filterSearchEntries(
  entries: SearchEntry[],
  query: string,
): SearchEntry[] {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return [];

  return entries.filter((entry) => {
    const searchableText = normalizeSearchText(
      [
        entry.title,
        entry.description,
        entry.category,
        ...entry.tags,
      ].join(" "),
    );
    return searchableText.includes(normalizedQuery);
  });
}
