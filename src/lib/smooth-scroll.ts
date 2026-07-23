/**
 * Smoothly scroll to an element by id, accounting for the fixed navbar height.
 * Uses a custom requestAnimationFrame animation so the duration can be tuned.
 * Falls back to the default anchor jump if the element is not found.
 */
export function scrollToElement(
  elementId: string,
  offset = 100,
  duration = 1500,
) {
  const element = document.getElementById(elementId.replace(/^#/, ""));
  if (!element) {
    window.location.hash = elementId;
    return;
  }

  const startY = window.scrollY;
  const targetY = Math.max(
    0,
    element.getBoundingClientRect().top + window.scrollY - offset,
  );
  const distance = targetY - startY;
  const startTime = performance.now();

  if (distance === 0) return;

  // easeOutCubic: starts fast at the beginning, decelerates smoothly at the end.
  // Feels responsive and not laggy, while still being a polished scroll.
  const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

  const step = (now: number) => {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeOutCubic(progress);

    window.scrollTo(0, startY + distance * eased);

    if (progress < 1) {
      requestAnimationFrame(step);
    }
  };

  requestAnimationFrame(step);
}

/**
 * Handle anchor click with smooth scroll and navbar offset.
 * Use this for any onClick that would otherwise use a simple href="#anchor".
 */
export function handleAnchorClick(
  e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>,
  href: string,
  offset = 100,
) {
  if (!href.startsWith("#")) return;
  e.preventDefault();
  scrollToElement(href, offset);
}
