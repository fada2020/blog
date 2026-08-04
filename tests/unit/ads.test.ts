import { describe, expect, it } from "vitest";
import { getAdConfig, getGoogleAdsenseClient } from "../../src/lib/ads";

describe("getGoogleAdsenseClient", () => {
  it("환경 변수가 없으면 기본 AdSense client를 사용한다", () => {
    expect(getGoogleAdsenseClient({})).toBe("ca-pub-3268409402826303");
  });

  it("환경 변수로 AdSense client를 바꾸거나 끌 수 있다", () => {
    expect(
      getGoogleAdsenseClient({
        PUBLIC_GOOGLE_ADSENSE_CLIENT: "ca-pub-123",
      }),
    ).toBe("ca-pub-123");

    expect(
      getGoogleAdsenseClient({
        PUBLIC_GOOGLE_ADSENSE_CLIENT: "off",
      }),
    ).toBeNull();
  });
});

describe("getAdConfig", () => {
  it("환경 변수가 없으면 기본 Kakao 광고 단위를 사용한다", () => {
    expect(getAdConfig({}, "home")).toEqual({
      provider: "kakao",
      unit: "DAN-DEyO01RLXs86EFR1",
      width: 728,
      height: 90,
    });

    expect(getAdConfig({}, "article")).toEqual({
      provider: "kakao",
      unit: "DAN-DEyO01RLXs86EFR1",
      width: 728,
      height: 90,
    });
  });

  it("광고 제공자가 꺼져 있으면 슬롯을 만들지 않는다", () => {
    expect(
      getAdConfig(
        {
          PUBLIC_ARTICLE_AD_PROVIDER: "off",
          PUBLIC_GOOGLE_ADSENSE_CLIENT: "ca-pub-123",
          PUBLIC_GOOGLE_ADSENSE_ARTICLE_SLOT: "456",
        },
        "article",
      ),
    ).toBeNull();
  });

  it("글 상세의 Google 광고 설정을 반환한다", () => {
    expect(
      getAdConfig(
        {
          PUBLIC_ARTICLE_AD_PROVIDER: "google",
          PUBLIC_GOOGLE_ADSENSE_ARTICLE_SLOT: "456",
        },
        "article",
      ),
    ).toEqual({
      provider: "google",
      client: "ca-pub-3268409402826303",
      slot: "456",
    });
  });

  it("홈의 Kakao 광고 설정을 반환한다", () => {
    expect(
      getAdConfig(
        {
          PUBLIC_HOME_AD_PROVIDER: "kakao",
          PUBLIC_KAKAO_ADFIT_HOME_UNIT: "DAN-abc123",
        },
        "home",
      ),
    ).toEqual({
      provider: "kakao",
      unit: "DAN-abc123",
      width: 728,
      height: 90,
    });
  });

  it("Google 슬롯 ID가 없거나 client가 꺼져 있으면 슬롯을 만들지 않는다", () => {
    expect(
      getAdConfig(
        {
          PUBLIC_ARTICLE_AD_PROVIDER: "google",
          PUBLIC_GOOGLE_ADSENSE_CLIENT: "ca-pub-123",
        },
        "article",
      ),
    ).toBeNull();

    expect(
      getAdConfig(
        {
          PUBLIC_ARTICLE_AD_PROVIDER: "google",
          PUBLIC_GOOGLE_ADSENSE_CLIENT: "off",
          PUBLIC_GOOGLE_ADSENSE_ARTICLE_SLOT: "456",
        },
        "article",
      ),
    ).toBeNull();
  });
});
