import React from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ProductGrid from "@/components/products/ProductGrid";
import { products } from "@/lib/data/products";

export default function WatchesPage() {
  const watchProducts = products.filter(p => p.category === "watches");

  return (
    <main className="min-h-screen bg-section-bg">
      <Header />
      
      {/* Category Header */}
      <section className="bg-white py-12 md:py-20 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center">
            <span className="text-brand-blue font-bold text-xs uppercase tracking-[0.3em] mb-4">
              Timeless Elegance
            </span>
            <h1 className="text-4xl md:text-6xl font-display font-bold text-dark-navy mb-6">
              Luxury <span className="text-brand-blue">Watches</span>
            </h1>
            <p className="text-gray-500 max-w-2xl text-lg">
              Precision meets luxury. Explore our range of analog, chronographs, and high-tech smartwatches designed for the modern individual.
            </p>
          </div>
        </div>
      </section>

      {/* Grid Section */}
      <section className="py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ProductGrid initialProducts={watchProducts} title="Watches" />
        </div>
      </section>

      <Footer />
    </main>
  );
}
