import { useEffect } from "react";

/** Reveals a URL fragment after a React page has rendered its target element. */
export function useHashTarget() {
  useEffect(() => {
    let frame = 0;

    const revealTarget = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const fragment = window.location.hash.slice(1);
        if (!fragment) return;
        const target = document.getElementById(decodeURIComponent(fragment));
        target?.scrollIntoView({ block: "start" });
      });
    };

    revealTarget();
    window.addEventListener("hashchange", revealTarget);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("hashchange", revealTarget);
    };
  }, []);
}
