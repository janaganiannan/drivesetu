"use client";

import React from "react";
import { Mail, Send } from "lucide-react";
import { motion } from "framer-motion";

const Newsletter = () => {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="bg-brand-blue rounded-[3rem] p-8 md:p-16 relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-12"
        >
          {/* Decorative shapes */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

          <div className="text-white text-center lg:text-left relative z-10 max-w-xl">
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-6 italic">
              Join the Trendify Circle
            </h2>
            <p className="text-blue-100 text-lg md:text-xl font-medium">
              Subscribe to get early access to our premium drops and exclusive weekly deals. No spam, just pure trends.
            </p>
          </div>

          <div className="w-full lg:w-max relative z-10">
            <form onSubmit={(e) => e.preventDefault()} className="flex flex-col sm:flex-row gap-4 p-2 bg-white/10 backdrop-blur-md rounded-[2rem] border border-white/20">
              <div className="flex items-center gap-3 px-6 py-4 bg-white rounded-2xl flex-1 sm:min-w-[300px]">
                <Mail className="text-brand-blue" size={20} />
                <input
                  type="email"
                  placeholder="Enter your email address"
                  className="bg-transparent border-none outline-none text-dark-navy font-bold w-full placeholder:text-gray-400"
                />
              </div>
              <button
                type="submit"
                className="bg-dark-navy text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-dark-navy/90 transition-all shrink-0"
              >
                Join Now <Send size={18} />
              </button>
            </form>
            <p className="text-blue-200 text-[10px] mt-4 font-bold text-center lg:text-left uppercase tracking-widest px-2">
              By joining, you agree to our Privacy Policy
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Newsletter;
