"use client";

import React, { useState } from "react";
import { Button, Chip, Slider, Tab, Tabs, Popover, PopoverTrigger, PopoverContent } from "@heroui/react";
import { Radio, RadioGroup } from "@heroui/radio";
import { Checkbox, CheckboxGroup } from "@heroui/checkbox";

// Configuração inicial dos filtros
type SortOption = { value: string; label: string; sortField: string; sortOrder: 'asc' | 'desc' };

export const filterConfig = [
  {
    key: "sort",
    label: "Ordenação",
    description: "Ordenação",
    title: "Escolha a ordenação",
    type: "radio" as const,
    options: [
      { value: "dataPrimeiroLeilao:asc", label: "Data do primeiro leilão (asc)", sortField: "dataPrimeiroLeilao", sortOrder: "asc" },
      { value: "dataSegundoLeilao:asc", label: "Data do segundo leilão (asc)", sortField: "dataSegundoLeilao", sortOrder: "asc" },
      { value: "precoPrimeiroLeilao:asc", label: "Menor preço do primeiro leilão", sortField: "precoPrimeiroLeilao", sortOrder: "asc" },
      { value: "precoPrimeiroLeilao:desc", label: "Maior preço do primeiro leilão", sortField: "precoPrimeiroLeilao", sortOrder: "desc" },
      { value: "descontoPrimeiroLeilao:desc", label: "Maior desconto do primeiro leilão", sortField: "descontoPrimeiroLeilao", sortOrder: "desc" },
      { value: "precoSegundoLeilao:asc", label: "Menor preço do segundo leilão", sortField: "precoSegundoLeilao", sortOrder: "asc" },
      { value: "precoSegundoLeilao:desc", label: "Maior preço do segundo leilão", sortField: "precoSegundoLeilao", sortOrder: "desc" },
      { value: "descontoSegundoLeilao:desc", label: "Maior desconto do segundo leilão", sortField: "descontoSegundoLeilao", sortOrder: "desc" },
    ] as SortOption[],
    defaultValue: "descontoSegundoLeilao:desc",
  },
  {
    key: "propertyType",
    label: "Tipo",
    description: "Tipo",
    title: "Selecione o(s) tipo(s) de imóvel",
    type: "checkbox" as const,
    options: [
      { value: "Apartamento", label: "Apartamento" },
      { value: "Casa", label: "Casa" },
      { value: "Comercial", label: "Comercial" },
      { value: "Galpão", label: "Galpão" },
      { value: "Imóvel rural", label: "Imóvel rural" },
      { value: "Loja", label: "Loja" },
      { value: "Prédio", label: "Prédio" },
      { value: "Sala", label: "Sala" },
      { value: "Sobrado", label: "Sobrado" },
      { value: "Terreno", label: "Terreno" },

    ],
    defaultValue: [] as string[],
  },
  {
    key: "modality",
    label: "Modalidade",
    description: "Modalidade",
    title: "Escolha a modalidade",
    type: "checkbox" as const,
    options: [
      { value: "sfiEditalUnico", label: "Leilão SFI - Edital Único" },
      { value: "vendaDiretaOnline", label: "Venda Direta Online" },
      { value: "vendaOnline", label: "Venda Online" },
      { value: "licitacaoAberta", label: "Licitação Aberta" },
    ],
    defaultValue: [] as string[],
  },
  {
    key: "paymentConditions",
    label: "Pagamento",
    description: "Pagamento",
    title: "Formas de pagamento",
    type: "checkbox" as const,
    options: [
      { value: "financiamento", label: "Financiamento" },
      { value: "aVista", label: "À Vista" },
      { value: "fgts", label: "FGTS" },
    ],
    defaultValue: [] as string[],
  },
  {
    key: "price",
    label: "Preço",
    description: "Preço",
    title: "Defina o preço desejado",
    type: "slider" as const,
    slider: { min: 0, max: 5000000, step: 5000 },
    defaultValue: { min: 0, max: 5000000 },
  },
  {
    key: "discounts",
    label: "Descontos",
    description: "Descontos",
    title: "Defina os intervalos de desconto (%)",
    type: "custom" as const,
    defaultValue: { discount1: { min: 0, max: 100 }, discount2: { min: 0, max: 100 } },
  },
];

type FilterKey = (typeof filterConfig)[number]["key"];
type Selections = Record<FilterKey, any>;

export const getInitialSelections = (): Selections => {
  const initial: any = {};
  filterConfig.forEach((cfg) => {
    if (cfg.defaultValue) {
      initial[cfg.key] = cfg.defaultValue;
    }
  });
  return initial;
};

