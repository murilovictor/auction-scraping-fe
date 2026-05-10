"use client";

import { GoogleMap } from "@react-google-maps/api";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  LatLngLiteral,
  MapBoundsLiteral,
  PropertyMapSearchItem,
} from "@/types/property-map-search";
import { createAuctionClusterRenderer } from "./ClusterMarker";
import { boundsToLiteral, formatPinLabel } from "./mapPinLabel";

export const BRAZIL_CENTER: LatLngLiteral = { lat: -14.235, lng: -51.9253 };
export const DEFAULT_ZOOM = 5;

function pillIcon(label: string, active: boolean, isFavorite: boolean): google.maps.Icon {
  let fill: string;
  if (active) {
    fill = "#0ea5e9";
  } else if (isFavorite) {
    fill = "#e11d48";
  } else {
    fill = "#1864F5";
  }
  const safe = label.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="34" viewBox="0 0 80 34">
    <rect width="80" height="34" rx="17" fill="${fill}"/>
    <text x="40" y="17" fill="#fff" font-size="11" font-family="system-ui,sans-serif" text-anchor="middle" dominant-baseline="central">${safe}</text>
  </svg>`;
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(80, 34),
    anchor: new google.maps.Point(40, 34),
  };
}

export type PropertyMapProps = {
  isLoaded: boolean;
  properties: PropertyMapSearchItem[];
  highlightedPropertyId: string | null;
  selectedPropertyId: string | null;
  onMarkerClick: (id: string) => void;
  onMapIdle: (bounds: MapBoundsLiteral, center: LatLngLiteral, zoom: number) => void;
  onMapReady?: (map: google.maps.Map) => void;
  className?: string;
};

function PropertyMapInner({
  isLoaded,
  properties,
  highlightedPropertyId,
  selectedPropertyId,
  onMarkerClick,
  onMapIdle,
  onMapReady,
  className,
}: PropertyMapProps) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const markersByIdRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const propertiesRef = useRef(properties);
  const onMarkerClickRef = useRef(onMarkerClick);
  const highlightedIdRef = useRef(highlightedPropertyId);
  const selectedIdRef = useRef(selectedPropertyId);
  const listenersRef = useRef<google.maps.MapsEventListener[]>([]);

  propertiesRef.current = properties;
  onMarkerClickRef.current = onMarkerClick;
  highlightedIdRef.current = highlightedPropertyId;
  selectedIdRef.current = selectedPropertyId;

  const positionsKey = useMemo(
    () => properties.map((p) => `${p.id}:${p.latitude}:${p.longitude}`).join("|"),
    [properties],
  );

  const favoriteKey = useMemo(
    () => properties.map((p) => `${p.id}:${p.isFavorite ? 1 : 0}`).join("|"),
    [properties],
  );

  const onLoad = useCallback(
    (m: google.maps.Map) => {
      mapRef.current = m;
      setMap(m);
      onMapReady?.(m);
    },
    [onMapReady],
  );

  const onUnmount = useCallback(() => {
    clustererRef.current?.setMap(null);
    clustererRef.current = null;
    markersRef.current.forEach((x) => x.setMap(null));
    markersRef.current = [];
    markersByIdRef.current.clear();
    listenersRef.current.forEach((l) => l.remove());
    listenersRef.current = [];
    mapRef.current = null;
    setMap(null);
  }, []);

  useEffect(() => {
    if (!isLoaded || !map || !window.google?.maps) return;

    clustererRef.current?.setMap(null);
    clustererRef.current = null;
    markersRef.current.forEach((x) => x.setMap(null));
    markersRef.current = [];
    listenersRef.current.forEach((l) => l.remove());
    listenersRef.current = [];
    markersByIdRef.current.clear();

    const markers: google.maps.Marker[] = [];
    const latest = propertiesRef.current;

    for (const p of latest) {
      const active =
        p.id === selectedIdRef.current || p.id === highlightedIdRef.current;
      const marker = new google.maps.Marker({
        position: { lat: p.latitude, lng: p.longitude },
        icon: pillIcon(formatPinLabel(p), active, !!p.isFavorite),
      });
      const sub = marker.addListener("click", () => onMarkerClickRef.current(p.id));
      listenersRef.current.push(sub);
      markers.push(marker);
      markersByIdRef.current.set(p.id, marker);
    }

    markersRef.current = markers;
    clustererRef.current = new MarkerClusterer({
      map,
      markers,
      renderer: createAuctionClusterRenderer(),
    });

    return () => {
      clustererRef.current?.setMap(null);
      clustererRef.current = null;
      markers.forEach((x) => x.setMap(null));
      listenersRef.current.forEach((l) => l.remove());
      listenersRef.current = [];
      markersRef.current = [];
      markersByIdRef.current.clear();
    };
  }, [isLoaded, map, positionsKey]);

  /** Troca ícone no hover/seleção ou quando favorito muda — sem recriar markers. */
  useEffect(() => {
    if (!map || markersByIdRef.current.size === 0) return;
    const props = propertiesRef.current;
    for (const p of props) {
      const marker = markersByIdRef.current.get(p.id);
      if (!marker) continue;
      const active =
        p.id === selectedPropertyId || p.id === highlightedPropertyId;
      marker.setIcon(pillIcon(formatPinLabel(p), active, !!p.isFavorite));
    }
  }, [map, highlightedPropertyId, selectedPropertyId, favoriteKey]);

  const handleIdle = useCallback(() => {
    const m = mapRef.current;
    if (!m) return;
    const b = m.getBounds();
    if (!b) return;
    const c = m.getCenter();
    if (!c) return;
    const literal = boundsToLiteral(b);
    onMapIdle(literal, { lat: c.lat(), lng: c.lng() }, m.getZoom() ?? DEFAULT_ZOOM);
  }, [onMapIdle]);

  if (!isLoaded) {
    return (
      <div
        className={`flex animate-pulse items-center justify-center rounded-xl bg-slate-100 text-slate-400 ${className ?? ""}`}
      >
        Carregando mapa…
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerClassName={className ?? "h-full w-full min-h-[280px] rounded-xl"}
      center={BRAZIL_CENTER}
      zoom={DEFAULT_ZOOM}
      onLoad={onLoad}
      onUnmount={onUnmount}
      onIdle={handleIdle}
      options={{
        fullscreenControl: false,
        streetViewControl: false,
        mapTypeControl: false,
        gestureHandling: "greedy",
        disableDefaultUI: false,
        zoomControl: true,
      }}
    />
  );
}

export default memo(PropertyMapInner);
