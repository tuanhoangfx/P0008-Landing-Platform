import { useCallback } from "react";

export function useScrollTo(targetId: string) {
  return useCallback(() => {
    const el = document.querySelector(targetId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [targetId]);
}

export function useScrollToOrder(scrollTarget?: string) {
  return useScrollTo(scrollTarget ?? "#order-form");
}
