import { describe, expect, it } from "vitest";

import {
  HERO_IMAGE_HEIGHT,
  HERO_IMAGE_WIDTH,
  hasValidPublicHeroImage,
} from "../../src/lib/hero-image";

describe("공개 글 대표 이미지 규격", () => {
  it("1200x630 이미지 메타데이터를 허용한다", () => {
    expect(
      hasValidPublicHeroImage({
        draft: false,
        heroImage: {
          width: HERO_IMAGE_WIDTH,
          height: HERO_IMAGE_HEIGHT,
        },
      }),
    ).toBe(true);
  });

  it("공개 글의 1199x630 이미지 메타데이터 fixture를 거부한다", () => {
    const invalidPublicPostFixture = {
      draft: false,
      heroImage: { width: 1199, height: 630 },
    };

    expect(hasValidPublicHeroImage(invalidPublicPostFixture)).toBe(false);
  });

  it("초안에는 대표 이미지 규격을 강제하지 않는다", () => {
    const draftPostFixture = {
      draft: true,
      heroImage: { width: 1199, height: 630 },
    };

    expect(hasValidPublicHeroImage(draftPostFixture)).toBe(true);
  });
});
