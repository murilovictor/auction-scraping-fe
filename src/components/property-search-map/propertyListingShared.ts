import type { PropertyMapSearchItem } from "@/types/property-map-search";

export const fmtMoney = (n: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(n);

export const fmtAreaM2 = (n: number) =>
  `${new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: Number.isInteger(n) ? 0 : 1,
  }).format(n)}\u202fm²`;

export const fmtAuctionDate = (iso: string | null | undefined) => {
  if (!iso?.trim()) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
};

export type AuctionRowsDisplay = {
  primeiroValor: number | null;
  segundoValor: number | null;
  descPrimeiro: number | null;
  descSegundo: number | null;
  dataPrimeiroFmt: string | null;
  dataSegundoFmt: string | null;
};

export function getAuctionRowsDisplay(p: PropertyMapSearchItem): AuctionRowsDisplay {
  const isLegacyCard =
    p.precoPrimeiroLeilao === undefined && p.precoSegundoLeilao === undefined;

  const hasExplicitFirst = (p.precoPrimeiroLeilao ?? 0) > 0;
  const hasExplicitSecond = (p.precoSegundoLeilao ?? 0) > 0;

  let primeiroValor: number | null;
  let segundoValor: number | null;
  if (isLegacyCard) {
    primeiroValor = p.preco > 0 ? p.preco : null;
    segundoValor = null;
  } else {
    primeiroValor = hasExplicitFirst ? p.precoPrimeiroLeilao! : null;
    segundoValor = hasExplicitSecond ? p.precoSegundoLeilao! : null;
  }

  const descPrimeiro =
    p.descontoPrimeiroLeilao != null && !Number.isNaN(p.descontoPrimeiroLeilao)
      ? p.descontoPrimeiroLeilao
      : isLegacyCard || !hasExplicitSecond
        ? p.desconto
        : null;

  const descSegundo =
    p.descontoSegundoLeilao != null && !Number.isNaN(p.descontoSegundoLeilao)
      ? p.descontoSegundoLeilao
      : null;

  return {
    primeiroValor,
    segundoValor,
    descPrimeiro,
    descSegundo,
    dataPrimeiroFmt: fmtAuctionDate(p.dataPrimeiroLeilao ?? undefined),
    dataSegundoFmt: fmtAuctionDate(p.dataSegundoLeilao ?? undefined),
  };
}

export function getAddressParts(p: PropertyMapSearchItem) {
  const street = (p.endereco ?? "").trim();
  const localityFields = [p.bairro, p.cidade, p.estado].filter(
    (x): x is string => typeof x === "string" && x.trim().length > 0,
  );
  const localityForMaps = localityFields.join(", ");
  const localityDisplay = localityFields.join(" - ");
  return { street, localityForMaps, localityDisplay };
}

export function hasPropertySpecs(p: PropertyMapSearchItem): boolean {
  return (
    (p.privateArea != null && p.privateArea > 0) ||
    (p.rooms != null && p.rooms > 0) ||
    (p.garageSpaces != null && p.garageSpaces > 0)
  );
}
