"use client";

import { memo } from "react";
import type { PropertyMapSearchItem } from "@/types/property-map-search";
import PropertyCard from "./PropertyCard";

function SkeletonCard() {
  return (
    <div className="flex animate-pulse gap-3 rounded-xl border border-slate-100 bg-white p-3">
      <div className="h-28 w-28 shrink-0 rounded-lg bg-slate-200" />
      <div className="flex-1 space-y-2 py-1">
        <div className="h-3 w-1/3 rounded bg-slate-200" />
        <div className="h-4 w-full rounded bg-slate-200" />
        <div className="h-3 w-2/3 rounded bg-slate-200" />
        <div className="h-5 w-1/2 rounded bg-slate-200" />
      </div>
    </div>
  );
}

export type PropertyListProps = {
  properties: PropertyMapSearchItem[];
  loading: boolean;
  highlightedId: string | null;
  selectedId: string | null;
  registerCardRef: (id: string, el: HTMLDivElement | null) => void;
  onHoverCard: (id: string | null) => void;
  onSelectCard: (id: string) => void;
  onToggleFavorite?: (propertyId: string, currentlyFavorite: boolean) => void;
  emptyMessage?: string;
};

function PropertyListInner({
  properties,
  loading,
  highlightedId,
  selectedId,
  registerCardRef,
  onHoverCard,
  onSelectCard,
  onToggleFavorite,
  emptyMessage = "Nenhum imóvel encontrado com os filtros atuais.",
}: PropertyListProps) {
  if (loading) {
    return (
      <div className="space-y-3 p-1">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (!properties.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-16 text-center">
        <p className="text-sm font-medium text-slate-600">{emptyMessage}</p>
        <p className="mt-2 max-w-xs text-xs text-slate-400">
          Ajuste os filtros rápidos ou amplie a busca no mapa.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-1">
      {properties.map((p) => (
        <div key={p.id} ref={(el) => registerCardRef(p.id, el)}>
          <PropertyCard
            property={p}
            isHighlighted={highlightedId === p.id}
            isSelected={selectedId === p.id}
            onHoverStart={() => onHoverCard(p.id)}
            onHoverEnd={() => onHoverCard(null)}
            onNavigate={onSelectCard}
            onToggleFavorite={onToggleFavorite}
          />
        </div>
      ))}
    </div>
  );
}

export default memo(PropertyListInner);
