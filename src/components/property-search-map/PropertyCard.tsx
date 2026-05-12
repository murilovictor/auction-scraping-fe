"use client";

import Image from "next/image";
import { memo } from "react";
import { TbBed, TbCar, TbRuler2 } from "react-icons/tb";
import { shouldBypassNextImageOptimization } from "@/lib/shouldBypassNextImageOptimization";
import type { PropertyMapSearchItem } from "@/types/property-map-search";
import {
  fmtAreaM2,
  fmtMoney,
  getAddressParts,
  getAuctionRowsDisplay,
  hasPropertySpecs,
} from "./propertyListingShared";

const stopCardClick = (e: { stopPropagation: () => void }) => {
  e.stopPropagation();
};

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

  const {
    primeiroValor,
    segundoValor,
    descPrimeiro,
    descSegundo,
    dataPrimeiroFmt,
    dataSegundoFmt,
  } = getAuctionRowsDisplay(p);

  const { street, localityForMaps, localityDisplay } = getAddressParts(p);
  const hasSpecs = hasPropertySpecs(p);

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
        {street ? (
          <a
            href={`https://www.google.com/search?q=${encodeURIComponent(street)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-0.5 block min-w-0 max-w-full truncate text-left text-xs text-slate-500 underline decoration-slate-300 underline-offset-2 hover:text-slate-700"
            title={street}
            onClick={stopCardClick}
            onKeyDown={stopCardClick}
          >
            {street}
          </a>
        ) : null}
        {localityForMaps ? (
          <div className="mt-1.5 flex min-w-0 items-center gap-1">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(localityForMaps)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="min-w-0 flex-1 truncate text-left text-xs text-slate-500 underline decoration-slate-300 underline-offset-2 hover:text-slate-700"
              title={localityDisplay}
              onClick={stopCardClick}
              onKeyDown={stopCardClick}
            >
              {localityDisplay}
            </a>
          </div>
        ) : null}
        {hasSpecs ? (
          <div
            className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] tabular-nums text-slate-600"
            aria-label="Características do imóvel"
          >
            {p.privateArea != null && p.privateArea > 0 ? (
              <span className="inline-flex items-center gap-1" title="Área privativa">
                <TbRuler2 className="h-3.5 w-3.5 shrink-0 text-slate-400" strokeWidth={1.5} aria-hidden />
                {fmtAreaM2(p.privateArea)}
              </span>
            ) : null}
            {p.rooms != null && p.rooms > 0 ? (
              <span className="inline-flex items-center gap-1" title="Quartos">
                <TbBed className="h-3.5 w-3.5 shrink-0 text-slate-400" strokeWidth={1.5} aria-hidden />
                {p.rooms} {p.rooms === 1 ? "quarto" : "quartos"}
              </span>
            ) : null}
            {p.garageSpaces != null && p.garageSpaces > 0 ? (
              <span className="inline-flex items-center gap-1" title="Vagas">
                <TbCar className="h-3.5 w-3.5 shrink-0 text-slate-400" strokeWidth={1.5} aria-hidden />
                {p.garageSpaces} {p.garageSpaces === 1 ? "vaga" : "vagas"}
              </span>
            ) : null}
          </div>
        ) : null}
        <p className="mt-1 text-[11px] text-slate-500">
          Avaliação:{" "}
          <span className="font-medium text-slate-700">{fmtMoney(p.valorAvaliacao)}</span>
        </p>
        <div className="mt-1.5 space-y-1 text-[11px] leading-snug">
          {primeiroValor != null ? (
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="font-semibold text-slate-600">1º leilão</span>
              <span className="text-sm font-bold text-sky-600">{fmtMoney(primeiroValor)}</span>
              {dataPrimeiroFmt ? (
                <span className="text-slate-500">· {dataPrimeiroFmt}</span>
              ) : null}
              {descPrimeiro != null && descPrimeiro > 0 ? (
                <span className="font-medium text-emerald-700">−{descPrimeiro.toFixed(0)}%</span>
              ) : null}
            </div>
          ) : null}
          {segundoValor != null ? (
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="font-semibold text-slate-600">2º leilão</span>
              <span className="text-sm font-bold text-sky-700">{fmtMoney(segundoValor)}</span>
              {dataSegundoFmt ? (
                <span className="text-slate-500">· {dataSegundoFmt}</span>
              ) : null}
              {descSegundo != null && descSegundo > 0 ? (
                <span className="font-medium text-emerald-700">−{descSegundo.toFixed(0)}%</span>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export default memo(PropertyCardInner);
