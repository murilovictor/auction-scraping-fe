"use client";

import { useJsApiLoader } from "@react-google-maps/api";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useDebounce } from "@/hooks/useDebounce";
import { useDebouncedCallback } from "@/hooks/useDebouncedCallback";
import { useMapListSync } from "@/hooks/useMapListSync";
import { fetchPropertyFiltersConfig } from "@/services/propertyFiltersConfigService";
import { fetchMapProperties, setPropertyFavorite } from "@/services/propertyMapSearchService";
import { extractMapFilterSelects } from "@/types/property-filters-config";
import type { PropertyFiltersConfig } from "@/types/property-filters-config";
import type {
  LatLngLiteral,
  MapBoundsLiteral,
  PropertyMapSearchItem,
  QuickFiltersState,
  SearchInAreaPayload,
  ViewMode,
} from "@/types/property-map-search";
import MapControls from "./MapControls";
import PropertyList from "./PropertyList";
import PropertyMap from "./PropertyMap";
import { spreadOverlappingPins } from "./spreadOverlappingPins";
import PropertyMapPreview from "./PropertyMapPreview";
import SearchHeader from "./SearchHeader";

const defaultQuick: QuickFiltersState = {
  precoMin: "",
  precoMax: "",
  tipo: "",
  descontoMin: "",
  formaPagamento: "",
  modalidade: "",
  tipoLeilao: "",
};

function boundsKey(b: MapBoundsLiteral) {
  return [b.north, b.south, b.east, b.west].map((x) => x.toFixed(5)).join("|");
}

