export function chooseHeroImagePath(
  slideshowPaths: readonly string[],
  fallbackPath: string | null,
  random: () => number = Math.random,
): string | null {
  if (slideshowPaths.length === 0) return fallbackPath;
  const index = Math.min(
    Math.floor(random() * slideshowPaths.length),
    slideshowPaths.length - 1,
  );
  return slideshowPaths[index] ?? fallbackPath;
}
