import Breadcrumb from "@/components/Common/Breadcrumb";
import type { Metadata } from "next";
import PropertySearchMapDynamic from "./PropertySearchMapDynamic";

export const metadata: Metadata = {
  title: "Busca no mapa | Imóveis de leilão",
  description: "Explore imóveis de leilão no mapa com listagem sincronizada (MVP).",
};

export default function PropertySearchMapPage() {
  return (
    <section className="min-h-screen bg-slate-50">
      <div className="px-4 pt-4 sm:px-6 lg:px-8">
        <Breadcrumb pageName="Busca no mapa" />
      </div>
      <PropertySearchMapDynamic />
    </section>
  );
}