export default function PropertySearchMapShell() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  const { data: session } = useSession();
  const userId = (session?.user as { id?: string } | undefined)?.id ?? "anon";

  const { isLoaded, loadError } = useJsApiLoader({
    id: "property-search-google-maps",
    googleMapsApiKey: apiKey,
    libraries: ["geometry"],
  });

  const [listItems, setListItems] = useState<PropertyMapSearchItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loadingList, setLoadingList] = useState(true);
  /** Bounds ativos para refetch (filtros / busca); não dispara re-render. */
  const queryBoundsRef = useRef<MapBoundsLiteral | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [quickFilters, setQuickFilters] = useState<QuickFiltersState>(defaultQuick);
  const debouncedQuick = useDebounce(quickFilters, 280);
  const [filterConfig, setFilterConfig] = useState<PropertyFiltersConfig | null>(null);
  const [filtersLoading, setFiltersLoading] = useState(true);

  const mapFilterSelects = useMemo(() => extractMapFilterSelects(filterConfig), [filterConfig]);
  const saleTypeQueryKey = mapFilterSelects.saleTypeFilter?.queryKey ?? null;

  useEffect(() => {
    let cancelled = false;
    setFiltersLoading(true);
    void fetchPropertyFiltersConfig()
      .then((data) => {
        if (!cancelled) setFilterConfig(data);
      })
      .catch(() => {
        if (!cancelled) {
          toast.error("Não foi possível carregar os filtros.");
          setFilterConfig(null);
        }
      })
      .finally(() => {
        if (!cancelled) setFiltersLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [searchText, setSearchText] = useState("");
  const [searchApplied, setSearchApplied] = useState("");

  const {
    highlightedId,
    setHighlightedId,
    selectedId,
    setSelectedId,
    registerCardRef,
    selectFromMap,
  } = useMapListSync();

  const lastSyncedBoundsKey = useRef<string | null>(null);
  const [showAreaButton, setShowAreaButton] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<SearchInAreaPayload | null>(
    null,
  );
  const [areaLoading, setAreaLoading] = useState(false);
  const [isAreaFiltered, setIsAreaFiltered] = useState(false);

  const loadList = useCallback(async () => {
    setLoadingList(true);
    try {
      const { items, total } = await fetchMapProperties({
        userId,
        quick: debouncedQuick,
        q: searchApplied,
        bounds: queryBoundsRef.current ?? undefined,
        saleTypeQueryKey,
      });
      setListItems(items);
      setTotalCount(total);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao buscar imóveis";
      toast.error(msg);
      setListItems([]);
      setTotalCount(0);
    } finally {
      setLoadingList(false);
    }
  }, [userId, debouncedQuick, searchApplied, reloadKey, saleTypeQueryKey]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  const onIdleDebounced = useCallback(
    (bounds: MapBoundsLiteral, center: LatLngLiteral, zoom: number) => {
      const key = boundsKey(bounds);
      if (lastSyncedBoundsKey.current === null) {
        lastSyncedBoundsKey.current = key;
        return;
      }
      if (key !== lastSyncedBoundsKey.current) {
        setPendingPayload({ bounds, center, zoom });
        setShowAreaButton(true);
      }
    },
    [],
  );

  const debouncedMapIdle = useDebouncedCallback(onIdleDebounced, 420);

  const handleSearchThisArea = async () => {
    if (!pendingPayload) return;
    setAreaLoading(true);
    try {
      const { items, total } = await fetchMapProperties({
        userId,
        quick: debouncedQuick,
        q: searchApplied,
        bounds: pendingPayload.bounds,
        saleTypeQueryKey,
      });
      setListItems(items);
      setTotalCount(total);
      queryBoundsRef.current = pendingPayload.bounds;
      setIsAreaFiltered(true);
      lastSyncedBoundsKey.current = boundsKey(pendingPayload.bounds);
      setShowAreaButton(false);
      toast.success(
        total === 1 ? "1 imóvel encontrado na área." : `${total} imóveis na área visível.`,
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao buscar na área";
      toast.error(msg);
    } finally {
      setAreaLoading(false);
    }
  };

  const handleRestoreAll = () => {
    queryBoundsRef.current = null;
    setIsAreaFiltered(false);
    setShowAreaButton(false);
    lastSyncedBoundsKey.current = null;
    setReloadKey((k) => k + 1);
  };

  const selectedProperty = useMemo(
    () => listItems.find((p) => p.id === selectedId) ?? null,
    [listItems, selectedId],
  );

  const handleToggleFavorite = useCallback(
    async (propertyId: string, currentlyFavorite: boolean) => {
      const next = !currentlyFavorite;
      try {
        await setPropertyFavorite(userId, propertyId, next);
        setListItems((prev) =>
          prev.map((p) => (p.id === propertyId ? { ...p, isFavorite: next } : p)),
        );
        toast.success(next ? "Salvo nos favoritos" : "Removido dos favoritos");
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Erro ao atualizar favoritos";
        toast.error(msg);
      }
    },
    [userId],
  );

  /** Pins no mesmo lat/lng são espalhados só no mapa para não parecer um único imóvel */
  const mapPins = useMemo(() => spreadOverlappingPins(listItems), [listItems]);

  const mapSection = (
    <div className="relative h-full min-h-[280px] w-full flex-1 lg:min-h-0">
      <PropertyMap
        isLoaded={isLoaded}
        properties={mapPins}
        highlightedPropertyId={highlightedId}
        selectedPropertyId={selectedId}
        onMarkerClick={selectFromMap}
        onMapIdle={debouncedMapIdle}
        className="h-full w-full min-h-[280px] rounded-none lg:min-h-0 lg:rounded-xl"
      />
      <MapControls
        showSearchArea={showAreaButton}
        areaLoading={areaLoading}
        onSearchThisArea={handleSearchThisArea}
      />
      {selectedProperty ? (
        <div className="pointer-events-none absolute bottom-24 left-1/2 z-[6] flex w-[calc(100%-1rem)] max-w-[23rem] -translate-x-1/2 justify-center">
          <PropertyMapPreview
            property={selectedProperty}
            isFavorite={!!selectedProperty.isFavorite}
            onToggleFavorite={() =>
              void handleToggleFavorite(selectedProperty.id, !!selectedProperty.isFavorite)
            }
            onClose={() => setSelectedId(null)}
            onViewDetails={() => toast("Abrir detalhes — ligar à rota do imóvel quando existir.")}
          />
        </div>
      ) : null}
    </div>
  );

  const listSection = (
    <PropertyList
      properties={listItems}
      loading={loadingList}
      highlightedId={highlightedId}
      selectedId={selectedId}
      registerCardRef={registerCardRef}
      onHoverCard={setHighlightedId}
      onSelectCard={selectFromMap}
      onToggleFavorite={handleToggleFavorite}
    />
  );

  if (loadError) {
    return (
      <div className="p-10 text-center text-red-600">
        Não foi possível carregar o Google Maps. Verifique a chave e as APIs
        habilitadas no Google Cloud.
      </div>
    );
  }

  if (!apiKey) {
    return (
      <div className="mx-auto max-w-lg p-10 text-center text-amber-900">
        <p className="text-sm">
          Configure{" "}
          <code className="rounded bg-amber-100 px-1.5 py-0.5 text-xs">
            NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
          </code>{" "}
          no arquivo <code className="rounded bg-amber-100 px-1.5 py-0.5 text-xs">.env</code>{" "}
          e reinicie o servidor de desenvolvimento.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <SearchHeader
        searchText={searchText}
        onSearchTextChange={setSearchText}
        onSearchSubmit={() => setSearchApplied(searchText)}
        quickFilters={quickFilters}
        onQuickFiltersChange={setQuickFilters}
        mapFilterSelects={mapFilterSelects}
        filtersLoading={filtersLoading}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      <div className="mx-auto flex max-w-[1920px] flex-col lg:h-[calc(100dvh-1px)] lg:min-h-0">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 bg-white/90 px-3 py-2 sm:px-4 lg:px-6">
          <p className="text-sm text-slate-700">
            <span className="font-semibold text-slate-900">{totalCount}</span>{" "}
            {totalCount === 1 ? "imóvel encontrado" : "imóveis encontrados"}
            {listItems.length < totalCount ? (
              <span className="text-slate-500"> — mostrando {listItems.length} com coordenadas nesta página</span>
            ) : null}
          </p>
          {isAreaFiltered ? (
            <button
              type="button"
              onClick={handleRestoreAll}
              className="text-xs font-semibold text-sky-700 underline-offset-2 hover:underline"
            >
              Restaurar mapa completo (Brasil)
            </button>
          ) : null}
        </div>

        {/* Desktop: lista + mapa sticky */}
        <div className="hidden min-h-0 flex-1 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(340px,44vw)] lg:gap-4 lg:px-4 lg:pb-4">
          <section className="min-h-0 overflow-y-auto overscroll-contain pr-1 pt-2">
            {listSection}
          </section>
          <aside className="sticky top-[8.5rem] h-[calc(100dvh-9rem)] min-h-[360px] self-start pt-2">
            {mapSection}
          </aside>
        </div>

        {viewMode === "list" ? (
          <div className="flex min-h-0 flex-1 flex-col lg:hidden">
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-28 pt-2">
              {listSection}
            </div>
          </div>
        ) : null}

        {viewMode === "list" ? (
          <button
            type="button"
            onClick={() => setViewMode("map")}
            className="fixed bottom-5 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-xl transition hover:bg-sky-700 lg:hidden"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            Ver mapa
          </button>
        ) : null}

        {viewMode === "map" ? (
          <div className="fixed inset-0 z-40 flex flex-col bg-white lg:hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2 shadow-sm">
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className="text-sm font-semibold text-sky-700"
              >
                ← Voltar à lista
              </button>
              <span className="text-xs font-medium text-slate-500">Mapa</span>
            </div>
            <div className="relative min-h-0 flex-1">{mapSection}</div>
            <div className="max-h-[44vh] shrink-0 overflow-y-auto border-t border-slate-200 bg-slate-50/95 p-2 shadow-[0_-10px_40px_rgba(15,23,42,0.12)]">
              <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Imóveis na região
              </p>
              <div className="flex max-h-[38vh] flex-col gap-2">{listSection}</div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
