"use client";

import React, { useState, useEffect } from "react";
import { Button, Chip, Slider } from "@heroui/react";
import { Radio, RadioGroup } from "@heroui/radio";
import { Checkbox, CheckboxGroup } from "@heroui/checkbox";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter
} from "@heroui/drawer";

// Configuração inicial dos filtros
type SortOption = { value: string; label: string; sortField: string; sortOrder: 'asc' | 'desc' };

declare type FilterConfigItem = {
  key: string;
  label: string;
  description: string;
  title: string;
  type: string;
  defaultValue: any;
  options?: any;
  slider?: any;
};

declare type FilterConfig = FilterConfigItem[];

type FilterKey = string;
type Selections = Record<FilterKey, any>;

type SliderRange = { min: number; max: number };

const sliderBounds = (cfg: FilterConfigItem): SliderRange => ({
  min: Number(cfg.slider?.min ?? 0),
  max: Number(cfg.slider?.max ?? (cfg.key === "discount" ? 100 : Number.MAX_SAFE_INTEGER)),
});

const sliderAtDefault = (val: SliderRange | undefined, cfg: FilterConfigItem): boolean => {
  if (!val || val.min === undefined || val.max === undefined) return true;
  const { min: smin, max: smax } = sliderBounds(cfg);
  return Number(val.min) === smin && Number(val.max) === smax;
};

const isCurrencySliderKey = (key: string): boolean =>
  key === "auctionPrice" || key === "appraisal";

export const getInitialSelections = (filterConfig: FilterConfig): Selections => {
  const initial: any = {};
  if (!filterConfig) return initial;
  filterConfig.forEach((cfg) => {
    if (cfg.defaultValue !== undefined) {
      initial[cfg.key] = cfg.defaultValue;
    }
  });
  return initial;
};

export const buildQueryString = (filters: Selections, filterConfig: FilterConfig): string => {
  const params = new URLSearchParams();

  if (filters.modality && filters.modality.length) {
    params.set("modality", filters.modality.join(","));
  }
  if (filters.paymentConditions && filters.paymentConditions.length) {
    params.set("paymentConditions", filters.paymentConditions.join(","));
  }
  if (filters.expensePaymentRules && filters.expensePaymentRules.length) {
    params.set("expensePaymentRules", filters.expensePaymentRules.join(","));
  }

  if (filters.propertyType && filters.propertyType.length) {
    params.set("propertyType", filters.propertyType.join(","));
  }

  filterConfig.forEach((cfg) => {
    if (cfg.type !== "slider") return;
    const val = filters[cfg.key] as SliderRange | undefined;
    if (!val || val.min === undefined || val.max === undefined) return;
    if (sliderAtDefault(val, cfg)) return;
    params.set(`${cfg.key}Min`, String(val.min));
    params.set(`${cfg.key}Max`, String(val.max));
  });

  // Localização
  if (filters.location) {
    if (filters.location.state) {
      params.set("state", filters.location.state);
    }
    if (filters.location.city) {
      params.set("city", filters.location.city);
    }
    if (filters.location.neighborhood) {
      params.set("neighborhood", filters.location.neighborhood);
    }
  }

  // sort (agora suporta múltiplos sort)
  if (filters.sort) {
    const sortConfig = filterConfig.find(f => f.key === "sort");
    const sortOptions = sortConfig?.options as SortOption[];
    if (Array.isArray(filters.sort)) {
      filters.sort.forEach((sortValue: string) => {
        const opt = sortOptions?.find((o: any) => o.value === sortValue);
        if (opt) {
          params.append("sort", `${opt.sortField}:${opt.sortOrder}`);
        } else {
          // fallback: tenta splitar
          const [field, order] = sortValue.split(":");
          if (field && order) params.append("sort", `${field}:${order}`);
        }
      });
    } else {
      const opt = sortOptions?.find((o: any) => o.value === filters.sort);
      if (opt) {
        params.append("sort", `${opt.sortField}:${opt.sortOrder}`);
      } else {
        // fallback: tenta splitar
        const [field, order] = String(filters.sort).split(":");
        if (field && order) params.append("sort", `${field}:${order}`);
      }
    }
  }

  // Radio genérico (ex.: available) — sort já foi tratado acima
  filterConfig.forEach((cfg) => {
    if (cfg.type !== "radio" || cfg.key === "sort") return;
    const v = filters[cfg.key];
    if (v === undefined || v === null || v === "") return;
    params.set(cfg.key, String(v));
  });

  const query = params.toString();
  const query2 = decodeURIComponent(query);
  return query2 ? `${query2}` : "";
};

