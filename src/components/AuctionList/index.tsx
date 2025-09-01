"use client";

import React, { useState, useEffect } from "react";
import { Spinner } from "@heroui/spinner";
import FilterBar, { getInitialSelections, buildQueryString } from "@/components/FilterBar";
import { useRouter } from "next/navigation";
import { Card } from "@heroui/card";
import { Pagination } from "@heroui/pagination";
import { useSession } from "next-auth/react";
import { FaHome, FaCar, FaRuler, FaMapMarkerAlt, FaSearch, FaChevronLeft, FaChevronRight } from 'react-icons/fa'
import { Input } from "@heroui/input";

const PAGE_SIZE = 30;

type Property = {
  id: string | number;
  photo?: string; // Mantendo para compatibilidade
  photos?: string[]; // Novo array de fotos
  firstSalePrice: number;
  secondSalePrice: number;
  appraisalValue: number;
  firstSaleDate?: string;
  type?: string;
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
  auctioneerName?: string;
  auctionLink?: string;
  privateArea?: number;
  landArea?: number;
  rooms?: number;
  garageSpaces?: number;
  saleType?: string;
  paymentConditions?: string[];
  expensePaymentRules?: string[];
  importantObservations?: string[];
  createdAt?: string;
  updatedAt?: string;
};

