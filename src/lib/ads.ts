export type AdPlacement = "home" | "article";
type AdProvider = "google" | "kakao";

export type AdConfig =
  | {
      provider: "google";
      client: string;
      slot: string;
    }
  | {
      provider: "kakao";
      unit: string;
      width: number;
      height: number;
    };

export type AdEnvironment = Record<string, string | undefined>;

const DEFAULT_GOOGLE_ADSENSE_CLIENT = "ca-pub-3268409402826303";
const DEFAULT_KAKAO_UNIT = "DAN-DEyO01RLXs86EFR1";
const DEFAULT_KAKAO_WIDTH = 728;
const DEFAULT_KAKAO_HEIGHT = 90;

export function getAdConfig(
  env: AdEnvironment,
  placement: AdPlacement,
): AdConfig | null {
  const provider = getPlacementProvider(env, placement);

  if (provider === "google") {
    const client = getGoogleAdsenseClient(env);
    const slot =
      placement === "home"
        ? env.PUBLIC_GOOGLE_ADSENSE_HOME_SLOT
        : env.PUBLIC_GOOGLE_ADSENSE_ARTICLE_SLOT;

    if (!client || !slot) return null;

    return {
      provider,
      client,
      slot,
    };
  }

  if (provider === "kakao") {
    const unit =
      placement === "home"
        ? env.PUBLIC_KAKAO_ADFIT_HOME_UNIT
        : env.PUBLIC_KAKAO_ADFIT_ARTICLE_UNIT;

    return {
      provider,
      unit: unit || DEFAULT_KAKAO_UNIT,
      width: readPositiveInt(
        placement === "home"
          ? env.PUBLIC_KAKAO_ADFIT_HOME_WIDTH
          : env.PUBLIC_KAKAO_ADFIT_ARTICLE_WIDTH,
        DEFAULT_KAKAO_WIDTH,
      ),
      height: readPositiveInt(
        placement === "home"
          ? env.PUBLIC_KAKAO_ADFIT_HOME_HEIGHT
          : env.PUBLIC_KAKAO_ADFIT_ARTICLE_HEIGHT,
        DEFAULT_KAKAO_HEIGHT,
      ),
    };
  }

  return null;
}

export function getGoogleAdsenseClient(env: AdEnvironment): string | null {
  const client = env.PUBLIC_GOOGLE_ADSENSE_CLIENT;

  if (client === "off") return null;

  return client || DEFAULT_GOOGLE_ADSENSE_CLIENT;
}

function getPlacementProvider(
  env: AdEnvironment,
  placement: AdPlacement,
): AdProvider | null {
  const value =
    placement === "home"
      ? env.PUBLIC_HOME_AD_PROVIDER
      : env.PUBLIC_ARTICLE_AD_PROVIDER;

  if (value === "google" || value === "kakao") return value;
  if (!value) return "kakao";

  return null;
}

function readPositiveInt(value: string | undefined, fallback: number): number {
  if (!value) return fallback;

  const parsed = Number.parseInt(value, 10);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
