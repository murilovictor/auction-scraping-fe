import { MOCK_AUCTION_PROPERTIES } from "@/data/mockAuctionProperties";
import type { PropertyApi, PropertiesListResponse } from "@/types/property-api";
import type {
  MapBoundsLiteral,
  PropertyMapSearchItem,
  QuickFiltersState,
} from "@/types/property-map-search";

const PAGE_SIZE_MAP = 200;

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function backendBase(): string {
  const base = process.env.NEXT_PUBLIC_BACKEND_URL ?? "";
  return base.replace(/\/$/, "");
}

function resolveMediaUrl(url: string): string {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  const base = backendBase();
  if (!base) return url;
  return url.startsWith("/") ? `${base}${url}` : url;
}

function acceptsFinancing(p: PropertyApi): boolean {
  const list = p.paymentConditions ?? [];
  return list.some((c) => /financi/i.test(String(c)));
}

/** Converte item da API para o modelo usado pelos componentes do mapa. */
export function mapApiPropertyToMapItem(p: PropertyApi): PropertyMapSearchItem | null {
  const lat = p.latitude;
  const lng = p.longitude;
  if (typeof lat !== "number" || typeof lng !== "number" || Number.isNaN(lat) || Number.isNaN(lng)) {
    return null;
  }

  const thumbRaw = (p.photos && p.photos.length > 0 ? p.photos[0] : p.photo) ?? "";
  const thumb = resolveMediaUrl(thumbRaw);
  const preco =
    typeof p.firstSalePrice === "number" && p.firstSalePrice > 0
      ? p.firstSalePrice
      : typeof p.secondSalePrice === "number"
        ? p.secondSalePrice
        : 0;

  const d1 = p.firstSaleDiscountPercent;
  const d2 = p.secondSaleDiscountPercent;
  let desconto: number | null = null;
  if (typeof d1 === "number" && !Number.isNaN(d1)) desconto = d1;
  else if (typeof d2 === "number" && !Number.isNaN(d2)) desconto = d2;

  return {
    id: String(p.id),
    latitude: lat,
    longitude: lng,
    titulo: p.propertyName ?? "(Sem título)",
    endereco: (p.address ?? [p.neighborhood, p.city, p.state].filter(Boolean).join(", ")) || "",
    preco,
    desconto,
    thumbnail: thumb,
    tipo: p.type ?? "",
    aceitaFinanciamento: acceptsFinancing(p),
    valorAvaliacao: typeof p.appraisalValue === "number" ? p.appraisalValue : 0,
    propertyLink: (() => {
      const raw = p.propertyLink?.trim();
      if (!raw) return undefined;
      return resolveMediaUrl(raw) || undefined;
    })(),
    isFavorite: !!p.isFavorite,
  };
}

