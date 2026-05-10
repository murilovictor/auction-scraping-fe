import type { PropertyMapSearchItem } from "@/types/property-map-search";

/** Precisão para considerar “mesmo ponto” (endereço/coord iguais da API). */
const KEY_DECIMALS = 6;

function coordKey(p: Pick<PropertyMapSearchItem, "latitude" | "longitude">) {
  return `${p.latitude.toFixed(KEY_DECIMALS)},${p.longitude.toFixed(KEY_DECIMALS)}`;
}

/**
 * Vários imóveis com a mesma coordenada ficam empilhados e parece só 1 pin.
 * Gera cópias com pequeno deslocamento em círculo só para render no mapa (lista e API intactas).
 */
export function spreadOverlappingPins(items: PropertyMapSearchItem[]): PropertyMapSearchItem[] {
  const buckets = new Map<string, PropertyMapSearchItem[]>();
  for (const p of items) {
    const k = coordKey(p);
    const arr = buckets.get(k) ?? [];
    arr.push(p);
    buckets.set(k, arr);
  }

  const out: PropertyMapSearchItem[] = [];

  for (const group of Array.from(buckets.values())) {
    if (group.length <= 1) {
      out.push(group[0]);
      continue;
    }

    const baseLat = group[0].latitude;
    const baseLng = group[0].longitude;
    const n = group.length;
    /** Raio em metros — cresce um pouco com quantidade de sobreposição */
    const radiusM = 10 + n * 3;
    const radiusLat = radiusM / 111_320;
    const cosLat = Math.cos((baseLat * Math.PI) / 180);
    const radiusLng = cosLat > 0.01 ? radiusM / (111_320 * cosLat) : radiusM / 111_320;

    group.forEach((p, i) => {
      const angle = (2 * Math.PI * i) / n - Math.PI / 2;
      out.push({
        ...p,
        latitude: baseLat + radiusLat * Math.cos(angle),
        longitude: baseLng + radiusLng * Math.sin(angle),
      });
    });
  }

  return out;
}
