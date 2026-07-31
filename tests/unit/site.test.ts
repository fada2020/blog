import { describe, expect, it } from "vitest";
import { withBase } from "../../src/lib/site";

describe("withBase", () => {
  it.each([
    ["/", "/blog/"],
    ["/posts/hello/", "/blog/posts/hello/"],
    ["posts/hello", "/blog/posts/hello"],
  ])("%s를 %s로 변환한다", (input, expected) => {
    expect(withBase(input)).toBe(expected);
  });

  it("외부 URL은 변경하지 않는다", () => {
    expect(withBase("https://docs.astro.build")).toBe("https://docs.astro.build");
  });
});