export const buildQueryString = (filters: Selections): string => {
  const params = new URLSearchParams();

  if (filters.modality && filters.modality.length) {
    params.set("modality", filters.modality.join(","));
  }
  if (filters.paymentConditions && filters.paymentConditions.length) {
    params.set("paymentConditions", filters.paymentConditions.join(","));
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

  // sort (agora suporta múltiplos sort)
  if (filters.sort) {
    const sortConfig = filterConfig.find(f => f.key === "sort");
    const sortOptions = sortConfig?.options as SortOption[];
    if (Array.isArray(filters.sort)) {
      filters.sort.forEach((sortValue: string) => {
        const opt = sortOptions?.find((o) => o.value === sortValue);
        if (opt) {
          params.append("sort", `${opt.sortField}:${opt.sortOrder}`);
        } else {
          // fallback: tenta splitar
          const [field, order] = sortValue.split(":");
          if (field && order) params.append("sort", `${field}:${order}`);
        }
      });
    } else {
      const opt = sortOptions?.find((o) => o.value === filters.sort);
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

const parseQueryStringToSelections = (qs: string): Selections => {
  const params = new URLSearchParams(qs);
  const selections: any = {};
  params.forEach((value, key) => {
    if (["propertyType", "modality", "paymentConditions"].includes(key)) {
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

const FilterBar: React.FC<{ onApply?: (qs: string) => void; initialSelections?: Selections | null; initialQueryString?: string }> = ({
  onApply,
  initialSelections,
  initialQueryString,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<FilterKey>("sort");

  // Prioridade: initialSelections > initialQueryString > defaults
  const selectionsFromQuery = initialQueryString
    ? parseQueryStringToSelections(initialQueryString)
    : undefined;
  const isEmpty =
    (!initialSelections || Object.keys(initialSelections).length === 0) &&
    (!selectionsFromQuery || Object.keys(selectionsFromQuery).length === 0);
  const [selections, setSelections] = useState<Selections>(
    initialSelections && Object.keys(initialSelections).length > 0
      ? initialSelections
      : selectionsFromQuery && Object.keys(selectionsFromQuery).length > 0
      ? selectionsFromQuery
      : getInitialSelections()
  );
  const [applied, setApplied] = useState<Selections>(
    initialSelections && Object.keys(initialSelections).length > 0
      ? initialSelections
      : selectionsFromQuery && Object.keys(selectionsFromQuery).length > 0
      ? selectionsFromQuery
      : getInitialSelections()
  );

  // Sincroniza selections/applied se initialSelections OU initialQueryString mudar
  React.useEffect(() => {
    const selectionsFromQuery = initialQueryString
      ? parseQueryStringToSelections(initialQueryString)
      : undefined;
    const isEmpty =
      (!initialSelections || Object.keys(initialSelections).length === 0) &&
      (!selectionsFromQuery || Object.keys(selectionsFromQuery).length === 0);
    if (initialSelections && Object.keys(initialSelections).length > 0) {
      setSelections(initialSelections);
      setApplied(initialSelections);
    } else if (selectionsFromQuery && Object.keys(selectionsFromQuery).length > 0) {
      setSelections(selectionsFromQuery);
      setApplied(selectionsFromQuery);
    } else if (isEmpty) {
      setSelections(getInitialSelections());
      setApplied(getInitialSelections());
    }
  }, [initialSelections, initialQueryString]);

  // abre/fecha painel
  const togglePanel = () => setIsOpen((open) => !open);

  // limpa todos filtros
  const clearAll = () => {
    const initial = getInitialSelections();
    setSelections(initial);
    setApplied(initial);
    onApply && onApply(buildQueryString(initial));
  };

  // limpa apenas a aba ativa
  const clearTab = () => {
    setSelections((prev) => ({
      ...prev,
      [activeTab]: filterConfig.find((f) => f.key === activeTab)!.defaultValue,
    }));
  };

  // limpa filtro individual
  const clearFilter = (key: FilterKey) => {
    const defaultValue = filterConfig.find(f => f.key === key)!.defaultValue;
    setSelections(prev => ({ ...prev, [key]: defaultValue }));
    setApplied(prev => ({ ...prev, [key]: defaultValue }));
    onApply && onApply(buildQueryString({ ...applied, [key]: defaultValue }));
  };

  // aplicar seleção e fechar
  const applyFilters = () => {
    setApplied(selections);
    onApply && onApply(buildQueryString(selections));
    setIsOpen(false);
  };

  // renderiza chips de filtros aplicados
  const renderChips = () => {
    const chips: React.ReactNode[] = [];
    for (const key of Object.keys(applied) as FilterKey[]) {
      const val = applied[key];
      if (!val || (Array.isArray(val) && val.length === 0)) continue;

      if (key === "price") {
        chips.push(
          <Chip key={key} onClose={() => clearFilter(key)}>
            Preço: R$ {val.min.toLocaleString()} – R$ {val.max.toLocaleString()}
          </Chip>,
        );
      }
      else if (Array.isArray(val)) {
        const config = filterConfig.find((f) => f.key === key)!;
        const labels = val
          .map((item: string) => {
            const opt = config.options!.find((o) => o.value === item);
            return opt ? opt.label : item;
          })
          .join(", ");
        chips.push(
          <Chip key={key} onClose={() => clearFilter(key)}>
            {config.label}: {labels}
          </Chip>
        );
      } else {
        const config = filterConfig.find((f) => f.key === key)!;
        const opt = config?.options && config?.options?.find((o) => o.value === val);
        if (opt) {
          chips.push(
            <Chip key={key} onClose={() => clearFilter(key)}>
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
                onApply && onApply(buildQueryString({ ...applied, discounts: newDiscounts }));
              }}
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
                onApply && onApply(buildQueryString({ ...applied, discounts: newDiscounts }));
              }}
            >
              Segunda Praça: {val2.min}% – {val2.max}%
            </Chip>
          );
        }
      }
    }
    return chips;
  };

  return (
    <div className="w-full">
      <div className="mb-1 flex flex-wrap items-center gap-1 sm:flex-row flex-col">
        <Popover
          placement="bottom-start"
          isOpen={isOpen}
          onOpenChange={setIsOpen}
        >
          <PopoverTrigger>
            <Button variant="solid" aria-haspopup="dialog" color="primary">
              Filtrar
            </Button>
          </PopoverTrigger>
          <PopoverContent className="rounded bg-white p-4 shadow-md w-full max-w-full sm:max-w-2xl mx-auto">
            <Tabs
              selectedKey={activeTab}
              onSelectionChange={(key) => setActiveTab(key as FilterKey)}
              isVertical={window.innerWidth >= 640}
              classNames={window.innerWidth >= 640 ? { panel: 'w-[360px] max-w-full' } : {}}
            >
              {filterConfig.map((cfg) => (
                <Tab key={cfg.key} title={cfg.description}>
                  <div className="p-4">
                    <div className="font-semibold text-base mb-3">{cfg.title}</div>
                    {/* aqui vai o conteúdo de cada aba: RadioGroup, CheckboxGroup, Slider, Select */}
                    {cfg.type === "radio" && (
                      <RadioGroup
                        defaultValue={cfg?.defaultValue}
                        value={selections[cfg.key]}
                        onValueChange={(val) =>
                          setSelections((prev) => ({ ...prev, [cfg.key]: val }))
                        }
                      >
                        {cfg.options!.map((opt) => (
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
                      >
                        {cfg.options!.map((opt) => (
                          <Checkbox value={opt.value} key={opt.value}>{opt.label}</Checkbox>
                        ))}
                      </CheckboxGroup>
                    )}

                    {cfg.type === "slider" && (
                      <div className="w-full">
                        {cfg.key === "price" && (
                          <>
                            <div className="flex justify-between mb-1 text-sm text-gray-600">
                              <span>
                                {selections.price?.min === cfg.slider?.min
                                  ? "Sem valor mínimo"
                                  : `R$ ${selections.price?.min.toLocaleString()}`}
                              </span>
                              <span>
                                {selections.price?.max === cfg.slider?.max
                                  ? "Sem limite definido"
                                  : `R$ ${selections.price?.max.toLocaleString()}`}
                              </span>
                            </div>
                            <Slider
                              minValue={cfg.slider?.min}
                              maxValue={cfg.slider?.max}
                              step={cfg.slider?.step}
                              value={[selections.price?.min, selections.price?.max]}
                              onChange={(value) => {
                                if (Array.isArray(value)) {
                                  const [min, max] = value;
                                  setSelections((prev) => ({
                                    ...prev,
                                    price: { min, max }
                                  }));
                                }
                              }}
                              className="w-full"
                            />
                          </>
                        )}
                      </div>
                    )}

                    {cfg.type === "custom" && (
                      <div className="w-full space-y-6">
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

                    {/* {cfg.type === "select-pair" && (
                      <></>
                    )} */}
                  </div>
                </Tab>
              ))}
            </Tabs>
            <div className="mt-4 flex flex-col sm:flex-row justify-end gap-2">
              <Button variant="ghost" onPress={clearAll}>
                Limpar
              </Button>
              <Button onPress={applyFilters} color="primary">Filtrar</Button>
            </div>
          </PopoverContent>
        </Popover>
        <div className="flex flex-wrap gap-2 flex-1 border border-gray-200 rounded-md px-2 py-1 bg-white/50">
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
            className="self-start sm:self-auto flex items-center gap-1"
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
