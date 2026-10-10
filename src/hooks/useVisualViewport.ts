"use client";

import { useEffect, useState } from "react";

export type VisualViewportBox = {
  top: number;
  left: number;
  width: number;
  height: number;
};

/**
 * Tracks the on-screen visual viewport (critical on iOS Safari, where the
 * address/tool bars shrink the usable area and offset fixed layers).
 */
export function useVisualViewport(enabled: boolean): VisualViewportBox {
  const [box, setBox] = useState<VisualViewportBox>(() => ({
    top: 0,
    left: 0,
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  }));

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const sync = () => {
      const vv = window.visualViewport;
      if (vv) {
        setBox({
          top: vv.offsetTop,
          left: vv.offsetLeft,
          width: Math.max(1, vv.width),
          height: Math.max(1, vv.height),
        });
        return;
      }
      setBox({
        top: 0,
        left: 0,
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    sync();
    const vv = window.visualViewport;
    vv?.addEventListener("resize", sync);
    vv?.addEventListener("scroll", sync);
    window.addEventListener("resize", sync);
    window.addEventListener("orientationchange", sync);
    return () => {
      vv?.removeEventListener("resize", sync);
      vv?.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
      window.removeEventListener("orientationchange", sync);
    };
  }, [enabled]);

  return box;
}
