import React from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ProductGrid from "@/components/products/ProductGrid";
import { products } from "@/lib/data/products";

export default function DealsPage() {
  const dealProducts = products.filter(p => p.mrp > p.price);

  return (
    <main className="min-h-screen bg-section-bg">
      <Header />
      
      {/* Category Header */}
      <section className="bg-dark-navy text-white py-12 md:py-24 border-b border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-blue/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col items-center text-center">
            <span className="text-accent-orange font-bold text-xs uppercase tracking-[0.4em] mb-4 bg-accent-orange/10 px-4 py-2 rounded-full">
              Limited Time Offers
            </span>
            <h1 className="text-4xl md:text-7xl font-display font-bold mb-6 italic">
              Flash <span className="text-brand-blue">Deals</span>
            </h1>
            <p className="text-gray-400 max-w-2xl text-lg md:text-xl font-medium">
              Don&apos;t wait for the price to drop—it already has. Grab your favorites at massive discounts before the timer runs out.
            </p>
          </div>
        </div>
      </section>

      {/* Grid Section */}
      <section className="py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ProductGrid initialProducts={dealProducts} title="Flash Deals" />
        </div>
      </section>

      <Footer />
    </main>
  );
}
