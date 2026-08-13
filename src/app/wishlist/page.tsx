"use client";

import React from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useWishlist } from "@/lib/context/WishlistContext";
import ProductCard from "@/components/products/ProductCard";
import { Heart, ArrowLeft, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";

export default function WishlistPage() {
  const { items } = useWishlist();

  return (
    <main className="min-h-screen bg-section-bg">
      <Header />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
          <div>
            <Link href="/" className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-brand-blue transition-colors mb-4">
              <ArrowLeft size={16} /> Back to Shopping
            </Link>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-dark-navy">
              My <span className="text-brand-blue">Wishlist</span>
            </h1>
            <p className="text-gray-400 mt-2 font-medium">Keep track of the products you love.</p>
          </div>
          
          <div className="flex items-center gap-4 bg-white px-6 py-4 rounded-3xl border border-gray-100 shadow-sm">
            <Heart className="text-red-500" fill="currentColor" size={24} />
            <span className="text-lg font-black text-dark-navy">{items.length} Items</span>
          </div>
        </div>

        {items.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 bg-white rounded-[4rem] premium-shadow border border-gray-100 text-center"
          >
            <div className="w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-8">
              <Heart size={48} />
            </div>
            <h2 className="text-2xl md:text-3xl font-display font-bold text-dark-navy mb-4">Your Wishlist is Empty</h2>
            <p className="text-gray-400 max-w-md mb-10 text-lg leading-relaxed">
              Don&apos;t let your favorite items slip away! Browse our collections and add products to your wishlist.
            </p>
            <Link 
              href="/"
              className="bg-brand-blue text-white px-10 py-4 rounded-2xl font-black flex items-center gap-2 hover:bg-brand-blue/90 transition-all shadow-lg shadow-brand-blue/20"
            >
              Start Exploring <ShoppingBag size={20} />
            </Link>
          </motion.div>
        )}
      </section>

      <Footer />
    </main>
  );
}
