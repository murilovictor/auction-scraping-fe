/**
 * Resposta de GET /api/properties/filters (mesmo contrato do FilterBar / auction-list).
 */

export type PropertyFilterOption = { value: string; label: string };

export type PropertyFiltersConfigItem = {
  key: string;
  label: string;
  description?: string;
  title?: string;
  type: string;
  defaultValue?: unknown;
  options?: PropertyFilterOption[];
  slider?: { min?: number; max?: number };
};

export type PropertyFiltersConfig = PropertyFiltersConfigItem[];

export type MapFilterSelectOptions = {
  propertyTypes: PropertyFilterOption[];
  modalities: PropertyFilterOption[];
  paymentConditions: PropertyFilterOption[];
  /** Filtro tipo “tipo de leilão” / venda, se existir no config (usa `key` real na query) */
  saleTypeFilter: {
    queryKey: string;
    label: string;
    options: PropertyFilterOption[];
  } | null;
};

const FALLBACK_PROPERTY_TYPES: PropertyFilterOption[] = [
  { value: "Casa", label: "Casa" },
  { value: "Apartamento", label: "Apartamento" },
  { value: "Terreno", label: "Terreno" },
  { value: "Comercial", label: "Comercial" },
];

const FALLBACK_PAYMENT: PropertyFilterOption[] = [
  { value: "Financiamento", label: "Financiamento" },
  { value: "À vista", label: "À vista" },
  { value: "FGTS", label: "FGTS" },
  { value: "Parcelado", label: "Parcelado" },
];

function pickOptions(
  config: PropertyFiltersConfig | null,
  key: string,
): PropertyFilterOption[] {
  if (!config?.length) return [];
  const item = config.find((c) => c.key === key && Array.isArray(c.options));
  const raw = (item?.options ?? []) as PropertyFilterOption[];
  return raw.filter((o) => o && typeof o.value === "string" && o.value.length > 0);
}

/** Descobre bloco “tipo de leilão” quando o backend não usa a chave `saleType`. */
function resolveSaleTypeFilter(
  config: PropertyFiltersConfig,
): MapFilterSelectOptions["saleTypeFilter"] {
  const reserved = new Set([
    "propertyType",
    "modality",
    "paymentConditions",
    "expensePaymentRules",
    "sort",
    "discount",
    "auctionPrice",
    "appraisal",
    "available",
  ]);

  const direct = config.find((c) => c.key === "saleType" && c.options?.length);
  if (direct?.options?.length) {
    return {
      queryKey: direct.key,
      label: direct.label ?? "Tipo de leilão",
      options: direct.options as PropertyFilterOption[],
    };
  }

  const fallback = config.find((c) => {
    if (!c.options?.length || reserved.has(c.key)) return false;
    if (c.type !== "checkbox" && c.type !== "radio") return false;
    const lab = `${c.label ?? ""} ${c.title ?? ""}`.toLowerCase();
    return /leil[aã]o|tipo\s+de\s+venda|modalidade\s+de\s+venda/.test(lab);
  });

  if (fallback?.options?.length) {
    return {
      queryKey: fallback.key,
      label: fallback.label ?? "Tipo de leilão",
      options: fallback.options as PropertyFilterOption[],
    };
  }

  return null;
}

/** Opções para os selects rápidos do mapa (alinhado ao auction-list). */
export function extractMapFilterSelects(
  config: PropertyFiltersConfig | null,
): MapFilterSelectOptions {
  if (!config || !Array.isArray(config)) {
    return {
      propertyTypes: FALLBACK_PROPERTY_TYPES,
      modalities: [],
      paymentConditions: FALLBACK_PAYMENT,
      saleTypeFilter: null,
    };
  }

  let propertyTypes = pickOptions(config, "propertyType");
  let modalities = pickOptions(config, "modality");
  let paymentConditions = pickOptions(config, "paymentConditions");
  const saleTypeFilter = resolveSaleTypeFilter(config);

  if (!propertyTypes.length) propertyTypes = FALLBACK_PROPERTY_TYPES;
  if (!paymentConditions.length) paymentConditions = FALLBACK_PAYMENT;

  return { propertyTypes, modalities, paymentConditions, saleTypeFilter };
}
