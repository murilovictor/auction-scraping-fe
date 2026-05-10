"use client";

import { memo } from "react";
import type { QuickFiltersState } from "@/types/property-map-search";

const selectCls =
  "min-w-0 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-800 shadow-sm outline-none transition hover:border-slate-300 focus:border-sky-500 focus:ring-1 focus:ring-sky-500";

export type FiltersBarProps = {
  value: QuickFiltersState;
  onChange: (next: QuickFiltersState) => void;
};

function FiltersBarInner({ value, onChange }: FiltersBarProps) {
  const patch = (partial: Partial<QuickFiltersState>) =>
    onChange({ ...value, ...partial });

  return (
    <div className="flex w-full flex-wrap items-center gap-2">
      <span className="hidden text-[11px] font-semibold uppercase tracking-wide text-slate-400 sm:inline">
        Filtros
      </span>
      <input
        className={`${selectCls} w-24`}
        placeholder="Preço mín"
        inputMode="numeric"
        value={value.precoMin}
        onChange={(e) => patch({ precoMin: e.target.value })}
        aria-label="Preço mínimo"
      />
      <input
        className={`${selectCls} w-24`}
        placeholder="Preço máx"
        inputMode="numeric"
        value={value.precoMax}
        onChange={(e) => patch({ precoMax: e.target.value })}
        aria-label="Preço máximo"
      />
      <select
        className={selectCls}
        value={value.tipo}
        onChange={(e) => patch({ tipo: e.target.value })}
        aria-label="Tipo de imóvel"
      >
        <option value="">Tipo</option>
        <option value="Casa">Casa</option>
        <option value="Apartamento">Apartamento</option>
        <option value="Terreno">Terreno</option>
        <option value="Comercial">Comercial</option>
      </select>
      <select
        className={selectCls}
        value={value.descontoMin}
        onChange={(e) => patch({ descontoMin: e.target.value })}
        aria-label="Desconto mínimo"
      >
        <option value="">Desconto</option>
        <option value="10">≥ 10%</option>
        <option value="20">≥ 20%</option>
        <option value="30">≥ 30%</option>
      </select>
      <select
        className={selectCls}
        value={value.aceitaFinanciamento}
        onChange={(e) => patch({ aceitaFinanciamento: e.target.value })}
        aria-label="Financiamento"
      >
        <option value="">Financiamento</option>
        <option value="sim">Aceita</option>
        <option value="nao">Não aceita</option>
      </select>
    </div>
  );
}

export default memo(FiltersBarInner);
