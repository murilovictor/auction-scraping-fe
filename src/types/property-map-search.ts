/**
 * Tipos do MVP mapa + lista (evolução futura: bounds MongoDB, paginação).
 */

export type PropertyMapSearchItem = {
  id: string;
  latitude: number;
  longitude: number;
  titulo: string;
  /** Logradouro / endereço (campo `address` da API) */
  endereco: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  preco: number;
  /** Percentual 0–100 ou null se sem desconto destacado (badge / pin; costuma refletir o 1º ou 2º leilão) */
  desconto: number | null;
  /** Valores e metadados por leilão (preenchido a partir da API; mocks podem omitir) */
  precoPrimeiroLeilao?: number | null;
  precoSegundoLeilao?: number | null;
  dataPrimeiroLeilao?: string | null;
  dataSegundoLeilao?: string | null;
  descontoPrimeiroLeilao?: number | null;
  descontoSegundoLeilao?: number | null;
  thumbnail: string;
  tipo: string;
  aceitaFinanciamento: boolean;
  /** Condições de pagamento vindas da API (`paymentConditions`), para filtros no mapa */
  condicoesPagamento?: string[];
  /** Modalidade (ex.: judicial / extrajudicial), se a API enviar */
  modalidade?: string;
  /** Tipo de leilão / venda (`saleType` na API) */
  saleType?: string;
  valorAvaliacao: number;
  /** Área privativa (m²), quartos e vagas — da API quando existir */
  privateArea?: number;
  rooms?: number;
  garageSpaces?: number;
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
  /** Valor enviado em `paymentConditions` (string da API / filters) */
  formaPagamento: string;
  /** Valor enviado em `modality` */
  modalidade: string;
  /** Valor enviado na query com a chave definida no config (ex.: `saleType`) */
  tipoLeilao: string;
};

export type SearchInAreaPayload = {
  bounds: MapBoundsLiteral;
  /** viewport center/zoom opcional para API futura */
  center: LatLngLiteral;
  zoom: number;
};
