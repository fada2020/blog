export const POSTS_PER_PAGE = 10;

export interface PageSlice<T> {
  currentPage: number;
  items: T[];
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export function getTotalPages(totalItems: number, pageSize = POSTS_PER_PAGE): number {
  if (pageSize < 1) {
    throw new Error("페이지 크기는 1 이상이어야 합니다.");
  }

  return Math.max(1, Math.ceil(totalItems / pageSize));
}

export function getAdditionalPageNumbers(totalItems: number, pageSize = POSTS_PER_PAGE): number[] {
  const totalPages = getTotalPages(totalItems, pageSize);

  return Array.from({ length: Math.max(0, totalPages - 1) }, (_, index) => index + 2);
}

export function paginateItems<T>(
  items: T[],
  currentPage: number,
  pageSize = POSTS_PER_PAGE,
): PageSlice<T> {
  const totalPages = getTotalPages(items.length, pageSize);

  if (!Number.isInteger(currentPage) || currentPage < 1 || currentPage > totalPages) {
    throw new Error(`유효하지 않은 페이지입니다: ${currentPage}`);
  }

  const start = (currentPage - 1) * pageSize;

  return {
    currentPage,
    items: items.slice(start, start + pageSize),
    pageSize,
    totalItems: items.length,
    totalPages,
  };
}
