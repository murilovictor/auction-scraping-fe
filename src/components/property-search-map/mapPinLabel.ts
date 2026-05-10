import type { MapBoundsLiteral, PropertyMapSearchItem } from "@/types/property-map-search";

export function formatPinLabel(p: PropertyMapSearchItem): string {
  if (p.desconto != null && p.desconto >= 10) {
    return `${Math.round(p.desconto)}%`;
  }
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
    notation: "compact",
  }).format(p.preco);
}

export function serializeBounds(b: google.maps.LatLngBounds): string {
  const ne = b.getNorthEast();
  const sw = b.getSouthWest();
  return [ne.lat(), ne.lng(), sw.lat(), sw.lng()].map((x) => x.toFixed(5)).join("|");
}

export function boundsToLiteral(b: google.maps.LatLngBounds): MapBoundsLiteral {
  const ne = b.getNorthEast();
  const sw = b.getSouthWest();
  return {
    north: ne.lat(),
    east: ne.lng(),
    south: sw.lat(),
    west: sw.lng(),
  };
}
