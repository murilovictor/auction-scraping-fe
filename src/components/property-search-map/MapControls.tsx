"use client";

import { memo } from "react";

export type MapControlsProps = {
  showSearchArea: boolean;
  areaLoading: boolean;
  onSearchThisArea: () => void;
  /** MVP: busca só por botão, não ao mover o mapa */
  mapSearchHint?: boolean;
};

function MapControlsInner({
  showSearchArea,
  areaLoading,
  onSearchThisArea,
  mapSearchHint = true,
}: MapControlsProps) {
  return (
    <div className="pointer-events-none absolute inset-0 z-[5] flex flex-col justify-between p-3">
      {mapSearchHint ? (
        <div className="pointer-events-auto max-w-sm rounded-lg border border-slate-200/80 bg-white/90 px-3 py-2 text-[11px] text-slate-600 shadow-sm backdrop-blur">
          A busca por área <strong>não</strong> roda automaticamente ao mover o mapa. Use{" "}
          <strong>Buscar nesta área</strong> quando estiver pronto.
        </div>
      ) : (
        <div />
      )}
      <div className="pointer-events-none flex justify-center pb-2">
        {showSearchArea ? (
          <button
            type="button"
            disabled={areaLoading}
            onClick={onSearchThisArea}
            className="pointer-events-auto rounded-full bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-sky-700 disabled:opacity-70"
          >
            {areaLoading ? "Buscando…" : "Buscar nesta área"}
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default memo(MapControlsInner);
