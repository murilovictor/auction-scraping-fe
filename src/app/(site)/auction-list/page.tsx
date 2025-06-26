import Breadcrumb from "@/components/Common/Breadcrumb";
import ProtectedRoute from "@/components/Common/ProtectedRoute";
import { Metadata } from "next";
import AuctionList from "@/components/AuctionList";
import FilterBar from "@/components/FilterBar";

export const metadata: Metadata = {
  title: "Imóveis",
  description: "Imóveis disponíveis para venda",
};

const ProductAlertPage = () => {
  return (
    <ProtectedRoute>
      <Breadcrumb pageName="Imóveis" />
      <section id="property">
        <div className="w-full max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AuctionList />
        </div>
      </section>
    </ProtectedRoute>
  );
};

export default ProductAlertPage;
