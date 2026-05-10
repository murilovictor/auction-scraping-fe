"use client";

import dynamic from "next/dynamic";

const PropertySearchMapShell = dynamic(
  () => import("@/components/property-search-map/PropertySearchMapShell"),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[50vh] items-center justify-center text-slate-500">
        Carregando experiência de mapa…
      </div>
    ),
  },
);

export default function PropertySearchMapDynamic() {
  return <PropertySearchMapShell />;
}