// Componente do carrossel de fotos
const PhotoCarousel = ({ photos, propertyName }: { photos: string[], propertyName?: string }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextPhoto = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % photos.length);
  };

  const prevPhoto = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + photos.length) % photos.length);
  };

  const goToPhoto = (index: number) => {
    setCurrentIndex(index);
  };

  if (!photos || photos.length === 0) {
    return (
      <div className="text-gray-400 flex items-center justify-center h-full">
        Sem foto
      </div>
    );
  }

  return (
    <div className="relative w-full h-full group">
      {/* Foto atual */}
      <img 
        src={photos[currentIndex]} 
        alt={`Foto ${currentIndex + 1} do imóvel ${propertyName || ''}`} 
        className="object-cover w-full h-full transition-opacity duration-300" 
      />
      
      {/* Indicadores de navegação */}
      {photos.length > 1 && (
        <>
          {/* Botão anterior */}
          <button
            onClick={prevPhoto}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
            aria-label="Foto anterior"
          >
            <FaChevronLeft className="w-4 h-4" />
          </button>
          
          {/* Botão próximo */}
          <button
            onClick={nextPhoto}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
            aria-label="Próxima foto"
          >
            <FaChevronRight className="w-4 h-4" />
          </button>
          
          {/* Indicadores de pontos */}
          <div className="absolute bottom-2 right-1/2 -translate-x-1/2 flex gap-1 z-10 ml-5">
            {photos.map((_, index) => (
              <button
                key={index}
                onClick={() => goToPhoto(index)}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  index === currentIndex 
                    ? 'bg-white scale-125' 
                    : 'bg-white/50 hover:bg-white/75'
                }`}
                aria-label={`Ir para foto ${index + 1}`}
              />
            ))}
          </div>
          
          {/* Contador de fotos */}
          <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-md z-10">
            {currentIndex + 1} / {photos.length}
          </div>
        </>
      )}
    </div>
  );
};

export default function PropertiesList() {
  const router = useRouter();
  const [filterQuery, setFilterQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [properties, setProperties] = useState<Property[]>([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [favorites, setFavorites] = useState<{ [id: string]: boolean }>({});
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id || 'anon';
  const [filterConfig, setFilterConfig] = useState<any>(null);
  const componentRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Carrega os filtros do backend
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/properties/filters`)
      .then(res => res.json())
      .then((data) => {
        setFilterConfig(data);
      });
  }, []);

  useEffect(() => {
    if (!filterConfig) return;
    const qs = window.location.search.replace(/^\?/, "");
    setFilterQuery(qs);

    // Extrai o parâmetro de busca da URL
    const searchParams = new URLSearchParams(qs);
    const searchValue = searchParams.get('q');
    if (searchValue) {
      setSearchInput(searchValue);
      setSearchQuery(searchValue);
    }

    if (!qs) {
      const defaults = getInitialSelections(filterConfig);
      const defaultQs = buildQueryString(defaults, filterConfig);
      setFilterQuery(defaultQs);
      router.replace(`${window.location.pathname}${defaultQs ? `?${defaultQs}` : ""}`, { scroll: false });
    }
  }, [router, filterConfig]);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const searchParam = searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : '';
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/properties?page=${page}&limit=${PAGE_SIZE}&${filterQuery}${searchParam}${showOnlyFavorites ? '&showOnlyFavorites=true' : ''}`, {
          headers: {
            'x-user-id': userId,
          },
        });
        const json = await res.json();
        if (!cancelled) {
          setProperties(json.data);
          setTotal(json.meta.total || 0);
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
  }, [page, filterQuery, searchQuery, userId, showOnlyFavorites]);

  const handleApply = (qs: string) => {
    setFilterQuery(qs);
    setPage(1);
    if (!qs) {
      setShowOnlyFavorites(false);
    }
    router.replace(`${window.location.pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  };

  const handleSearch = () => {
    setSearchQuery(searchInput);
    setPage(1);

    // Atualiza a URL com o novo parâmetro de busca
    const searchParams = new URLSearchParams(window.location.search);
    if (searchInput) {
      searchParams.set('q', searchInput);
    } else {
      searchParams.delete('q');
    }
    const newQueryString = searchParams.toString();
    router.replace(`${window.location.pathname}${newQueryString ? `?${newQueryString}` : ""}`, { scroll: false });
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Função para limpar todos os filtros
  const handleClearFilters = () => {
    if (!filterConfig) return;
    const defaults = getInitialSelections(filterConfig);
    const defaultQs = buildQueryString(defaults, filterConfig);
    setFilterQuery(defaultQs);
    setShowOnlyFavorites(false);
    setPage(1);
    setSearchInput("");
    setSearchQuery("");
    router.replace(`${window.location.pathname}${defaultQs ? `?${defaultQs}` : ""}`, { scroll: false });
  };

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
      const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/favorites`;
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

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    componentRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="w-full p-6 min-h-[80vh]" ref={componentRef}>
      <div className="bg-white mb-6">
        <FilterBar onApply={handleApply} onClear={handleClearFilters} initialQueryString={filterQuery} />
      </div>

      {/* Campo de busca */}
      <div className="max-w-2xl mx-auto mb-6">
        <div className="relative">
          <Input
            type="text"
            placeholder="Buscar por endereço do imóvel..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          />
          <button
            onClick={handleSearch}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
            title="Buscar"
          >
            <FaSearch className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4 px-2">
        <div className="text-sm text-gray-700 font-semibold">
          {total} {total === 1 ? 'imóvel' : 'imóveis'} encontrado{total === 1 ? '' : 's'}
        </div>
        <button
          onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${showOnlyFavorites
            ? 'bg-red-100 text-red-600 hover:bg-red-200'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill={showOnlyFavorites ? 'currentColor' : 'none'}
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
          </svg>
          {showOnlyFavorites ? 'Mostrar todos' : 'Apenas favoritos'}
        </button>
      </div>
      {totalPages > 1 && (
        <div className="flex justify-center mt-12">
          <Pagination
            showControls={true}
            loop={true}
            siblings={2}
            page={page}
            total={totalPages}
            onChange={handlePageChange}
          />
        </div>
      )}
      <div className="relative w-full">
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <Spinner size="lg" />
          </div>
        )}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {properties.map((item: Property) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
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
                  {/* Tipo do imóvel e tipo do leilão */}
                  <div className="absolute z-[1] left-1.5 top-1.5 flex flex-col gap-1">
                    {item.type && (
                      <div className="px-2 py-1 bg-primary/90 text-white text-xs font-semibold rounded-md">
                        {item.type}
                      </div>
                    )}
                    {item.saleType && (
                      <div className="px-2 py-1 bg-secondary/90 text-white text-xs font-semibold rounded-md">
                        {item.saleType}
                      </div>
                    )}
                    {/* Selo Novo abaixo do saleType */}
                    {item.createdAt && (() => {
                      const createdAtDate = new Date(item.createdAt);
                      const now = new Date();
                      now.setHours(0, 0, 0, 0);
                      const twoDaysAgo = new Date(now);
                      twoDaysAgo.setDate(now.getDate() - 2);
                      if (createdAtDate >= twoDaysAgo) {
                        return (
                          <div className="mt-1">
                            <span className="px-2 py-1 bg-green-600 text-white text-xs font-bold rounded-md shadow">
                              Novo
                            </span>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
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

                  {item.photos && item.photos.length > 0 ? (
                    <PhotoCarousel photos={item.photos} propertyName={item.propertyName} />
                  ) : (
                    <img src={"/images/property-not-available.png"} alt="Foto do imóvel não disponível" className="object-cover w-full h-full" />
                  )}
                </div>
                <div className="flex-1 flex flex-col gap-2 p-4">
                  {/* Nome do imóvel */}
                  {item.propertyName && (
                    <a
                      href={`https://www.google.com/search?q=${encodeURIComponent(
                        `${item.propertyName} ${item.city || ''}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-base font-semibold text-gray-800 mb-1 truncate hover:text-primary transition-colors"
                      title={`Buscar ${item.propertyName} ${item.city || ''} no Google`}
                    >
                      {item.propertyName}
                    </a>
                  )}

                  {/* Formas de pagamento */}
                  {item.paymentConditions && item.paymentConditions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {item.paymentConditions.map((condition, index) => (
                        <span
                          key={index}
                          className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
                        >
                          {condition}
                        </span>
                      ))}
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <div className="text-xs text-gray-500 font-semibold mb-1">Primeiro Leilão</div>
                      <div className="flex flex-wrap items-baseline gap-1 sm:gap-2">
                        <span className={firstPassed ? "text-gray-400 line-through text-sm font-bold" : "text-primary text-base font-bold"}>
                          {formatCurrency(item.firstSalePrice)}
                        </span>
                        {item.firstSaleDiscountPercent !== undefined && (
                          <span className="text-green-600 text-xs font-semibold bg-green-100 rounded px-2 py-0.5">
                            {formatPercent(Number(item.firstSaleDiscountPercent) / 100)}
                          </span>
                        )}
                      </div>

                      {item.firstSaleDate && (
                        <div className="text-xs text-gray-500 mt-1">
                          Data: {item.firstSaleDate ? new Date(item.firstSaleDate).toLocaleDateString("pt-BR") : "-"}
                        </div>
                      )}
                    </div>

                    {/* Segundo Leilão */}
                    {item.secondSalePrice && (
                      <div className="flex flex-col">
                        <div className="text-xs text-gray-500 font-semibold mb-1">Segundo Leilão</div>
                        <div className="flex flex-wrap items-baseline gap-1 sm:gap-2">
                          <span className={secondPassed ? "text-gray-400 line-through text-sm font-bold" : "text-primary text-base font-bold"}>
                            {formatCurrency(item.secondSalePrice)}
                          </span>
                          {item.secondSaleDiscountPercent !== undefined && (
                            <span className="text-green-600 text-xs font-semibold bg-green-100 rounded px-2 py-0.5">
                              {formatPercent(Number(item.secondSaleDiscountPercent) / 100)}
                            </span>
                          )}
                        </div>

                        {item.secondSaleDate && (
                          <div className="text-xs text-gray-500 mt-1">
                            Data: {item.secondSaleDate ? new Date(item.secondSaleDate).toLocaleDateString("pt-BR") : "-"}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="border-t border-gray-200 my-0" />

                  {/* Características do Imóvel */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                    {item?.privateArea !== undefined && item.privateArea > 0 && (
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <FaRuler className="w-3.5 h-3.5" />
                        <span>{item.privateArea}m²</span>
                      </div>
                    )}
                    {item?.landArea !== undefined && item.landArea > 0 && (
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <FaMapMarkerAlt className="w-3.5 h-3.5" />
                        <span>{item.landArea}m²</span>
                      </div>
                    )}
                    {item?.rooms !== undefined && item.rooms > 0 && (
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <FaHome className="w-3.5 h-3.5" />
                        <span>{item.rooms} quartos</span>
                      </div>
                    )}
                    {item?.garageSpaces !== undefined && item.garageSpaces > 0 && (
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <FaCar className="w-3.5 h-3.5" />
                        <span>{item.garageSpaces} vagas</span>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-gray-200 my-0" />

                  {/* Localização */}


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

                  {(item.neighborhood || item.city || item.state) && (
                    <div className="flex items-center gap-1 mt-2">
                      <span className="text-xs text-gray-400">📍</span>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          [item.neighborhood, item.city, item.state].filter(Boolean).join(', ')
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-gray-500 mt-1 font-semibold underline hover:text-primary transition-colors"
                        title="Buscar no Google Maps"
                      >
                        {[
                          item.neighborhood,
                          item.city,
                          item.state
                        ].filter(Boolean).join(' - ')}
                      </a>
                    </div>
                  )}

                  <div className="border-t border-gray-200 my-0" />

                  {/* Regras de despesas */}
                  {item.expensePaymentRules && item.expensePaymentRules.length > 0 && (
                    <div className="flex flex-col gap-1 mt-2">
                      <span className="text-xs text-gray-500 font-semibold">Regras de despesas:</span>
                      <div className="flex flex-col gap-1">
                        {item.expensePaymentRules.map((rule, index) => (
                          <div key={index} className="text-xs text-gray-600 flex items-start gap-1">
                            <span className="text-gray-400 font-semibold">•</span>
                            <span>{rule}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Observações importantes */}
                  {item.importantObservations && item.importantObservations.length > 0 && (
                    <div className="flex flex-col gap-1 mt-2">
                      <span className="text-xs font-semibold text-red-600">Observações importantes:</span>
                      <div className="flex flex-col gap-1">
                        {item.importantObservations.map((observation, index) => (
                          <div key={index} className="text-xs text-red-600 flex items-start gap-1">
                            <span className="text-red-400 font-semibold">•</span>
                            <span>{observation}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Links */}
                  <div className="border-t border-gray-200 my-0" />

                  <div className="flex flex-col gap-1 mt-2">

                    {item.propertyLink && (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-500 font-semibold">Comitente:</span>
                        <a
                          href={item.propertyLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary underline text-xs font-semibold hover:text-primary/80 transition-colors"
                        >
                          Ver imóvel
                        </a>
                      </div>
                    )}

                    {item.auctioneerName && (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-500">Leiloeiro:</span>
                        <a
                          href={item.auctionLink?.toLowerCase().startsWith('http') ? item.auctionLink?.toLowerCase() : item.auctionLink?.toLowerCase()?.replace("www.", "https://")}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary underline text-xs font-semibold hover:text-primary/80 transition-colors"
                        >
                          {item.auctioneerName}
                        </a>
                      </div>
                    )}

                    {/* Datas de criação e atualização */}
                    <div className="flex flex-row gap-2 mt-1">
                      {item.createdAt && (
                        <span className="text-[10px] text-gray-400">
                          Criado: {new Date(item.createdAt).toLocaleDateString("pt-BR")}
                        </span>
                      )}
                      {item.updatedAt && (
                        <span className="text-[10px] text-gray-400">
                          Atualizado: {new Date(item.updatedAt).toLocaleDateString("pt-BR")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
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
            onChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
}