const parseQueryStringToSelections = (qs: string, filterConfig: FilterConfig): Selections => {
  const base = getInitialSelections(filterConfig) as Selections;
  if (!qs.trim()) return base;

  const params = new URLSearchParams(qs);
  const sliderMinMaxKeys = new Set<string>();
  filterConfig.forEach((c) => {
    if (c.type === "slider") {
      sliderMinMaxKeys.add(`${c.key}Min`);
      sliderMinMaxKeys.add(`${c.key}Max`);
    }
  });

  const legacyQueryKeys = new Set([
    "priceMin",
    "priceMax",
    "firstDiscountMin",
    "firstDiscountMax",
    "secondDiscountMin",
    "secondDiscountMax",
    "discountPercentMin",
    "discountPercentMax",
  ]);

  params.forEach((value, key) => {
    if (sliderMinMaxKeys.has(key) || legacyQueryKeys.has(key) || key === "sort") return;
    if (["propertyType", "modality", "paymentConditions", "expensePaymentRules"].includes(key)) {
      base[key] = value.split(",");
    } else if (key === "state" || key === "city" || key === "neighborhood") {
      base.location = base.location || {};
      base.location[key] = value;
    } else {
      base[key] = value;
    }
  });

  const sorts = params.getAll("sort");
  if (sorts.length > 0) {
    const sortCfg = filterConfig.find((f) => f.key === "sort");
    const sortOptions = sortCfg?.options as SortOption[] | undefined;
    const toOptionValue = (raw: string) => {
      const opt = sortOptions?.find((o) => `${o.sortField}:${o.sortOrder}` === raw);
      return opt?.value ?? raw;
    };
    const values = sorts.map(toOptionValue);
    base.sort = values.length === 1 ? values[0] : values;
  }

  filterConfig.forEach((cfg) => {
    if (cfg.type !== "slider") return;
    const mn = `${cfg.key}Min`;
    const mx = `${cfg.key}Max`;
    if (params.has(mn) && params.has(mx)) {
      base[cfg.key] = { min: Number(params.get(mn)), max: Number(params.get(mx)) };
    }
  });

  if (
    filterConfig.some((c) => c.key === "appraisal" && c.type === "slider") &&
    params.has("priceMin") &&
    params.has("priceMax") &&
    !params.has("appraisalMin")
  ) {
    base.appraisal = {
      min: Number(params.get("priceMin")),
      max: Number(params.get("priceMax")),
    };
  }

  if (
    filterConfig.some((c) => c.key === "discount" && c.type === "slider") &&
    params.has("discountPercentMin") &&
    params.has("discountPercentMax") &&
    !params.has("discountMin")
  ) {
    base.discount = {
      min: Number(params.get("discountPercentMin")),
      max: Number(params.get("discountPercentMax")),
    };
  }

  return base;
};

// Funções para formatação de moeda
const formatCurrencyBR = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
};

// Função para formatação em tempo real
const formatCurrencyRealTime = (inputValue: string): string => {
  // Remove formatação existente
  const cleanValue = inputValue.replace(/R\$\s*/g, '').replace(/\./g, '').replace(',', '.');
  const numbers = cleanValue.replace(/\D/g, '');
  
  if (numbers === '') return '';
  
  const numericValue = parseInt(numbers, 10);
  return formatCurrencyBR(numericValue);
};

