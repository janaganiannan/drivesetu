"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Search, Package, CheckCircle2, Truck, Clock, MapPin, Smartphone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState("");
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState("");

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    const existingOrders = JSON.parse(localStorage.getItem("trendify_orders") || "[]");
    const found = existingOrders.find((o: any) => o.id === orderId.toUpperCase() || o.id === `TH-${orderId.toUpperCase()}`);
    
    if (found) {
      setOrder(found);
      setError("");
    } else {
      setError("Order ID not found. Please check and try again.");
      setOrder(null);
    }
  };

  const steps = [
    { status: "Processing", icon: <Clock size={20} />, label: "Order Placed", date: "Placed On " + (order ? new Date(order.date).toLocaleDateString() : "") },
    { status: "Confirmed", icon: <CheckCircle2 size={20} />, label: "Confirmed", date: "Ready for shipping" },
    { status: "Shipped", icon: <Package size={20} />, label: "Shipped", date: "In transit to hub" },
    { status: "Out for Delivery", icon: <Truck size={20} />, label: "Out for Delivery", date: "Arriving today" },
    { status: "Delivered", icon: <MapPin size={20} />, label: "Delivered", date: "Delivered to address" },
  ];

  const currentStepIndex = steps.findIndex(s => s.status === (order?.status || "Processing"));

  return (
    <main className="min-h-screen bg-section-bg pb-20">
      <Header />

      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <div className="text-center mb-12">
           <h1 className="text-3xl md:text-5xl font-display font-bold text-dark-navy mb-4">Track Your <span className="text-brand-blue">Order</span></h1>
           <p className="text-gray-500">Enter your Order ID to see the detailed delivery status.</p>
        </div>

        {/* Search Bar */}
        <div className="bg-white p-8 rounded-[3rem] premium-shadow border border-gray-100 mb-12 flex flex-col items-center">
           <form onSubmit={handleTrack} className="w-full max-w-lg relative">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={24} />
              <input 
                type="text" 
                placeholder="Enter Order ID (e.g. TH-ABC123XYZ)"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="w-full bg-gray-50 border-2 border-transparent rounded-[2rem] py-5 pl-16 pr-32 font-bold text-dark-navy focus:border-brand-blue focus:bg-white focus:outline-none transition-all"
              />
              <button 
                type="submit"
                className="absolute right-2 top-2 bottom-2 px-8 bg-brand-blue text-white font-black rounded-[1.8rem] hover:bg-brand-blue/90 shadow-lg shadow-brand-blue/20 transition-all"
              >
                Track
              </button>
           </form>
           {error && <p className="text-red-500 text-sm font-bold mt-4">{error}</p>}
        </div>

        <AnimatePresence>
          {order && (
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="bg-white p-8 md:p-12 rounded-[3.5rem] premium-shadow border border-gray-100">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
                   <div>
                      <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Status for Order</p>
                      <h2 className="text-3xl font-display font-bold text-dark-navy">#{order.id}</h2>
                   </div>
                   <div className="bg-brand-blue/10 text-brand-blue px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest">
                      {order.status}
                   </div>
                </div>

                {/* Tracking Stepper */}
                <div className="relative pl-8 md:pl-0 md:flex md:justify-between items-start gap-4">
                   {/* Continuous line (Desktop) */}
                   <div className="hidden md:block absolute top-[22px] left-0 right-0 h-1 bg-gray-100 -z-10"></div>
                   {/* Vertical line (Mobile) */}
                   <div className="md:hidden absolute top-0 bottom-0 left-[18px] w-1 bg-gray-100 -z-10"></div>

                   {steps.map((step, idx) => {
                     const isCompleted = idx <= currentStepIndex;
                     const isCurrent = idx === currentStepIndex;
                     
                     return (
                       <div key={idx} className="relative flex md:flex-col items-center gap-6 md:gap-4 mb-10 md:mb-0 md:w-full">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 border-white premium-shadow transition-all duration-500 z-10 ${isCompleted ? 'bg-brand-blue text-white scale-110 shadow-lg shadow-brand-blue/20' : 'bg-white text-gray-300'}`}>
                             {step.icon}
                          </div>
                          <div className="md:text-center">
                             <h4 className={`text-sm font-black uppercase tracking-tight ${isCurrent ? 'text-brand-blue' : isCompleted ? 'text-dark-navy' : 'text-gray-300'}`}>
                               {step.label}
                             </h4>
                             <p className="text-[10px] font-bold text-gray-400 mt-1 whitespace-nowrap">
                               {isCompleted ? step.date : "Upcoming"}
                             </p>
                          </div>
                       </div>
                     );
                   })}
                </div>
              </div>

              {/* Support Card */}
              <div className="bg-dark-navy text-white p-10 rounded-[3rem] premium-shadow flex flex-col md:flex-row items-center justify-between gap-8">
                 <div className="text-center md:text-left">
                    <h3 className="text-2xl font-display font-bold mb-2">Need Faster Updates?</h3>
                    <p className="text-gray-400 max-w-sm text-sm">Send us a screenshot on WhatsApp for instant manual confirmation.</p>
                 </div>
                 <button className="flex items-center justify-center gap-3 bg-brand-blue text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-brand-blue/30">
                    <Smartphone size={20} /> Chat with Us
                 </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <Footer />
    </main>
  );
}
