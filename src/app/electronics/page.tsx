import React from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ProductGrid from "@/components/products/ProductGrid";
import { products } from "@/lib/data/products";

export default function ElectronicsPage() {
  const electronicsProducts = products.filter(p => p.category === "electronics");

  return (
    <main className="min-h-screen bg-section-bg">
      <Header />
      
      {/* Category Header */}
      <section className="bg-white py-12 md:py-20 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center">
            <span className="text-brand-blue font-bold text-xs uppercase tracking-[0.3em] mb-4">
              Future Tech
            </span>
            <h1 className="text-4xl md:text-6xl font-display font-bold text-dark-navy mb-6">
              Modern <span className="text-brand-blue">Electronics</span>
            </h1>
            <p className="text-gray-500 max-w-2xl text-lg">
              Stay ahead of the curve with our selection of top-tier laptops, audio gear, and essential tech accessories.
            </p>
          </div>
        </div>
      </section>

      {/* Grid Section */}
      <section className="py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ProductGrid initialProducts={electronicsProducts} title="Electronics" />
        </div>
      </section>

      <Footer />
    </main>
  );
}
