import type { PropertyFiltersConfig } from "@/types/property-filters-config";

function backendBase(): string {
  const base = process.env.NEXT_PUBLIC_BACKEND_URL ?? "";
  return base.replace(/\/$/, "");
}

/**
 * Mesmo endpoint do auction-list: preenche modalidade, formas de pagamento, tipo de imóvel, etc.
 */
export async function fetchPropertyFiltersConfig(): Promise<PropertyFiltersConfig | null> {
  const base = backendBase();
  if (!base) return null;

  const res = await fetch(`${base}/api/properties/filters`, { cache: "no-store" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Erro ${res.status} ao carregar filtros`);
  }

  const data = (await res.json()) as unknown;
  if (!Array.isArray(data)) return null;
  return data as PropertyFiltersConfig;
}
