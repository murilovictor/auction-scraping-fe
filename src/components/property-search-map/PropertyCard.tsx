"use client";

import Image from "next/image";
import { memo } from "react";
import { shouldBypassNextImageOptimization } from "@/lib/shouldBypassNextImageOptimization";
import type { PropertyMapSearchItem } from "@/types/property-map-search";

const fmtMoney = (n: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(n);

export type PropertyCardProps = {
  property: PropertyMapSearchItem;
  isHighlighted: boolean;
  isSelected: boolean;
  onHoverStart: () => void;
  onHoverEnd: () => void;
  onNavigate?: (id: string) => void;
  onToggleFavorite?: (propertyId: string, currentlyFavorite: boolean) => void;
};

function PropertyCardInner({
  property: p,
  isHighlighted,
  isSelected,
  onHoverStart,
  onHoverEnd,
  onNavigate,
  onToggleFavorite,
}: PropertyCardProps) {
  const isFavorite = !!p.isFavorite;
  return (
    <article
      role="button"
      tabIndex={0}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onNavigate?.(p.id);
        }
      }}
      onClick={() => onNavigate?.(p.id)}
      className={[
        "group relative flex cursor-pointer gap-3 rounded-xl border bg-white p-3 text-left shadow-sm transition-all duration-200",
        isSelected
          ? "border-sky-500 ring-2 ring-sky-200"
          : isHighlighted
            ? "border-sky-300 shadow-md"
            : "border-slate-200 hover:border-slate-300 hover:shadow-md",
      ].join(" ")}
    >
      {onToggleFavorite ? (
        <button
          type="button"
          aria-label={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          title={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          aria-pressed={isFavorite}
          className="absolute right-2 top-2 z-[2] rounded-md bg-white/95 p-1.5 shadow-sm ring-1 ring-slate-200/80 transition-colors hover:bg-white"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(p.id, isFavorite);
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill={isFavorite ? "currentColor" : "none"}
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            aria-hidden
            className={`h-4 w-4 ${isFavorite ? "text-red-500" : "text-slate-400"}`}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
            />
          </svg>
        </button>
      ) : null}
      <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-lg bg-slate-100">
        <Image
          src={p.thumbnail}
          alt=""
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="112px"
          unoptimized={shouldBypassNextImageOptimization(p.thumbnail)}
        />
        {p.desconto != null && p.desconto > 0 ? (
          <span className="absolute left-1 top-1 rounded-md bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
            {p.desconto.toFixed(0)}%
          </span>
        ) : null}
      </div>
      <div className={`min-w-0 flex-1 ${onToggleFavorite ? "pr-9" : ""}`}>
        <div className="mb-1 flex flex-wrap gap-1">
          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-700">
            {p.tipo}
          </span>
          <span className="rounded bg-sky-50 px-1.5 py-0.5 text-[10px] font-medium text-sky-800">
            Leilão
          </span>
          {p.aceitaFinanciamento ? (
            <span className="rounded bg-violet-50 px-1.5 py-0.5 text-[10px] font-medium text-violet-800">
              Financiamento
            </span>
          ) : null}
          {p.desocupado ? (
            <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-900">
              Desocupado
            </span>
          ) : null}
          {p.oportunidade ? (
            <span className="rounded bg-orange-50 px-1.5 py-0.5 text-[10px] font-medium text-orange-800">
              Oportunidade
            </span>
          ) : null}
        </div>
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900">
          {p.titulo}
        </h3>
        <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{p.endereco}</p>
        <p className="mt-1 text-[11px] text-slate-500">
          Avaliação:{" "}
          <span className="font-medium text-slate-700">{fmtMoney(p.valorAvaliacao)}</span>
        </p>
        <div className="mt-1 flex flex-wrap items-baseline gap-2">
          <span className="text-base font-bold text-sky-600">{fmtMoney(p.preco)}</span>
          {p.desconto != null && p.desconto > 0 ? (
            <span className="text-xs font-medium text-emerald-700">-{p.desconto}%</span>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export default memo(PropertyCardInner);
