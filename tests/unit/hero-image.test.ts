import { describe, expect, it } from "vitest";

import { chooseHeroImagePath } from "@/lib/content/hero-image";

describe("chooseHeroImagePath", () => {
  const slideshowPaths = ["/images/a.jpg", "/images/b.jpg", "/images/c.jpg"];

  it("returns the fallback when the slideshow set is empty", () => {
    expect(chooseHeroImagePath([], "/images/fallback.jpg", () => 0.5)).toBe(
      "/images/fallback.jpg",
    );
  });

  it("returns null when the slideshow set is empty and there is no fallback", () => {
    expect(chooseHeroImagePath([], null, () => 0.5)).toBeNull();
  });

  it("picks the image indexed by the random value", () => {
    expect(chooseHeroImagePath(slideshowPaths, null, () => 0)).toBe("/images/a.jpg");
    expect(chooseHeroImagePath(slideshowPaths, null, () => 0.5)).toBe("/images/b.jpg");
    expect(chooseHeroImagePath(slideshowPaths, null, () => 0.99)).toBe("/images/c.jpg");
  });

  it("never returns undefined even for a random value of exactly 1", () => {
    expect(chooseHeroImagePath(slideshowPaths, null, () => 1)).toBe("/images/c.jpg");
  });
});