/** Mesmo contrato do AuctionList: POST favorita, DELETE remove (body JSON com userId + propertyId). */
export async function setPropertyFavorite(
  userId: string,
  propertyId: string | number,
  favorited: boolean,
): Promise<void> {
  const base = backendBase();
  if (!base) {
    throw new Error("NEXT_PUBLIC_BACKEND_URL não configurada");
  }
  const url = `${base}/api/favorites`;
  const body = JSON.stringify({ userId, propertyId });
  const res = await fetch(url, {
    method: favorited ? "POST" : "DELETE",
    headers: { "Content-Type": "application/json" },
    body,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Erro ${res.status} ao atualizar favorito`);
  }
}

function appendBounds(params: URLSearchParams, b: MapBoundsLiteral) {
  params.set("north", String(b.north));
  params.set("south", String(b.south));
  params.set("east", String(b.east));
  params.set("west", String(b.west));
}

/** Monta query string alinhada ao FilterBar + bbox opcional. */
export function buildMapPropertiesQuery(
  quick: QuickFiltersState,
  q: string,
  bounds?: MapBoundsLiteral,
): URLSearchParams {
  const params = new URLSearchParams();

  if (bounds) appendBounds(params, bounds);

  const min = quick.precoMin ? Number(quick.precoMin.replace(/\D/g, "")) : NaN;
  const max = quick.precoMax ? Number(quick.precoMax.replace(/\D/g, "")) : NaN;
  if (!Number.isNaN(min) && min > 0) params.set("auctionPriceMin", String(min));
  if (!Number.isNaN(max) && max > 0) params.set("auctionPriceMax", String(max));

  if (quick.tipo) params.set("propertyType", quick.tipo);

  const dMin = quick.descontoMin ? Number(quick.descontoMin) : NaN;
  if (!Number.isNaN(dMin) && dMin > 0) {
    params.set("discountMin", String(dMin));
    params.set("discountMax", "100");
  }

  if (q.trim()) params.set("q", q.trim());

  /** Ajuste o valor conforme o enum real do backend em `paymentConditions`. */
  if (quick.aceitaFinanciamento === "sim") {
    params.set("paymentConditions", "Financiamento");
  }

  return params;
}

/** Filtro client só para “não aceita financ.” se a API não tiver parâmetro negativo. */
export function filterFinanciamentoNao(
  items: PropertyMapSearchItem[],
  aceita: QuickFiltersState["aceitaFinanciamento"],
): PropertyMapSearchItem[] {
  if (aceita === "nao") return items.filter((p) => !p.aceitaFinanciamento);
  return items;
}

/** Filtros rápidos 100% client-side (fallback com mock / dev). */
export function filterPropertiesClient(
  items: PropertyMapSearchItem[],
  q: QuickFiltersState,
): PropertyMapSearchItem[] {
  let out = items;
  const min = q.precoMin ? Number(q.precoMin.replace(/\D/g, "")) : NaN;
  const max = q.precoMax ? Number(q.precoMax.replace(/\D/g, "")) : NaN;
  if (!Number.isNaN(min) && min > 0) out = out.filter((p) => p.preco >= min);
  if (!Number.isNaN(max) && max > 0) out = out.filter((p) => p.preco <= max);
  if (q.tipo) out = out.filter((p) => p.tipo === q.tipo);
  const dMin = q.descontoMin ? Number(q.descontoMin) : NaN;
  if (!Number.isNaN(dMin) && dMin > 0) {
    out = out.filter((p) => (p.desconto ?? 0) >= dMin);
  }
  if (q.aceitaFinanciamento === "sim") {
    out = out.filter((p) => p.aceitaFinanciamento);
  } else if (q.aceitaFinanciamento === "nao") {
    out = out.filter((p) => !p.aceitaFinanciamento);
  }
  return out;
}

export type FetchMapPropertiesArgs = {
  userId: string;
  page?: number;
  limit?: number;
  quick: QuickFiltersState;
  q: string;
  bounds?: MapBoundsLiteral;
};

/**
 * Lista imóveis para o mapa via GET /api/properties (mesmo padrão do AuctionList).
 */
export async function fetchMapProperties({
  userId,
  page = 1,
  limit = PAGE_SIZE_MAP,
  quick,
  q,
  bounds,
}: FetchMapPropertiesArgs): Promise<{ items: PropertyMapSearchItem[]; total: number }> {
  if (process.env.NEXT_PUBLIC_USE_PROPERTY_MAP_MOCK === "true") {
    await delay(250);
    let raw = [...MOCK_AUCTION_PROPERTIES];
    if (bounds) {
      raw = raw.filter(
        (p) =>
          p.latitude <= bounds.north &&
          p.latitude >= bounds.south &&
          (bounds.west <= bounds.east
            ? p.longitude >= bounds.west && p.longitude <= bounds.east
            : p.longitude >= bounds.west || p.longitude <= bounds.east),
      );
    }
    let items = filterPropertiesClient(raw, quick);
    if (q.trim()) {
      const qq = q.trim().toLowerCase();
      items = items.filter((p) => p.titulo.toLowerCase().includes(qq) || p.endereco.toLowerCase().includes(qq));
    }
    return { items, total: items.length };
  }

  const base = backendBase();
  if (!base) {
    return { items: [], total: 0 };
  }

  const params = buildMapPropertiesQuery(quick, q, bounds);
  params.set("page", String(page));
  params.set("limit", String(limit));

  const url = `${base}/api/properties?${params.toString()}`;
  const res = await fetch(url, {
    headers: { "x-user-id": userId },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Erro ${res.status} ao buscar imóveis`);
  }

  const json = (await res.json()) as PropertiesListResponse;
  const rows = Array.isArray(json.data) ? json.data : [];
  const mapped = rows.map(mapApiPropertyToMapItem).filter(Boolean) as PropertyMapSearchItem[];
  const total = typeof json.meta?.total === "number" ? json.meta.total : mapped.length;

  const withFin = filterFinanciamentoNao(mapped, quick.aceitaFinanciamento);
  return { items: withFin, total };
}
