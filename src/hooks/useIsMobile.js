import { useState, useEffect } from 'react';

/**
 * Tracks whether the viewport is at or below a mobile breakpoint.
 * Kept in sync with the CSS mobile breakpoint (768px) so the windowed
 * keyboard layout and the CSS key sizing switch over together.
 *
 * @param {number} maxWidth - breakpoint in px (default 768)
 * @returns {boolean} true when viewport width <= maxWidth
 */
export default function useIsMobile(maxWidth = 768) {
  const query = `(max-width: ${maxWidth}px)`;
  const getMatch = () =>
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia(query).matches
      : false;

  const [isMobile, setIsMobile] = useState(getMatch);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia(query);
    // Update via the change subscription only; the initial value is captured by
    // the useState initializer above, so no synchronous setState in the effect.
    const onChange = (e) => setIsMobile(e.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return isMobile;
}
