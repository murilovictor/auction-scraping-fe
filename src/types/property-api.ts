/**
 * Formato retornado por GET /api/properties (mesmo contrato do AuctionList + geo).
 */

export type PropertyApi = {
  id: string | number;
  photo?: string;
  photos?: string[];
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
  latitude?: number;
  longitude?: number;
};

export type PropertiesListMeta = {
  total: number;
};

export type PropertiesListResponse = {
  data: PropertyApi[];
  meta: PropertiesListMeta;
};
