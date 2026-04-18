"use client";

import React from "react";
import Link from "next/link";
import { products } from "@/lib/data/products";
import ProductCard from "@/components/products/ProductCard";
import { ArrowRight } from "lucide-react";

const TrendingProducts = () => {
  const trendingItems = products.filter((p) => p.isTrending).slice(0, 8);

  return (
    <section className="py-20 bg-section-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
          <div>
            <span className="text-brand-blue font-bold text-xs uppercase tracking-widest bg-brand-blue/10 px-4 py-1.5 rounded-full mb-3 inline-block">
              Top Picks
            </span>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-dark-navy mb-2">
              Trending Products
            </h2>
            <p className="text-gray-500">The most loved items by our customers this week.</p>
          </div>
          <Link href="/shop" className="group text-dark-navy font-bold flex items-center gap-2 bg-white px-6 py-3 rounded-2xl shadow-sm hover:shadow-md transition-all">
            See All Trending <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
          {trendingItems.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrendingProducts;
