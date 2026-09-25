export function clampScrollTarget(sectionTop: number, offset: number, maxScroll: number) {
  return Math.max(0, Math.min(Math.max(0, maxScroll), sectionTop - offset));
}

export function resolveActiveSection({ tops, scrollY, offset, viewportHeight, pageHeight, currentIndex }: {
  tops: number[];
  scrollY: number;
  offset: number;
  viewportHeight: number;
  pageHeight: number;
  currentIndex: number;
}) {
  const maxScroll = Math.max(0, pageHeight - viewportHeight);
  if (!tops.length || maxScroll === 0) return 0;
  if (scrollY >= maxScroll - 2) return tops.length - 1;
  const marker = scrollY + offset;
  let candidate = 0;
  tops.forEach((top, index) => { if (top <= marker) candidate = index; });
  // Keep touchpad subpixel oscillations from flipping the selected tab.
  if (candidate > currentIndex && marker < tops[candidate] + 8) return currentIndex;
  if (candidate < currentIndex && marker > tops[currentIndex] - 8) return currentIndex;
  return candidate;
}

export function resolveDragIndex(position: number, segmentWidth: number, count: number) {
  if (segmentWidth <= 0 || count <= 0) return 0;
  return Math.max(0, Math.min(count - 1, Math.round(position / segmentWidth)));
}
