import { describe, expect, it } from "vitest";
import {
  getAdditionalPageNumbers,
  getTotalPages,
  paginateItems,
} from "../../src/lib/pagination";

describe("페이지네이션", () => {
  it("전체 글 수와 페이지 크기로 페이지 수를 계산한다", () => {
    expect(getTotalPages(0, 10)).toBe(1);
    expect(getTotalPages(10, 10)).toBe(1);
    expect(getTotalPages(11, 10)).toBe(2);
  });

  it("첫 페이지 이후 정적 경로에 필요한 페이지 번호를 반환한다", () => {
    expect(getAdditionalPageNumbers(9, 10)).toEqual([]);
    expect(getAdditionalPageNumbers(21, 10)).toEqual([2, 3]);
  });

  it("요청한 페이지의 항목만 잘라낸다", () => {
    const page = paginateItems([1, 2, 3, 4, 5], 2, 2);

    expect(page).toEqual({
      currentPage: 2,
      items: [3, 4],
      pageSize: 2,
      totalItems: 5,
      totalPages: 3,
    });
  });

  it("범위를 벗어난 페이지를 거부한다", () => {
    expect(() => paginateItems([1, 2], 0, 10)).toThrow("유효하지 않은 페이지입니다: 0");
    expect(() => paginateItems([1, 2], 2, 10)).toThrow("유효하지 않은 페이지입니다: 2");
  });
});
