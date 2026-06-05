import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const ROUTES = ["/", "/calendar", "/libretto"] as const;

const SWIPE_THRESHOLD = 60;
const HORIZONTAL_RATIO = 1.5;

export const useSwipeNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(max-width: 767px)");
    if (!mql.matches) return;

    let startX = 0;
    let startY = 0;
    let active = false;

    const isBlocked = (el: EventTarget | null) => {
      if (!(el instanceof Element)) return false;
      if (el.closest("[data-no-swipe]")) return true;
      if (el.closest("input, textarea, select, [contenteditable='true']")) return true;
      return false;
    };

    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) {
        active = false;
        return;
      }
      if (isBlocked(e.target)) {
        active = false;
        return;
      }
      const t = e.touches[0];
      startX = t.clientX;
      startY = t.clientY;
      active = true;
    };

    const onEnd = (e: TouchEvent) => {
      if (!active) return;
      active = false;
      const t = e.changedTouches[0];
      if (!t) return;
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      if (Math.abs(dx) < SWIPE_THRESHOLD) return;
      if (Math.abs(dx) < Math.abs(dy) * HORIZONTAL_RATIO) return;

      const idx = ROUTES.indexOf(location.pathname as (typeof ROUTES)[number]);
      if (idx === -1) return;

      if (dx < 0 && idx < ROUTES.length - 1) {
        navigate(ROUTES[idx + 1]);
      } else if (dx > 0 && idx > 0) {
        navigate(ROUTES[idx - 1]);
      }
    };

    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchend", onEnd);
    };
  }, [location.pathname, navigate]);
};
