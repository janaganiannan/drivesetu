"use client";

import React, { useState, useEffect } from "react";
import { products } from "@/lib/data/products";
import ProductCard from "@/components/products/ProductCard";
import { Timer } from "lucide-react";

const BestDeals = () => {
  const dealProducts = products.filter((p) => p.category === "electronics").slice(0, 4);
  
  // Countdown Timer Logic
  const [timeLeft, setTimeLeft] = useState({
    hours: 24,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.hours === 0 && prev.minutes === 0 && prev.seconds === 0) {
          return { hours: 24, minutes: 0, seconds: 0 };
        }
        
        let s = prev.seconds - 1;
        let m = prev.minutes;
        let h = prev.hours;

        if (s < 0) {
          s = 59;
          m -= 1;
        }
        if (m < 0) {
          m = 59;
          h -= 1;
        }

        return { hours: h, minutes: m, seconds: s };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <section className="py-20 bg-dark-navy text-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-8">
          <div className="text-center md:text-left">
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">
              Flash <span className="text-brand-blue">Deals</span>
            </h2>
            <p className="text-gray-400">Limited time offers on premium tech. Grab them before they&apos;re gone!</p>
          </div>

          <div className="flex items-center gap-4 bg-white/5 backdrop-blur-md p-6 rounded-[2rem] border border-white/10">
            <div className="flex items-center gap-2 text-brand-blue mr-4">
              <Timer size={24} />
              <span className="font-black uppercase tracking-tighter text-sm">Ends In:</span>
            </div>
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <span className="text-3xl font-black font-display">{String(timeLeft.hours).padStart(2, '0')}</span>
                <span className="text-[10px] uppercase font-bold text-gray-500">Hrs</span>
              </div>
              <span className="text-3xl font-black text-brand-blue">:</span>
              <div className="flex flex-col items-center">
                <span className="text-3xl font-black font-display">{String(timeLeft.minutes).padStart(2, '0')}</span>
                <span className="text-[10px] uppercase font-bold text-gray-500">Min</span>
              </div>
              <span className="text-3xl font-black text-brand-blue">:</span>
              <div className="flex flex-col items-center">
                <span className="text-3xl font-black font-display">{String(timeLeft.seconds).padStart(2, '0')}</span>
                <span className="text-[10px] uppercase font-bold text-gray-500">Sec</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {dealProducts.map((product) => (
            <div key={product.id} className="text-dark-navy">
               <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BestDeals;
