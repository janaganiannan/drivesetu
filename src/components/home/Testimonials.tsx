"use client";

import React from "react";
import { Star, Quote } from "lucide-react";
import { motion } from "framer-motion";

const reviews = [
  {
    name: "Arjun Sharma",
    location: "Mumbai",
    text: "The quality of the cotton shirts is outstanding. I've shopped at many big brand stores, but TrendifyHub's premium collection is truly world-class. Fast delivery too!",
    rating: 5,
  },
  {
    name: "Priya Patel",
    location: "Ahmedabad",
    text: "Bought a Smartwatch Pro and it's perfect. The packaging was very premium, and the customer support team helped me set it up in minutes. Highly recommended!",
    rating: 5,
  },
  {
    name: "Rohan Varma",
    location: "Bangalore",
    text: "COD was seamless and the delivery was ahead of schedule. The electronics are authentic and exactly as shown in the images. Love the transparent pricing.",
    rating: 4,
  },
];

const Testimonials = () => {
  return (
    <section className="py-20 bg-section-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-brand-blue font-bold text-xs uppercase tracking-widest bg-brand-blue/10 px-4 py-1.5 rounded-full mb-3 inline-block">
            Reliability
          </span>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-dark-navy mb-4">
            Hear from Our Customers
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Join thousands of satisfied shoppers who trust TrendifyHub for their lifestyle needs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {reviews.map((rev, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white p-8 rounded-[2.5rem] premium-shadow border border-gray-50 relative group"
            >
              <Quote className="absolute top-6 right-8 text-gray-100 group-hover:text-brand-blue/10 transition-colors" size={60} />
              
              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    className={i < rev.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200"}
                  />
                ))}
              </div>

              <p className="text-gray-600 italic mb-8 relative z-10 leading-relaxed font-medium">
                &quot;{rev.text}&quot;
              </p>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-blue/10 rounded-2xl flex items-center justify-center text-brand-blue font-bold text-lg">
                  {rev.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-dark-navy">{rev.name}</h4>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">{rev.location}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
