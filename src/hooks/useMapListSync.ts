"use client";

import { useCallback, useRef, useState } from "react";

/**
 * Sincroniza hover/clique entre lista e mapa (scroll até o card).
 */
export function useMapListSync() {
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());

  const registerCardRef = useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) cardRefs.current.set(id, el);
    else cardRefs.current.delete(id);
  }, []);

  const scrollCardIntoView = useCallback((id: string) => {
    const el = cardRefs.current.get(id);
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, []);

  const selectFromMap = useCallback(
    (id: string) => {
      setSelectedId(id);
      requestAnimationFrame(() => scrollCardIntoView(id));
    },
    [scrollCardIntoView],
  );

  return {
    highlightedId,
    setHighlightedId,
    selectedId,
    setSelectedId,
    registerCardRef,
    scrollCardIntoView,
    selectFromMap,
  };
}
