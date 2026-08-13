"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

const categories = [
  {
    id: 2,
    name: "Luxury Watches",
    slug: "watches",
    image: "https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&q=80&w=800",
    color: "bg-gray-50",
    count: "50+ items"
  },
  {
    id: 3,
    name: "Modern Electronics",
    slug: "electronics",
    image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&q=80&w=800",
    color: "bg-slate-50",
    count: "200+ items"
  }
];

const CategoryQuickAccess = () => {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
          <div>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-dark-navy mb-2">Shop by Category</h2>
            <p className="text-gray-500">Explore our curated collections across different categories.</p>
          </div>
          <Link href="/categories" className="text-brand-blue font-bold flex items-center gap-2 hover:underline">
            View All Categories <ArrowUpRight size={18} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {categories.map((cat, idx) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
            >
              <Link
                href={`/${cat.slug}`}
                className={`group relative block h-[400px] rounded-3xl overflow-hidden ${cat.color} premium-shadow hover:shadow-2xl transition-all duration-500`}
              >
                {/* Image Background */}
                <div className="absolute inset-0">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-navy/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                </div>

                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-8 transform group-hover:-translate-y-2 transition-transform duration-500">
                  <span className="text-brand-blue font-bold text-xs uppercase tracking-widest bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full mb-3 inline-block">
                    {cat.count}
                  </span>
                  <h3 className="text-2xl font-display font-bold text-white mb-4">{cat.name}</h3>
                  <div className="flex items-center gap-2 text-white/90 font-bold text-sm bg-white/20 backdrop-blur-md w-max px-4 py-2 rounded-xl group-hover:bg-brand-blue group-hover:text-white transition-all">
                    Shop Now <ArrowUpRight size={18} />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryQuickAccess;
