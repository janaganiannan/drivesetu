"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

const HeroBanner = () => {
  return (
    <section className="relative h-[500px] md:h-[600px] overflow-hidden bg-[#F0F4F8]">
      {/* Background Gradient / Decorative elements */}
      <div className="absolute inset-0 bg-gradient-to-r from-brand-blue/10 to-transparent z-0" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col md:flex-row items-center relative z-10">
        {/* Text Content */}
        <div className="w-full md:w-1/2 pt-12 md:pt-0 text-center md:text-left">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 bg-brand-blue/10 text-brand-blue px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-6">
              <Sparkles size={14} />
              Exclusive Summer Collection 2024
            </span>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-dark-navy leading-[1.1] mb-6">
              Discover <span className="text-brand-blue">Trending</span> Products at Best Prices
            </h1>
            <p className="text-gray-600 text-lg md:text-xl mb-10 max-w-lg">
              Experience the future of shopping. Curated collections, lightning-fast delivery, and verified premium quality.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Link
                href="/clothing"
                className="w-full sm:w-auto px-8 py-4 bg-brand-blue text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-brand-blue/90 transform hover:scale-105 transition-all shadow-lg shadow-brand-blue/20"
              >
                Shop Now <ArrowRight size={20} />
              </Link>
              <Link
                href="/deals"
                className="w-full sm:w-auto px-8 py-4 bg-white text-dark-navy border border-gray-200 rounded-xl font-bold flex items-center justify-center hover:bg-gray-50 transition-all"
              >
                Explore Deals
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Hero Image Collage (Mobile hidden, Desktop absolute) */}
        <div className="hidden md:flex flex-1 h-full relative items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative w-full h-full"
          >
            {/* These would be the images from your mockup */}
            <img 
              src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800" 
              alt="Premium Watch" 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 object-cover rounded-3xl premium-shadow rotate-3 z-20 border-4 border-white"
            />
            <img 
              src="https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=400" 
              alt="Premium Shirt" 
              className="absolute top-[20%] right-[10%] w-48 h-64 object-cover rounded-2xl premium-shadow -rotate-6 z-10 opacity-80"
            />
            <img 
              src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=400" 
              alt="Premium Headphones" 
              className="absolute bottom-[20%] left-[10%] w-56 h-56 object-cover rounded-2xl premium-shadow rotate-12 z-10 opacity-80"
            />
          </motion.div>
        </div>
      </div>

      {/* Trust Badges - Bottom of Hero */}
      <div className="absolute bottom-0 left-0 right-0 bg-white/40 backdrop-blur-md border-t border-white/20 hidden lg:block">
        <div className="max-w-7xl mx-auto px-8 py-4 flex justify-between items-center text-xs font-bold text-dark-navy/60 uppercase tracking-widest">
          <div className="flex items-center gap-2">🚚 Fast Pan-India Delivery</div>
          <div className="flex items-center gap-2">🛡️ 100% Secure Checkout</div>
          <div className="flex items-center gap-2">🤝 7-Day Easy Returns</div>
          <div className="flex items-center gap-2">✅ Verified Premium Quality</div>
        </div>
      </div>
    </section>
  );
};

export default HeroBanner;
