export const SITE_URL = "https://fada2020.github.io";
export const BASE_PATH = "/blog";

export function withBase(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (normalized === "/") return `${BASE_PATH}/`;
  return `${BASE_PATH}${normalized}`;
}
