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

const stopPreviewClick = (e: { stopPropagation: () => void }) => {
  e.stopPropagation();
};

export type PropertyMapPreviewProps = {
  property: PropertyMapSearchItem;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onClose: () => void;
  onViewDetails?: () => void;
};

function PropertyMapPreviewInner({
  property: p,
  isFavorite,
  onToggleFavorite,
  onClose,
  onViewDetails,
}: PropertyMapPreviewProps) {
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
    <div className="pointer-events-auto z-[6] w-full max-w-[23rem] rounded-xl border border-slate-200 bg-white p-2 shadow-xl transition-opacity duration-200">
      <div className="flex gap-2">
        <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-md bg-slate-100">
          <Image
            src={p.thumbnail}
            alt=""
            fill
            className="object-cover"
            sizes="96px"
            unoptimized={shouldBypassNextImageOptimization(p.thumbnail)}
          />
          {p.desconto != null && p.desconto > 0 ? (
            <span className="absolute left-0.5 top-0.5 rounded bg-emerald-600 px-1 py-px text-[9px] font-bold leading-none text-white">
              {p.desconto.toFixed(0)}%
            </span>
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="mb-0.5 flex flex-wrap gap-0.5">
                <span className="rounded bg-slate-100 px-1 py-px text-[9px] font-medium text-slate-700">
                  {p.tipo}
                </span>
                {p.aceitaFinanciamento ? (
                  <span className="rounded bg-violet-50 px-1 py-px text-[9px] font-medium text-violet-800">
                    Financ.
                  </span>
                ) : null}
                {p.desocupado ? (
                  <span className="rounded bg-amber-50 px-1 py-px text-[9px] font-medium text-amber-900">
                    Desoc.
                  </span>
                ) : null}
                {p.oportunidade ? (
                  <span className="rounded bg-orange-50 px-1 py-px text-[9px] font-medium text-orange-800">
                    Oport.
                  </span>
                ) : null}
              </div>
              <h4
                className="line-clamp-1 text-xs font-semibold leading-tight text-slate-900"
                title={p.titulo}
              >
                {p.titulo}
              </h4>
            </div>
            <div className="ml-1 flex shrink-0 items-center gap-2.5 pr-0.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite();
                }}
                className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-red-500"
                aria-label={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                title={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                aria-pressed={isFavorite}
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
              <button
                type="button"
                onClick={onClose}
                className="-mr-0.5 -mt-0.5 flex h-9 min-w-[2.25rem] shrink-0 items-center justify-center rounded-md text-2xl font-light leading-none text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                aria-label="Fechar"
              >
                ×
              </button>
            </div>
          </div>
          {street ? (
            <a
              href={`https://www.google.com/search?q=${encodeURIComponent(street)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-0.5 block min-w-0 max-w-full truncate text-left text-[10px] text-slate-500 underline decoration-slate-300 underline-offset-1 hover:text-slate-700"
              title={street}
              onClick={stopPreviewClick}
              onKeyDown={stopPreviewClick}
            >
              {street}
            </a>
          ) : null}
          {localityForMaps ? (
            <div className="mt-0.5 flex min-w-0 items-center gap-0.5">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(localityForMaps)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="min-w-0 flex-1 truncate text-left text-[10px] text-slate-500 underline decoration-slate-300 underline-offset-1 hover:text-slate-700"
                title={localityDisplay}
                onClick={stopPreviewClick}
                onKeyDown={stopPreviewClick}
              >
                {localityDisplay}
              </a>
            </div>
          ) : null}
          {hasSpecs ? (
            <div
              className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-px text-[10px] tabular-nums leading-tight text-slate-600"
              aria-label="Características do imóvel"
            >
              {p.privateArea != null && p.privateArea > 0 ? (
                <span className="inline-flex items-center gap-0.5" title="Área privativa">
                  <TbRuler2 className="h-3 w-3 shrink-0 text-slate-400" strokeWidth={1.5} aria-hidden />
                  {fmtAreaM2(p.privateArea)}
                </span>
              ) : null}
              {p.rooms != null && p.rooms > 0 ? (
                <span className="inline-flex items-center gap-0.5" title="Quartos">
                  <TbBed className="h-3 w-3 shrink-0 text-slate-400" strokeWidth={1.5} aria-hidden />
                  {p.rooms} q.
                </span>
              ) : null}
              {p.garageSpaces != null && p.garageSpaces > 0 ? (
                <span className="inline-flex items-center gap-0.5" title="Vagas">
                  <TbCar className="h-3 w-3 shrink-0 text-slate-400" strokeWidth={1.5} aria-hidden />
                  {p.garageSpaces} vag.
                </span>
              ) : null}
            </div>
          ) : null}
          <p className="mt-0.5 text-[10px] leading-tight text-slate-500">
            Aval.: <span className="font-medium text-slate-700">{fmtMoney(p.valorAvaliacao)}</span>
          </p>
          <div className="mt-0.5 space-y-px text-[10px] leading-tight">
            {primeiroValor != null ? (
              <div className="flex min-w-0 flex-wrap items-baseline gap-x-1.5 gap-y-px">
                <span className="shrink-0 font-semibold text-slate-600">1º</span>
                <span className="shrink-0 font-bold text-sky-600">{fmtMoney(primeiroValor)}</span>
                {dataPrimeiroFmt ? (
                  <span className="min-w-0 truncate text-slate-500" title={dataPrimeiroFmt}>
                    {dataPrimeiroFmt}
                  </span>
                ) : null}
                {descPrimeiro != null && descPrimeiro > 0 ? (
                  <span className="shrink-0 font-medium text-emerald-700">−{descPrimeiro.toFixed(0)}%</span>
                ) : null}
              </div>
            ) : null}
            {segundoValor != null ? (
              <div className="flex min-w-0 flex-wrap items-baseline gap-x-1.5 gap-y-px">
                <span className="shrink-0 font-semibold text-slate-600">2º</span>
                <span className="shrink-0 font-bold text-sky-700">{fmtMoney(segundoValor)}</span>
                {dataSegundoFmt ? (
                  <span className="min-w-0 truncate text-slate-500" title={dataSegundoFmt}>
                    {dataSegundoFmt}
                  </span>
                ) : null}
                {descSegundo != null && descSegundo > 0 ? (
                  <span className="shrink-0 font-medium text-emerald-700">−{descSegundo.toFixed(0)}%</span>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
      <div className="mt-2 flex gap-1.5">
        <button
          type="button"
          onClick={onViewDetails}
          title="Ver detalhes"
          className="flex-1 rounded-md bg-sky-600 py-1.5 text-center text-[11px] font-semibold text-white hover:bg-sky-700"
        >
          Detalhes
        </button>
        <button
          type="button"
          disabled={!p.propertyLink}
          title="Abrir no site do leilão"
          className="rounded-md border border-slate-200 px-2 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => {
            if (!p.propertyLink) return;
            window.open(p.propertyLink, "_blank", "noopener,noreferrer");
          }}
        >
          Site
        </button>
      </div>
    </div>
  );
}

export default memo(PropertyMapPreviewInner);
