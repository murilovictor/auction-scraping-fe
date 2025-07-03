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
  
  if (filters.price) {
    params.set("priceMin", String(filters.price.min));
    params.set("priceMax", String(filters.price.max));
  }

  if (filters.propertyType && filters.propertyType.length) {
    params.set("propertyType", filters.propertyType.join(","));
  }

  // Descontos
  if (filters.discounts) {
    const { discount1, discount2 } = filters.discounts;
    if (discount1 && (discount1.min !== 0 || discount1.max !== 100)) {
      params.set("firstDiscountMin", String(discount1.min));
      params.set("firstDiscountMax", String(discount1.max));
    }
    if (discount2 && (discount2.min !== 0 || discount2.max !== 100)) {
      params.set("secondDiscountMin", String(discount2.min));
      params.set("secondDiscountMax", String(discount2.max));
    }
  }

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

  const query = params.toString();
  const query2 = decodeURIComponent(query);
  return query2 ? `${query2}` : "";
};

const parseQueryStringToSelections = (qs: string, filterConfig: FilterConfig): Selections => {
  const params = new URLSearchParams(qs);
  const selections: any = {};
  params.forEach((value, key) => {
    if (["propertyType", "modality", "paymentConditions", "expensePaymentRules"].includes(key)) {
      selections[key] = value.split(",");
    } else if (key === "priceMin" || key === "priceMax") {
      selections.price = selections.price || {};
      if (key === "priceMin") selections.price.min = Number(value);
      if (key === "priceMax") selections.price.max = Number(value);
    } else if (
      ["firstDiscountMin", "firstDiscountMax", "secondDiscountMin", "secondDiscountMax"].includes(key)
    ) {
      selections.discounts = selections.discounts || {
        discount1: { min: 0, max: 100 },
        discount2: { min: 0, max: 100 },
      };
      if (key === "firstDiscountMin") selections.discounts.discount1.min = Number(value);
      if (key === "firstDiscountMax") selections.discounts.discount1.max = Number(value);
      if (key === "secondDiscountMin") selections.discounts.discount2.min = Number(value);
      if (key === "secondDiscountMax") selections.discounts.discount2.max = Number(value);
    } else if (key === "state" || key === "city" || key === "neighborhood") {
      selections.location = selections.location || {};
      selections.location[key] = value;
    } else {
      selections[key] = value;
    }
  });
  // Garante que discounts, discount1 e discount2 sempre existam
  if (!selections.discounts) {
    selections.discounts = {
      discount1: { min: 0, max: 100 },
      discount2: { min: 0, max: 100 }
    };
  } else {
    if (!selections.discounts.discount1) {
      selections.discounts.discount1 = { min: 0, max: 100 };
    }
    if (!selections.discounts.discount2) {
      selections.discounts.discount2 = { min: 0, max: 100 };
    }
  }
  return selections;
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

const parseCurrencyBR = (value: string): number => {
  // Remove R$, espaços, pontos e converte vírgula para ponto
  const cleanValue = value.replace(/R\$\s*/g, '').replace(/\./g, '').replace(',', '.');
  const parsed = parseFloat(cleanValue);
  return isNaN(parsed) ? 0 : parsed;
};

const formatCurrencyInput = (value: string): string => {
  // Remove tudo exceto números
  const numbers = value.replace(/\D/g, '');
  if (numbers === '') return '';
  
  // Converte para número e formata
  const number = parseInt(numbers, 10);
  return formatCurrencyBR(number);
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

// Função para permitir digitação livre
const allowFreeTyping = (value: string): string => {
  // Remove apenas R$ e espaços, mantém números, pontos e vírgulas
  return value.replace(/R\$\s*/g, '');
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
  const [priceInputs, setPriceInputs] = useState({ min: "", max: "" });

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
    const selectionsFromQuery = initialQueryString
      ? parseQueryStringToSelections(initialQueryString, filterConfig)
      : undefined;
    if (selectionsFromQuery && Object.keys(selectionsFromQuery).length > 0) {
      setSelections(selectionsFromQuery);
      setApplied(selectionsFromQuery);
    } else {
      // Se não houver filtros na query, reseta para o default
      const initial = getInitialSelections(filterConfig);
      setSelections(initial);
      setApplied(initial);
    }
  }, [initialQueryString, filterConfig]);

  // Sincroniza selections com applied ao abrir o painel de filtros
  useEffect(() => {
    if (isOpen) {
      setSelections(applied);
      // Sincroniza inputs de preço
      setPriceInputs({
        min: applied.price?.min ? formatCurrencyBR(applied.price.min) : "",
        max: applied.price?.max ? formatCurrencyBR(applied.price.max) : ""
      });
    }
  }, [isOpen, applied]);

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
    // Garante que sort (ordenacao) venha primeiro
    const keys = Object.keys(applied) as FilterKey[];
    const orderedKeys = [
      ...keys.filter((k) => k === "sort"),
      ...keys.filter((k) => k !== "sort"),
    ];
    for (const key of orderedKeys) {
      const val = applied[key];
      if (!val || (Array.isArray(val) && val.length === 0)) continue;

      if (key === "price") {
        chips.push(
          <Chip 
            key={key} 
            onClose={() => clearFilter(key)}
            className="text-sm"
          >
            Preço: {formatCurrencyBR(val.min)} – {formatCurrencyBR(val.max)}
          </Chip>,
        );
      }
      else if (Array.isArray(val)) {
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
        const opt = config?.options && config?.options?.find((o: any) => o.value === val);
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

      // Chips para descontos
      if (key === "discounts") {
        const val1 = val.discount1;
        const val2 = val.discount2;
        if (val1.min !== 0 || val1.max !== 100) {
          chips.push(
            <Chip
              key={key + "-1"}
              onClose={() => {
                const newDiscounts = { ...applied.discounts, discount1: { min: 0, max: 100 } };
                setSelections(prev => ({ ...prev, discounts: newDiscounts }));
                setApplied(prev => ({ ...prev, discounts: newDiscounts }));
                onApply && onApply(buildQueryString({ ...applied, discounts: newDiscounts }, filterConfig));
              }}
              className="text-sm"
            >
              Primeira Praça: {val1.min}% – {val1.max}%
            </Chip>
          );
        }
        if (val2.min !== 0 || val2.max !== 100) {
          chips.push(
            <Chip
              key={key + "-2"}
              onClose={() => {
                const newDiscounts = { ...applied.discounts, discount2: { min: 0, max: 100 } };
                setSelections(prev => ({ ...prev, discounts: newDiscounts }));
                setApplied(prev => ({ ...prev, discounts: newDiscounts }));
                onApply && onApply(buildQueryString({ ...applied, discounts: newDiscounts }, filterConfig));
              }}
              className="text-sm"
            >
              Segunda Praça: {val2.min}% – {val2.max}%
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
                        defaultValue={cfg?.defaultValue}
                        value={selections[cfg.key]}
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

                    {cfg.type === "slider" && (
                      <div className="w-full">
                        {cfg.key === "price" && cfg.slider && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              {/* Preço Mínimo */}
                              <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700">
                                  Preço Mínimo
                                </label>
                                <input
                                  type="text"
                                  placeholder="R$ 0,00"
                                  value={priceInputs.min}
                                  onChange={(e) => {
                                    const formattedValue = formatCurrencyRealTime(e.target.value);
                                    setPriceInputs(prev => ({ ...prev, min: formattedValue }));
                                  }}
                                  onBlur={(e) => {
                                    // Converte para número quando sai do campo
                                    const numbers = e.target.value.replace(/\D/g, '');
                                    const numericValue = numbers ? parseInt(numbers, 10) : 0;
                                    
                                    setSelections((prev) => ({
                                      ...prev,
                                      price: {
                                        min: numericValue,
                                        max: prev.price?.max || cfg.slider.max
                                      }
                                    }));
                                  }}
                                  className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                />
                              </div>
                              
                              {/* Preço Máximo */}
                              <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700">
                                  Preço Máximo
                                </label>
                                <input
                                  type="text"
                                  placeholder="R$ 0,00"
                                  value={priceInputs.max}
                                  onChange={(e) => {
                                    const formattedValue = formatCurrencyRealTime(e.target.value);
                                    setPriceInputs(prev => ({ ...prev, max: formattedValue }));
                                  }}
                                  onBlur={(e) => {
                                    // Converte para número quando sai do campo
                                    const numbers = e.target.value.replace(/\D/g, '');
                                    const numericValue = numbers ? parseInt(numbers, 10) : 0;
                                    
                                    setSelections((prev) => ({
                                      ...prev,
                                      price: {
                                        min: prev.price?.min || cfg.slider.min,
                                        max: numericValue
                                      }
                                    }));
                                  }}
                                  className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {cfg.type === "custom" && (
                      <div className="space-y-4">
                        {/* Desconto 1 */}
                        <div>
                          <div className="mb-1 text-sm text-gray-600 font-medium">Primeira Praça</div>
                          <div className="flex justify-between mb-1 text-sm text-gray-600">
                            <span>
                              {selections.discounts?.discount1?.min === 0
                                ? "Sem valor mínimo"
                                : `${selections.discounts?.discount1?.min}%`}
                            </span>
                            <span>
                              {selections.discounts?.discount1?.max === 100
                                ? "Sem limite definido"
                                : `${selections.discounts?.discount1?.max}%`}
                            </span>
                          </div>
                          <Slider
                            minValue={0}
                            maxValue={100}
                            step={1}
                            value={[
                              Number.isFinite(selections.discounts?.discount1?.min) ? selections.discounts?.discount1.min : 0,
                              Number.isFinite(selections.discounts?.discount1?.max) ? selections.discounts.discount1.max : 100,
                            ]}
                            onChange={(value) => {
                              if (Array.isArray(value)) {
                                const [min, max] = value;
                                setSelections((prev) => ({
                                  ...prev,
                                  discounts: {
                                    ...prev.discounts,
                                    discount1: { min, max },
                                    discount2: prev.discounts?.discount2 || { min: 0, max: 100 },
                                  },
                                }));
                              }
                            }}
                            className="w-full"
                          />
                        </div>
                        {/* Desconto 2 */}
                        <div>
                          <div className="mb-1 text-sm text-gray-600 font-medium">Segunda Praça</div>
                          <div className="flex justify-between mb-1 text-sm text-gray-600">
                            <span>
                              {selections.discounts?.discount2?.min === 0
                                ? "Sem valor mínimo"
                                : `${selections.discounts?.discount2?.min}%`}
                            </span>
                            <span>
                              {selections.discounts?.discount2?.max === 100
                                ? "Sem limite definido"
                                : `${selections.discounts?.discount2?.max}%`}
                            </span>
                          </div>
                          <Slider
                            minValue={0}
                            maxValue={100}
                            step={1}
                            value={[
                              Number.isFinite(selections.discounts?.discount2?.min) ? selections.discounts?.discount2?.min : 0,
                              Number.isFinite(selections.discounts?.discount2?.max) ? selections.discounts?.discount2?.max : 100,
                            ]}
                            onChange={(value) => {
                              if (Array.isArray(value)) {
                                const [min, max] = value;
                                setSelections((prev) => ({
                                  ...prev,
                                  discounts: {
                                    ...prev.discounts,
                                    discount1: prev.discounts?.discount1 || { min: 0, max: 100 },
                                    discount2: { min, max },
                                  },
                                }));
                              }
                            }}
                            className="w-full"
                          />
                        </div>
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
        {Object.keys(applied).some((k) => {
          const v = applied[k as FilterKey];
          return Array.isArray(v) ? v.length > 0 : Boolean(v);
        }) && (
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
