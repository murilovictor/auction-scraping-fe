"use client";

import React, { useState, useEffect } from "react";
import { Spinner } from "@heroui/spinner";
import FilterBar, { getInitialSelections, buildQueryString } from "@/components/FilterBar";
import { useRouter } from "next/navigation";
import { Card } from "@heroui/card";
import { Pagination } from "@heroui/pagination";
import { useSession } from "next-auth/react";

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
  address?: string;
  state?: string;
  neighborhood?: string;
  isFavorite?: boolean;
  propertyName?: string;
  propertyLink?: string;
};

export default function PropertiesList() {
  const router = useRouter();
  const [filterQuery, setFilterQuery] = useState("");
  const [properties, setProperties] = useState<Property[]>([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [favorites, setFavorites] = useState<{ [id: string]: boolean }>({});
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id || 'anon';

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`http://localhost:3009/api/properties?page=${page}&limit=${PAGE_SIZE}&${filterQuery}`, {
          headers: {
            'x-user-id': userId,
          },
        });
        const json = await res.json();
        if (!cancelled) {
          setProperties(json.data);
          setTotal(json.meta.total || 0);
          // Inicializa favoritos com base no backend
          const favs: { [id: string]: boolean } = {};
          json.data.forEach((item: any) => {
            favs[item.id] = !!item.isFavorite;
          });
          setFavorites(favs);
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
  }, [page, filterQuery, userId]);

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

  // Função para favoritar/desfavoritar
  const handleToggleFavorite = (propertyId: string | number, current: boolean) => {
    setFavorites(prev => {
      const novo = !current;
      const url = 'http://localhost:3009/api/favorites';
      const payload = {
        userId,
        propertyId,
      };
      if (novo) {
        // Favoritar
        fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
          .then(() => {
            console.log('Favorito salvo no backend');
          })
          .catch(() => {
            console.log('Erro ao favoritar');
          });
      } else {
        // Desfavoritar
        fetch(url, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
          .then(() => {
            console.log('Favorito removido do backend');
          })
          .catch(() => {
            console.log('Erro ao desfavoritar');
          });
      }
      return { ...prev, [propertyId]: novo };
    });
  };

  return (
    <div className="w-full p-6 min-h-[80vh]">
      <div className="sticky z-10 bg-white pb-2 top-20">
        <FilterBar onApply={handleApply} initialQueryString={filterQuery} />
      </div>
      <div className="w-full text-sm text-gray-700 font-semibold mb-2 px-2">
        {total} imóvel{total === 1 ? '' : 'es'} encontrado{total === 1 ? '' : 's'}
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
        {properties.map((item: Property) => {
          const today = new Date();
          today.setHours(0,0,0,0);
          // Primeiro Leilão
          const firstDate = item.firstSaleDate ? new Date(item.firstSaleDate) : null;
          const firstPassed = firstDate && firstDate < today;
          // Segundo Leilão
          const secondDate = item.secondSaleDate ? new Date(item.secondSaleDate) : null;
          const secondPassed = secondDate && secondDate < today;
          
          const isFavorite = favorites[item.id] !== undefined ? favorites[item.id] : !!item.isFavorite;
          return (
            <Card key={item.id} className="flex flex-col">
              <div className="relative w-full aspect-video bg-gray-100 flex items-center justify-center overflow-hidden rounded-t">
                {/* Botão de favorito */}
                <button
                  aria-label="Favoritar"
                  className="absolute z-[1] right-1.5 p-2 bg-gray-50 hover:bg-gray-200 rounded-md transition-colors top-1.5"
                  onClick={e => {
                    e.stopPropagation();
                    handleToggleFavorite(item.id, isFavorite);
                  }}
                  aria-pressed={isFavorite}
                  title={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                  data-state={isFavorite ? 'open' : 'closed'}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill={isFavorite ? 'currentColor' : 'none'}
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    aria-hidden="true"
                    data-slot="icon"
                    className={`w-5 h-5 ${isFavorite ? 'text-red-500 fill-current' : 'text-gray-400'}`}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                  </svg>
                </button>
                {item.photo ? (
                  <img src={item.photo} alt="Foto do imóvel" className="object-cover w-full h-full" />
                ) : (
                  <div className="text-gray-400">Sem foto</div>
                )}
              </div>
              <div className="flex-1 flex flex-col gap-2 p-4">
                {/* Nome do imóvel */}
                {item.propertyName && (
                  <div className="text-base font-semibold text-gray-800 mb-1 truncate" title={item.propertyName}>
                    {item.propertyName}
                  </div>
                )}

                <div className="border-t border-gray-200 my-0" />

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
                    <span className={firstPassed ? "text-gray-400 line-through text-base font-bold" : "text-primary text-lg font-bold"}>
                      {formatCurrency(item.firstSalePrice)}
                    </span>
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
                    <span className={secondPassed ? "text-gray-400 line-through text-base font-bold" : "text-primary text-lg font-bold"}>
                      {formatCurrency(item.secondSalePrice)}
                    </span>
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
                {/* <div className="text-xs text-gray-500 mt-2 font-semibold">
                  {item.city} - {item.state} {item.neighborhood && `- ${item.neighborhood}`}
                </div> */}

                {item.address && (
                  <a
                    href={`https://www.google.com/search?q=${encodeURIComponent(item.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-gray-500 mt-1 font-semibold underline hover:text-primary transition-colors"
                    title="Buscar endereço no Google"
                  >
                    {item.address}
                  </a>
                )}
                {/* Link para o site do leiloeiro */}
                {item.propertyLink && (
                  <a
                    href={item.propertyLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block mt-2 text-primary underline text-xs font-semibold hover:text-primary/80 transition-colors"
                  >
                    Ver no site do leiloeiro
                  </a>
                )}
              </div>
            </Card>
          );
        })}
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
