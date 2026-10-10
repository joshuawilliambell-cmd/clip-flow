"use client";

import { useEffect, useState } from "react";

/**
 * True below the Tailwind `md` breakpoint (768px).
 * `null` until mounted so SSR/first paint does not flash the wrong layout.
 */
export function useIsMobile(breakpointPx = 768): boolean | null {
  const [mobile, setMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpointPx - 1}px)`);
    const sync = () => setMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [breakpointPx]);

  return mobile;
}

/** True when the device is held sideways (landscape). */
export function useIsLandscape(): boolean | null {
  const [landscape, setLandscape] = useState<boolean | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(orientation: landscape)");
    const sync = () => setLandscape(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return landscape;
}
