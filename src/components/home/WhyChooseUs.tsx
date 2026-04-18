"use client";

import React from "react";
import { Truck, ShieldCheck, CreditCard, RefreshCcw } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    icon: <Truck className="text-brand-blue" size={32} />,
    title: "Fast Delivery",
    desc: "Pan-India delivery within 3-7 business days with real-time tracking.",
  },
  {
    icon: <ShieldCheck className="text-brand-blue" size={32} />,
    title: "Cash on Delivery",
    desc: "Pay only when you receive your order at your doorstep. Safe & Reliable.",
  },
  {
    icon: <CreditCard className="text-brand-blue" size={32} />,
    title: "Secure Payments",
    desc: "All transactions are encrypted and processed through verified partners.",
  },
  {
    icon: <RefreshCcw className="text-brand-blue" size={32} />,
    title: "Easy Returns",
    desc: "Not happy? Return your product within 7 days for a hassle-free refund.",
  },
];

const WhyChooseUs = () => {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-dark-navy mb-4">
            Why Shop With Us?
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            We prioritize your shopping experience with world-class service standards.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((f, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="p-8 rounded-[2.5rem] bg-section-bg border border-gray-100 hover:border-brand-blue/30 transition-colors group"
            >
              <div className="mb-6 p-4 bg-white rounded-3xl w-max premium-shadow group-hover:scale-110 transition-transform">
                {f.icon}
              </div>
              <h3 className="text-xl font-display font-bold text-dark-navy mb-3">
                {f.title}
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                {f.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
