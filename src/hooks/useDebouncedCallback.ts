"use client";

import { useCallback, useEffect, useRef } from "react";

/** Debounce invocação de callback (ex.: idle do mapa). */
export function useDebouncedCallback<A extends unknown[]>(
  callback: (...args: A) => void,
  delayMs: number,
): (...args: A) => void {
  const cb = useRef(callback);
  const t = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    cb.current = callback;
  }, [callback]);

  return useCallback(
    (...args: A) => {
      if (t.current) clearTimeout(t.current);
      t.current = setTimeout(() => {
        t.current = null;
        cb.current(...args);
      }, delayMs);
    },
    [delayMs],
  );
}
