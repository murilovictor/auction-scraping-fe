"use client";

import React, { useState, useEffect } from "react";
import { Spinner } from "@heroui/spinner";
import FilterBar, { getInitialSelections, buildQueryString } from "@/components/FilterBar";
import { useRouter } from "next/navigation";
import { Card } from "@heroui/card";
import { Pagination } from "@heroui/pagination";

const PAGE_SIZE = 12;

type Property = {
  id: string | number;
  photo?: string;
  firstSalePrice: number;
  secondSalePrice: number;
  appraisalValue: number;
  firstSaleDate?: string;
  secondSaleDate?: string;
  firstSaleDiscountPercent?: number;
  secondSaleDiscountPercent?: number;
  city?: string;
  state?: string;
  neighborhood?: string;
};

export default function PropertiesList() {
  const router = useRouter();
  const [filterQuery, setFilterQuery] = useState("");
  const [properties, setProperties] = useState<Property[]>([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`http://localhost:3009/api/properties?page=${page}&limit=${PAGE_SIZE}&${filterQuery}`);
        const json = await res.json();
        if (!cancelled) {
          setProperties(json.data);
          setTotal(json.meta.total || 0);
        }
      } catch (e) {
        if (!cancelled) {
          setProperties([]);
          setTotal(0);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, [page, filterQuery]);

  const handleApply = (qs: string) => {
    setFilterQuery(qs);
    setPage(1);
    router.replace(`${window.location.pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  };

  useEffect(() => {
    const qs = window.location.search.replace(/^\?/, "");
    setFilterQuery(qs);
    if (!qs) {
      const defaults = getInitialSelections();
      const defaultQs = buildQueryString(defaults);
      setFilterQuery(defaultQs);
      router.replace(`${window.location.pathname}${defaultQs ? `?${defaultQs}` : ""}`, { scroll: false });
    }
    // eslint-disable-next-line
  }, []);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const formatPercent = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "percent",
      minimumFractionDigits: 2,
    }).format(value);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="w-full p-6 min-h-[80vh]">
      <div className="sticky z-10 bg-white pb-2 top-20">
        <FilterBar onApply={handleApply} initialQueryString={filterQuery} />
      </div>
      {totalPages > 1 && (
        <div className="flex justify-center mt-12">
          <Pagination
            showControls={true}
            loop={true}
            siblings={2}
            page={page}
            total={totalPages}
            onChange={setPage}
          />
        </div>
      )}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {properties.map((item: Property) => (
          <Card key={item.id} className="flex flex-col">
            <div className="w-full aspect-video bg-gray-100 flex items-center justify-center overflow-hidden rounded-t">
              {item.photo ? (
                <img src={item.photo} alt="Foto do imóvel" className="object-cover w-full h-full" />
              ) : (
                <div className="text-gray-400">Sem foto</div>
              )}
            </div>
            <div className="flex-1 flex flex-col gap-2 p-4">
              {/* Preço de avaliação */}
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[16px] text-gray-500 font-semibold">Avaliação:</span>
                <span className="text-[16px] text-gray-400 line-through">{formatCurrency(item.appraisalValue)}</span>
              </div>

              <div className="border-t border-gray-200 my-0" />

              {/* Primeiro Leilão */}
              <div>
                <div className="text-xs text-gray-500 font-semibold mb-1">Primeiro Leilão</div>
                <div className="flex items-center gap-2">
                  <span className="text-primary text-lg font-bold">{formatCurrency(item.firstSalePrice)}</span>
                  {item.firstSaleDiscountPercent !== undefined && (
                    <span className="text-green-600 text-xs font-semibold bg-green-100 rounded px-2 py-0.5">
                      {formatPercent(Number(item.firstSaleDiscountPercent) / 100)}
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  Data: {item.firstSaleDate ? new Date(item.firstSaleDate).toLocaleDateString("pt-BR") : "-"}
                </div>
              </div>

              <div className="border-t border-gray-200 my-0" />

              {/* Segundo Leilão */}
              <div>
                <div className="text-xs text-gray-500 font-semibold mb-1">Segundo Leilão</div>
                <div className="flex items-center gap-2">
                  <span className="text-primary text-lg font-bold">{formatCurrency(item.secondSalePrice)}</span>
                  {item.secondSaleDiscountPercent !== undefined && (
                    <span className="text-green-600 text-xs font-semibold bg-green-100 rounded px-2 py-0.5">
                      {formatPercent(Number(item.secondSaleDiscountPercent) / 100)}
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  Data: {item.secondSaleDate ? new Date(item.secondSaleDate).toLocaleDateString("pt-BR") : "-"}
                </div>
              </div>

              <div className="border-t border-gray-200 my-0" />

              {/* Localização */}
              <div className="text-xs text-gray-500 mt-2 font-semibold">
                {item.city} - {item.state} {item.neighborhood && `- ${item.neighborhood}`}
              </div>
            </div>
          </Card>
        ))}
      </div>
      {isLoading && (
        <div className="flex justify-center items-center min-h-[100px]">
          <Spinner />
        </div>
      )}
      {!isLoading && properties.length === 0 && (
        <div className="text-center text-gray-500 py-12">Nenhum imóvel encontrado.</div>
      )}
      {totalPages > 1 && (
        <div className="flex justify-center mt-12">
          <Pagination
            showControls={true}
            loop={true}
            siblings={2}
            page={page}
            total={totalPages}
            onChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
