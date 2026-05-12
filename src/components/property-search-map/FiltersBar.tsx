"use client";

import { memo } from "react";
import type { MapFilterSelectOptions } from "@/types/property-filters-config";
import type { QuickFiltersState } from "@/types/property-map-search";

const selectCls =
  "min-w-0 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-800 shadow-sm outline-none transition hover:border-slate-300 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 disabled:cursor-not-allowed disabled:opacity-60";

export type FiltersBarProps = {
  value: QuickFiltersState;
  onChange: (next: QuickFiltersState) => void;
  filterSelects: MapFilterSelectOptions;
  filtersLoading?: boolean;
};

function FiltersBarInner({
  value,
  onChange,
  filterSelects,
  filtersLoading = false,
}: FiltersBarProps) {
  const patch = (partial: Partial<QuickFiltersState>) =>
    onChange({ ...value, ...partial });

  const sale = filterSelects.saleTypeFilter;

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
        disabled={filtersLoading}
        onChange={(e) => patch({ tipo: e.target.value })}
        aria-label="Tipo de imóvel"
      >
        <option value="">Tipo</option>
        {filterSelects.propertyTypes.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
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
        <option value="40">≥ 40%</option>
        <option value="50">≥ 50%</option>
        <option value="60">≥ 60%</option>
        <option value="70">≥ 70%</option>
        <option value="80">≥ 80%</option>
        <option value="90">≥ 90%</option>
      </select>
      {filterSelects.modalities.length > 0 ? (
        <select
          className={`${selectCls} min-w-[8.5rem]`}
          value={value.modalidade}
          disabled={filtersLoading}
          onChange={(e) => patch({ modalidade: e.target.value })}
          aria-label="Modalidade"
        >
          <option value="">Modalidade</option>
          {filterSelects.modalities.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : null}
      <select
        className={`${selectCls} min-w-[9.5rem]`}
        value={value.formaPagamento}
        disabled={filtersLoading}
        onChange={(e) => patch({ formaPagamento: e.target.value })}
        aria-label="Forma de pagamento"
      >
        <option value="">Pagamento</option>
        {filterSelects.paymentConditions.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {sale ? (
        <select
          className={`${selectCls} min-w-[9.5rem]`}
          value={value.tipoLeilao}
          disabled={filtersLoading}
          onChange={(e) => patch({ tipoLeilao: e.target.value })}
          aria-label={sale.label}
        >
          <option value="">{sale.label}</option>
          {sale.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : null}
    </div>
  );
}

export default memo(FiltersBarInner);
