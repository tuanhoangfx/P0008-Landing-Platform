import { useEffect, useState } from "react";

/** Gentle urgency counter — ticks down slowly, never below min. */
export function useUrgencyCounter(initial: number, min = 12) {
  const [count, setCount] = useState(initial);

  useEffect(() => {
    const id = window.setInterval(() => {
      setCount((c) => (c > min ? c - 1 : c));
    }, 45000);
    return () => window.clearInterval(id);
  }, [min]);

  return count;
}