const FilterBar: React.FC<{ 
  onApply?: (qs: string) => void; 
  onClear?: () => void;
  initialSelections?: Selections | null; 
  initialQueryString?: string 
}> = ({
  onApply,
  onClear,
  initialSelections,
  initialQueryString,
}) => {
  const [filterConfig, setFilterConfig] = useState<FilterConfig | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [selections, setSelections] = useState<Selections>({});
  const [applied, setApplied] = useState<Selections>({});
  const [currencyInputs, setCurrencyInputs] = useState<Record<string, { min: string; max: string }>>({});

  // Carrega os filtros do backend
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/properties/filters`)
      .then(res => res.json())
      .then((data) => {
        setFilterConfig(data);
        const initial = getInitialSelections(data);
        setSelections(initial);
        setApplied(initial);
      });
  }, []);

  // Sincroniza selections/applied sempre que initialQueryString mudar
  useEffect(() => {
    if (!filterConfig) return;
    if (initialQueryString && initialQueryString.trim()) {
      const selectionsFromQuery = parseQueryStringToSelections(initialQueryString, filterConfig);
      setSelections(selectionsFromQuery);
      setApplied(selectionsFromQuery);
    } else {
      const initial = getInitialSelections(filterConfig);
      setSelections(initial);
      setApplied(initial);
    }
  }, [initialQueryString, filterConfig]);

  // Sincroniza selections com applied ao abrir o painel de filtros
  useEffect(() => {
    if (!isOpen || !filterConfig) return;
    setSelections(applied);
    const next: Record<string, { min: string; max: string }> = {};
    filterConfig.forEach((cfg) => {
      if (cfg.type !== "slider" || !cfg.slider || !isCurrencySliderKey(cfg.key)) return;
      const v = applied[cfg.key] as SliderRange | undefined;
      next[cfg.key] = {
        min: v?.min != null ? formatCurrencyBR(Number(v.min)) : "",
        max: v?.max != null ? formatCurrencyBR(Number(v.max)) : "",
      };
    });
    setCurrencyInputs(next);
  }, [isOpen, applied, filterConfig]);

  // Só renderiza se filterConfig estiver carregado
  if (!filterConfig) {
    return <div className="p-4 text-center text-gray-500">Carregando filtros...</div>;
  }

  // limpa todos filtros
  const clearAll = () => {
    if (!filterConfig) return;
    const initial = getInitialSelections(filterConfig);
    setSelections(initial);
    setApplied(initial);
    const defaultQs = buildQueryString(initial, filterConfig);
    onApply && onApply(defaultQs);
    onClear && onClear();
  };

  // limpa filtro individual
  const clearFilter = (key: FilterKey) => {
    const defaultValue = filterConfig.find(f => f.key === key)!.defaultValue;
    setSelections(prev => ({ ...prev, [key]: defaultValue }));
    setApplied(prev => ({ ...prev, [key]: defaultValue }));
    onApply && onApply(buildQueryString({ ...applied, [key]: defaultValue }, filterConfig));
  };

  // aplicar seleção e fechar
  const applyFilters = () => {
    setApplied(selections);
    onApply && onApply(buildQueryString(selections, filterConfig));
    setIsOpen(false);
  };

  // renderiza chips de filtros aplicados
  const renderChips = () => {
    const chips: React.ReactNode[] = [];
    const keys = Object.keys(applied) as FilterKey[];
    const orderedKeys = [
      ...keys.filter((k) => k === "sort"),
      ...keys.filter((k) => k !== "sort"),
    ];
    for (const key of orderedKeys) {
      const val = applied[key];
      const cfg = filterConfig.find((f) => f.key === key);

      if (cfg?.type === "slider" && val && typeof val === "object" && "min" in val && "max" in val) {
        if (sliderAtDefault(val as SliderRange, cfg)) continue;
        const range = val as SliderRange;
        chips.push(
          <Chip key={key} onClose={() => clearFilter(key)} className="text-sm">
            {cfg.label}:{" "}
            {key === "discount"
              ? `${range.min}% – ${range.max}%`
              : `${formatCurrencyBR(range.min)} – ${formatCurrencyBR(range.max)}`}
          </Chip>
        );
        continue;
      }

      if (!val || (Array.isArray(val) && val.length === 0)) continue;

      if (Array.isArray(val)) {
        const config = filterConfig.find((f) => f.key === key)!;
        const labels = val
          .map((item: string) => {
            const opt = config.options!.find((o: any) => o.value === item);
            return opt ? opt.label : item;
          })
          .join(", ");
        chips.push(
          <Chip 
            key={key} 
            onClose={() => clearFilter(key)}
            className="text-sm"
          >
            {config.label}: {labels}
          </Chip>
        );
      } else {
        const config = filterConfig.find((f) => f.key === key)!;
        const opt =
          config?.options &&
          config?.options?.find((o: any) => String(o.value) === String(val));
        if (opt) {
          chips.push(
            <Chip 
              key={key} 
              onClose={() => clearFilter(key)}
              className="text-sm"
            >
              {config.label}: {opt.label}
            </Chip>
          );
        }
      }

      // Chips para localização
      if (key === "location" && val) {
        const stateVal = val.state;
        const cityVal = val.city;
        const locationConfig = filterConfig.find(f => f.key === "location");
        if (stateVal) {
          const stateObj = locationConfig?.options?.find((s: any) => s.value === stateVal);
          chips.push(
            <Chip 
              key="location-state" 
              onClose={() => {
                setSelections(prev => ({ ...prev, location: { state: "", city: "", neighborhood: "" } }));
                setApplied(prev => ({ ...prev, location: { state: "", city: "", neighborhood: "" } }));
                onApply && onApply(buildQueryString({ ...applied, location: { state: "", city: "", neighborhood: "" } }, filterConfig));
              }}
              className="text-sm"
            >
              Estado: {stateObj ? stateObj.label : stateVal}
            </Chip>
          );
        }
        if (cityVal && stateVal) {
          const stateObj = locationConfig?.options?.find((s: any) => s.value === stateVal);
          const cityObj = stateObj?.cities?.find((c: any) => c.value === cityVal);
          chips.push(
            <Chip 
              key="location-city" 
              onClose={() => {
                setSelections(prev => ({ ...prev, location: { ...prev.location, city: "", neighborhood: "" } }));
                setApplied(prev => ({ ...prev, location: { ...prev.location, city: "", neighborhood: "" } }));
                onApply && onApply(buildQueryString({ ...applied, location: { ...applied.location, city: "", neighborhood: "" } }, filterConfig));
              }}
              className="text-sm"
            >
              Cidade: {cityObj ? cityObj.label : cityVal}
            </Chip>
          );
        }
        if (val.neighborhood && cityVal && stateVal) {
          const stateObj = locationConfig?.options?.find((s: any) => s.value === stateVal);
          const cityObj = stateObj?.cities?.find((c: any) => c.value === cityVal);
          const neighborhoodObj = cityObj?.neighborhoods?.find((n: any) => n.value === val.neighborhood);
          chips.push(
            <Chip 
              key="location-neighborhood" 
              onClose={() => {
                setSelections(prev => ({ ...prev, location: { ...prev.location, neighborhood: "" } }));
                setApplied(prev => ({ ...prev, location: { ...prev.location, neighborhood: "" } }));
                onApply && onApply(buildQueryString({ ...applied, location: { ...applied.location, neighborhood: "" } }, filterConfig));
              }}
              className="text-sm"
            >
              Bairro: {neighborhoodObj ? neighborhoodObj.label : val.neighborhood}
            </Chip>
          );
        }
      }
    }
    return chips;
  };

  return (
    <div className="w-full">
      <div className="mb-1 flex flex-wrap items-center gap-2 sm:gap-1">
        <Button 
          variant="solid" 
          color="primary" 
          className="w-full sm:w-auto"
          onPress={() => setIsOpen(true)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M3 4.5A1.5 1.5 0 0 1 4.5 3h15A1.5 1.5 0 0 1 21 4.5v15a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 19.5v-15ZM4.5 5a.5.5 0 0 0-.5.5v13a.5.5 0 0 0 .5.5h15a.5.5 0 0 0 .5-.5v-13a.5.5 0 0 0-.5-.5h-15ZM7 8.75a.75.75 0 0 1 .75-.75h8.5a.75.75 0 0 1 0 1.5h-8.5A.75.75 0 0 1 7 8.75Zm.75 2.75a.75.75 0 0 0 0 1.5h8.5a.75.75 0 0 0 0-1.5h-8.5ZM7 15.25a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1-.75-.75Z"/></svg>
          Filtros
        </Button>

        <Drawer
          isOpen={isOpen}
          onOpenChange={setIsOpen}
          placement="right"
          size="sm"
        >
          <DrawerContent>
            <DrawerHeader>
              <h2 className="text-lg font-semibold">Filtros</h2>
            </DrawerHeader>
            <DrawerBody>
              <div className="space-y-6">
                {filterConfig.map((cfg) => (
                  <div key={cfg.key} className="border-b last:border-0 pb-4 last:pb-0">
                    <div className="font-medium mb-3">{cfg.title}</div>
                    {cfg.type === "radio" && (
                      <RadioGroup
                        value={
                          selections[cfg.key] !== undefined && selections[cfg.key] !== null && selections[cfg.key] !== ""
                            ? String(selections[cfg.key])
                            : String(cfg.defaultValue ?? "")
                        }
                        onValueChange={(val) =>
                          setSelections((prev) => ({ ...prev, [cfg.key]: val }))
                        }
                        className="flex flex-col gap-2"
                      >
                        {cfg.options!.map((opt: any) => (
                          <Radio key={opt.value} value={opt.value}>{opt.label}</Radio>
                        ))}
                      </RadioGroup>
                    )}
                    {cfg.type === "checkbox" && (
                      <CheckboxGroup
                        value={selections[cfg.key]}
                        onChange={(vals) =>
                          setSelections((prev) => ({ ...prev, [cfg.key]: vals }))
                        }
                        className="flex flex-col gap-2"
                      >
                        {cfg.options!.map((opt: any) => (
                          <Checkbox value={opt.value} key={opt.value}>{opt.label}</Checkbox>
                        ))}
                      </CheckboxGroup>
                    )}

                    {cfg.type === "slider" && cfg.slider && (
                      <div className="w-full">
                        {cfg.key === "discount" ? (
                          <div className="space-y-2">
                            <div className="flex justify-between mb-1 text-sm text-gray-600">
                              <span>
                                {(selections[cfg.key] as SliderRange | undefined)?.min === sliderBounds(cfg).min
                                  ? "Sem valor mínimo"
                                  : `${(selections[cfg.key] as SliderRange)?.min}%`}
                              </span>
                              <span>
                                {(selections[cfg.key] as SliderRange | undefined)?.max === sliderBounds(cfg).max
                                  ? "Sem limite definido"
                                  : `${(selections[cfg.key] as SliderRange)?.max}%`}
                              </span>
                            </div>
                            <Slider
                              minValue={sliderBounds(cfg).min}
                              maxValue={sliderBounds(cfg).max}
                              step={1}
                              value={[
                                Number.isFinite((selections[cfg.key] as SliderRange | undefined)?.min)
                                  ? (selections[cfg.key] as SliderRange).min
                                  : sliderBounds(cfg).min,
                                Number.isFinite((selections[cfg.key] as SliderRange | undefined)?.max)
                                  ? (selections[cfg.key] as SliderRange).max
                                  : sliderBounds(cfg).max,
                              ]}
                              onChange={(value) => {
                                if (Array.isArray(value)) {
                                  const [min, max] = value;
                                  setSelections((prev) => ({
                                    ...prev,
                                    [cfg.key]: { min, max },
                                  }));
                                }
                              }}
                              className="w-full"
                            />
                          </div>
                        ) : isCurrencySliderKey(cfg.key) ? (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700">
                                  Mínimo
                                </label>
                                <input
                                  type="text"
                                  placeholder="R$ 0,00"
                                  value={currencyInputs[cfg.key]?.min ?? ""}
                                  onChange={(e) => {
                                    const formattedValue = formatCurrencyRealTime(e.target.value);
                                    setCurrencyInputs((prev) => ({
                                      ...prev,
                                      [cfg.key]: { min: formattedValue, max: prev[cfg.key]?.max ?? "" },
                                    }));
                                  }}
                                  onBlur={(e) => {
                                    const numbers = e.target.value.replace(/\D/g, "");
                                    const numericValue = numbers ? parseInt(numbers, 10) : sliderBounds(cfg).min;
                                    const prevRange = (selections[cfg.key] as SliderRange | undefined) || sliderBounds(cfg);
                                    setSelections((prev) => ({
                                      ...prev,
                                      [cfg.key]: {
                                        min: numericValue,
                                        max: prevRange.max ?? sliderBounds(cfg).max,
                                      },
                                    }));
                                  }}
                                  className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                />
                              </div>
                              <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700">
                                  Máximo
                                </label>
                                <input
                                  type="text"
                                  placeholder="R$ 0,00"
                                  value={currencyInputs[cfg.key]?.max ?? ""}
                                  onChange={(e) => {
                                    const formattedValue = formatCurrencyRealTime(e.target.value);
                                    setCurrencyInputs((prev) => ({
                                      ...prev,
                                      [cfg.key]: { min: prev[cfg.key]?.min ?? "", max: formattedValue },
                                    }));
                                  }}
                                  onBlur={(e) => {
                                    const numbers = e.target.value.replace(/\D/g, "");
                                    const numericValue = numbers ? parseInt(numbers, 10) : sliderBounds(cfg).max;
                                    const prevRange = (selections[cfg.key] as SliderRange | undefined) || sliderBounds(cfg);
                                    setSelections((prev) => ({
                                      ...prev,
                                      [cfg.key]: {
                                        min: prevRange.min ?? sliderBounds(cfg).min,
                                        max: numericValue,
                                      },
                                    }));
                                  }}
                                  className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex justify-between mb-1 text-sm text-gray-600">
                              <span>{(selections[cfg.key] as SliderRange | undefined)?.min ?? sliderBounds(cfg).min}</span>
                              <span>{(selections[cfg.key] as SliderRange | undefined)?.max ?? sliderBounds(cfg).max}</span>
                            </div>
                            <Slider
                              minValue={sliderBounds(cfg).min}
                              maxValue={sliderBounds(cfg).max}
                              step={cfg.slider?.step ?? 1}
                              value={[
                                Number.isFinite((selections[cfg.key] as SliderRange | undefined)?.min)
                                  ? (selections[cfg.key] as SliderRange).min
                                  : sliderBounds(cfg).min,
                                Number.isFinite((selections[cfg.key] as SliderRange | undefined)?.max)
                                  ? (selections[cfg.key] as SliderRange).max
                                  : sliderBounds(cfg).max,
                              ]}
                              onChange={(value) => {
                                if (Array.isArray(value)) {
                                  const [min, max] = value;
                                  setSelections((prev) => ({
                                    ...prev,
                                    [cfg.key]: { min, max },
                                  }));
                                }
                              }}
                              className="w-full"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {cfg.type === "location" && (
                      <div className="space-y-4">
                        {/* Estado */}
                        <div>
                          <label className="block mb-1 text-sm font-medium text-gray-700">Estado</label>
                          <select
                            className="w-full border rounded px-2 py-1 text-sm"
                            value={selections.location?.state || ""}
                            onChange={e => {
                              setSelections(prev => ({
                                ...prev,
                                location: { state: e.target.value, city: "", neighborhood: "" }
                              }));
                            }}
                          >
                            <option value="">Selecione o estado</option>
                            {cfg.options && cfg.options.map((state: any) => (
                              <option key={state.value} value={state.value}>{state.label}</option>
                            ))}
                          </select>
                        </div>
                        {/* Cidade */}
                        <div>
                          <label className="block mb-1 text-sm font-medium text-gray-700">Cidade</label>
                          <select
                            className="w-full border rounded px-2 py-1 text-sm"
                            value={selections.location?.city || ""}
                            onChange={e => {
                              setSelections(prev => ({
                                ...prev,
                                location: { ...prev.location, city: e.target.value, neighborhood: "" }
                              }));
                            }}
                            disabled={!selections.location?.state}
                          >
                            <option value="">Selecione a cidade</option>
                            {cfg.options && selections.location?.state &&
                              cfg.options.find((state: any) => state.value === selections.location.state)?.cities?.map((city: any) => (
                                <option key={city.value} value={city.value}>{city.label}</option>
                              ))}
                          </select>
                        </div>
                        {/* Bairro */}
                        <div>
                          <label className="block mb-1 text-sm font-medium text-gray-700">Bairro</label>
                          <select
                            className="w-full border rounded px-2 py-1 text-sm"
                            value={selections.location?.neighborhood || ""}
                            onChange={e => {
                              setSelections(prev => ({
                                ...prev,
                                location: { ...prev.location, neighborhood: e.target.value }
                              }));
                            }}
                            disabled={!selections.location?.city}
                          >
                            <option value="">Selecione o bairro</option>
                            {cfg.options && selections.location?.state && selections.location?.city &&
                              cfg.options.find((state: any) => state.value === selections.location.state)?.cities?.find((city: any) => city.value === selections.location.city)?.neighborhoods?.map((neighborhood: any) => (
                                <option key={neighborhood.value} value={neighborhood.value}>{neighborhood.label}</option>
                              ))}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </DrawerBody>
            <DrawerFooter>
              <div className="flex justify-end gap-2">
                <Button 
                  variant="ghost" 
                  onPress={() => {
                    clearAll();
                    setIsOpen(false);
                  }} 
                  size="sm"
                >
                  Limpar
                </Button>
                <Button onPress={applyFilters} color="primary" size="sm">
                  Aplicar
                </Button>
              </div>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>

        <div className="flex flex-wrap gap-1.5 flex-1 border border-gray-200 rounded-md px-2 py-2 bg-white/50 min-h-[40px] overflow-x-auto">
          {renderChips()}
        </div>
        {buildQueryString(applied, filterConfig) !==
          buildQueryString(getInitialSelections(filterConfig), filterConfig) && (
          <Button
            variant="ghost"
            aria-label="Limpar filtros"
            onPress={clearAll}
            className="w-full sm:w-auto flex items-center justify-center gap-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M7 4V2.75A2.75 2.75 0 0 1 9.75 0h4.5A2.75 2.75 0 0 1 17 2.75V4h4.25a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1 0-1.5H7Zm1.5-1.25V4h7V2.75a1.25 1.25 0 0 0-1.25-1.25h-4.5A1.25 1.25 0 0 0 8.5 2.75ZM4.25 6.5h15.5l-.8 13.09A3.25 3.25 0 0 1 15.71 22H8.29a3.25 3.25 0 0 1-3.24-2.41L4.25 6.5Zm2.25 2 0 .09.8 13.09c.1.8.79 1.41 1.59 1.41h7.42c.8 0 1.49-.61 1.59-1.41l.8-13.09.01-.09H6.5Zm2.25 2.75a.75.75 0 0 1 .75.75v6.5a.75.75 0 0 1-1.5 0v-6.5a.75.75 0 0 1 .75-.75Zm3.25.75a.75.75 0 0 0-1.5 0v6.5a.75.75 0 0 0 1.5 0v-6.5Zm2.5-.75a.75.75 0 0 1 .75.75v6.5a.75.75 0 0 1-1.5 0v-6.5a.75.75 0 0 1 .75-.75Z"/></svg>
            Limpar filtros
          </Button>
        )}
      </div>
    </div>
  );
};

export default FilterBar;
