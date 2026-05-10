/**
 * Tipos do MVP mapa + lista (evolução futura: bounds MongoDB, paginação).
 */

export type PropertyMapSearchItem = {
  id: string;
  latitude: number;
  longitude: number;
  titulo: string;
  endereco: string;
  preco: number;
  /** Percentual 0–100 ou null se sem desconto destacado */
  desconto: number | null;
  thumbnail: string;
  tipo: string;
  aceitaFinanciamento: boolean;
  valorAvaliacao: number;
  desocupado?: boolean;
  oportunidade?: boolean;
  /** URL externa do lote (mesmo campo `propertyLink` da API). */
  propertyLink?: string;
  /** Favorito do usuário logado (GET /api/properties + toggle via /api/favorites). */
  isFavorite?: boolean;
};

export type LatLngLiteral = { lat: number; lng: number };

export type MapBoundsLiteral = {
  north: number;
  south: number;
  east: number;
  west: number;
};

export type ViewMode = "list" | "map";

export type QuickFiltersState = {
  precoMin: string;
  precoMax: string;
  tipo: string;
  descontoMin: string;
  aceitaFinanciamento: string;
};

export type SearchInAreaPayload = {
  bounds: MapBoundsLiteral;
  /** viewport center/zoom opcional para API futura */
  center: LatLngLiteral;
  zoom: number;
};
