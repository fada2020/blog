export const HERO_IMAGE_WIDTH = 1200;
export const HERO_IMAGE_HEIGHT = 630;

interface ImageDimensions {
  width: number;
  height: number;
}

interface PostHeroImage {
  draft: boolean;
  heroImage: ImageDimensions;
}

export function hasValidPublicHeroImage(post: PostHeroImage): boolean {
  if (post.draft) {
    return true;
  }

  return (
    post.heroImage.width === HERO_IMAGE_WIDTH &&
    post.heroImage.height === HERO_IMAGE_HEIGHT
  );
}
