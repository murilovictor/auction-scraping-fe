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
  return (
    <div className="pointer-events-auto z-[6] w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl transition-opacity duration-200">
      <div className="flex gap-3">
        <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-100">
          <Image
            src={p.thumbnail}
            alt=""
            fill
            className="object-cover"
            sizes="96px"
            unoptimized={shouldBypassNextImageOptimization(p.thumbnail)}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h4 className="line-clamp-2 text-sm font-semibold text-slate-900">{p.titulo}</h4>
            <div className="flex shrink-0 items-center gap-0.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite();
                }}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-red-500"
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
                  className={`h-5 w-5 ${isFavorite ? "text-red-500" : "text-slate-400"}`}
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
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Fechar"
              >
                ×
              </button>
            </div>
          </div>
          <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{p.endereco}</p>
          <p className="mt-1 text-sm font-bold text-sky-600">{fmtMoney(p.preco)}</p>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={onViewDetails}
          className="flex-1 rounded-lg bg-sky-600 py-2 text-center text-xs font-semibold text-white hover:bg-sky-700"
        >
          Ver detalhes
        </button>
        <button
          type="button"
          disabled={!p.propertyLink}
          className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => {
            if (!p.propertyLink) return;
            window.open(p.propertyLink, "_blank", "noopener,noreferrer");
          }}
        >
          Ver no site
        </button>
      </div>
    </div>
  );
}

export default memo(PropertyMapPreviewInner);
