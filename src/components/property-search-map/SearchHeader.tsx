"use client";

import Link from "next/link";
import { memo } from "react";
import type { MapFilterSelectOptions } from "@/types/property-filters-config";
import type { QuickFiltersState, ViewMode } from "@/types/property-map-search";
import FiltersBar from "./FiltersBar";

export type SearchHeaderProps = {
  searchText: string;
  onSearchTextChange: (v: string) => void;
  onSearchSubmit: () => void;
  quickFilters: QuickFiltersState;
  onQuickFiltersChange: (q: QuickFiltersState) => void;
  mapFilterSelects: MapFilterSelectOptions;
  filtersLoading?: boolean;
  viewMode: ViewMode;
  onViewModeChange: (m: ViewMode) => void;
};

function SearchHeaderInner({
  searchText,
  onSearchTextChange,
  onSearchSubmit,
  quickFilters,
  onQuickFiltersChange,
  mapFilterSelects,
  filtersLoading,
  viewMode,
  onViewModeChange,
}: SearchHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex max-w-[1920px] flex-col gap-3 px-3 py-3 sm:px-4 lg:px-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <input
                value={searchText}
                onChange={(e) => onSearchTextChange(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onSearchSubmit()}
                placeholder="Buscar por endereço do imóvel…"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-4 pr-10 text-sm outline-none transition focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100"
                aria-label="Buscar imóveis"
              />
              <button
                type="button"
                onClick={onSearchSubmit}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-sky-50 hover:text-sky-600"
                title="Buscar"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
            <div
              className="flex shrink-0 rounded-xl border border-slate-200 bg-slate-50 p-0.5"
              role="group"
              aria-label="Modo de visualização"
            >
              <button
                type="button"
                onClick={() => onViewModeChange("list")}
                className={`rounded-lg px-3 py-2 text-xs font-semibold transition sm:text-sm ${
                  viewMode === "list"
                    ? "bg-white text-sky-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Lista
              </button>
              <button
                type="button"
                onClick={() => onViewModeChange("map")}
                className={`rounded-lg px-3 py-2 text-xs font-semibold transition sm:text-sm ${
                  viewMode === "map"
                    ? "bg-white text-sky-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Mapa
              </button>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <FiltersBar
            value={quickFilters}
            onChange={onQuickFiltersChange}
            filterSelects={mapFilterSelects}
            filtersLoading={filtersLoading}
          />
        </div>
      </div>
    </header>
  );
}

export default memo(SearchHeaderInner);
