"use client";

import React, { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { products } from "@/lib/data/products";
import { formatCurrency, calculateDiscount } from "@/lib/utils/format";
import { useCart } from "@/lib/context/CartContext";
import { useWishlist } from "@/lib/context/WishlistContext";
import { Star, Truck, ShieldCheck, Heart, ShoppingCart, ArrowLeft, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import ProductCard from "@/components/products/ProductCard";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { dispatch } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [quantity, setQuantity] = useState(1);

  const product = useMemo(() => 
    products.find(p => p.id === params.id), 
    [params.id]
  );

  const relatedProducts = useMemo(() => 
    products.filter(p => p.category === product?.category && p.id !== product?.id).slice(0, 4),
    [product]
  );

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
        <button onClick={() => router.back()} className="text-brand-blue font-bold">Go Back</button>
      </div>
    );
  }

  const discount = calculateDiscount(product.price, product.mrp);

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      dispatch({ type: "ADD_TO_CART", product });
    }
  };

  const handleBuyNow = () => {
    handleAddToCart();
    router.push("/cart");
  };

  return (
    <main className="min-h-screen bg-white">
      <Header />

      {/* Navigation Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-dark-navy transition-colors mb-4"
        >
          <ArrowLeft size={16} /> Back to Results
        </button>
      </div>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 xl:gap-20">
          
          {/* LEFT: Image Gallery */}
          <div className="lg:col-span-7 space-y-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="aspect-square bg-section-bg rounded-[3rem] overflow-hidden border border-gray-100 premium-shadow group"
            >
              <img 
                src={product.image} 
                alt={product.name} 
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
              />
            </motion.div>
            {/* Mock Thumbnail strip */}
            <div className="flex gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className={`w-24 h-24 rounded-2xl border-2 overflow-hidden cursor-pointer ${i === 0 ? "border-brand-blue" : "border-gray-100 opacity-60 hover:opacity-100"}`}>
                  <img src={product.image} alt="preview" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: Content Area */}
          <div className="lg:col-span-5 space-y-8">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-brand-blue font-black text-xs uppercase tracking-widest bg-brand-blue/10 px-4 py-1.5 rounded-full">
                  {product.category}
                </span>
                <div className="flex items-center gap-1.5 text-sm font-bold text-yellow-500">
                  <Star size={18} fill="currentColor" />
                  <span>{product.rating}</span>
                  <span className="text-gray-300 font-medium">({product.reviews} verified reviews)</span>
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-display font-bold text-dark-navy mb-4 leading-tight">
                {product.name}
              </h1>
              <p className="text-gray-500 text-lg leading-relaxed mb-6">
                {product.description}
              </p>
            </div>

            {/* Price section */}
            <div className="p-8 bg-section-bg rounded-[2.5rem] border border-gray-100">
              <div className="flex flex-col gap-2 mb-8">
                <div className="flex items-center gap-4">
                  <span className="text-5xl font-black text-dark-navy">{formatCurrency(product.price)}</span>
                  {discount > 0 && (
                    <span className="bg-accent-orange text-white text-xs font-black px-3 py-1 rounded-full">
                      SAVE {discount}%
                    </span>
                  )}
                </div>
                {product.mrp > product.price && (
                  <span className="text-lg text-gray-400 font-medium italic">
                    MRP: <span className="line-through">{formatCurrency(product.mrp)}</span> (Inclusive of all taxes)
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4 mb-4">
                  <span className="font-bold text-dark-navy">Quantity:</span>
                  <div className="flex items-center bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <button onClick={() => setQuantity(q => Math.max(1, q-1))} className="px-4 py-2 hover:bg-gray-50">-</button>
                    <span className="px-6 py-2 font-bold border-x border-gray-100">{quantity}</span>
                    <button onClick={() => setQuantity(q => q+1)} className="px-4 py-2 hover:bg-gray-50">+</button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={handleAddToCart}
                    className="flex items-center justify-center gap-2 bg-dark-navy text-white font-bold py-5 rounded-2xl hover:bg-dark-navy/90 transition-all"
                  >
                    <ShoppingCart size={20} /> Add to Cart
                  </button>
                  <button 
                    onClick={handleBuyNow}
                    className="flex items-center justify-center gap-2 bg-brand-blue text-white font-bold py-5 rounded-2xl hover:bg-brand-blue/90 transition-all shadow-lg shadow-brand-blue/20"
                  >
                    Buy Now
                  </button>
                </div>
                
                <button 
                  onClick={() => toggleWishlist(product)}
                  className={`flex items-center justify-center gap-2 font-bold py-4 rounded-2xl transition-all border ${
                    isInWishlist(product.id) 
                      ? "bg-red-50 border-red-100 text-red-500" 
                      : "bg-white border-gray-100 text-dark-navy hover:bg-gray-50"
                  }`}
                >
                  <Heart size={20} fill={isInWishlist(product.id) ? "currentColor" : "none"} /> 
                  {isInWishlist(product.id) ? "Added to Wishlist" : "Wishlist"}
                </button>
              </div>
            </div>

            {/* Delivery & Trust */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-4 p-5 rounded-2xl bg-white border border-gray-100">
                <Truck className="text-brand-blue shrink-0" size={24} />
                <div>
                  <h4 className="font-bold text-dark-navy text-sm">Pan-India Delivery</h4>
                  <p className="text-xs text-gray-400 mt-1">Estimate: 3-7 Business Days</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-5 rounded-2xl bg-white border border-gray-100">
                <ShieldCheck className="text-brand-blue shrink-0" size={24} />
                <div>
                  <h4 className="font-bold text-dark-navy text-sm">Secure Warranty</h4>
                  <p className="text-xs text-gray-400 mt-1">1 Year Premium Warranty</p>
                </div>
              </div>
            </div>

            {/* Highlights */}
            <div className="space-y-4">
              <h3 className="text-lg font-display font-bold text-dark-navy">Key Highlights</h3>
              <ul className="space-y-3">
                {[
                  "Premium build quality and aesthetic",
                  "Verified and tested for durability",
                  "Inclusive of all taxes and shipping",
                  "7-day hassle-free return policy"
                ].map((text, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-sm text-gray-500 font-medium">
                    <CheckCircle2 className="text-green-500 shrink-0" size={18} />
                    {text}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Related Products Section */}
      <section className="py-20 bg-section-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-display font-bold text-dark-navy mb-2">Related Products</h2>
              <p className="text-gray-500">You might also like these trending items from this category.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {relatedProducts.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
