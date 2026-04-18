"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { CheckCircle2, Package, Smartphone, ArrowRight, Share2 } from "lucide-react";
import { motion } from "framer-motion";

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("id");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // You could trigger confetti here
  }, []);

  if (!mounted) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-20 text-center">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 12 }}
        className="inline-flex items-center justify-center w-32 h-32 bg-green-50 rounded-full text-green-500 mb-8 border-4 border-white shadow-xl shadow-green-500/10"
      >
        <CheckCircle2 size={64} />
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <h1 className="text-4xl md:text-5xl font-display font-bold text-dark-navy mb-4">
          Order Placed <span className="text-brand-blue">Successfully!</span>
        </h1>
        <p className="text-lg text-gray-500 mb-12">
          Thank you for shopping with TrendifyHub. Your order has been registered and is being processed.
        </p>

        <div className="bg-white p-8 rounded-[3rem] premium-shadow border border-gray-100 mb-12">
          <div className="flex flex-col md:flex-row justify-around gap-8">
            <div className="text-center">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Order ID</p>
              <p className="text-2xl font-black text-dark-navy">#{orderId}</p>
            </div>
            <div className="hidden md:block w-px bg-gray-100"></div>
            <div className="text-center">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Est. Delivery</p>
              <p className="text-2xl font-black text-green-600">3-7 Days</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto">
          <Link 
            href="/track-order"
            className="flex items-center justify-center gap-2 bg-dark-navy text-white font-bold py-4 rounded-2xl hover:bg-dark-navy/90 transition-all"
          >
            <Package size={20} /> Track My Order
          </Link>
          <button className="flex items-center justify-center gap-2 bg-white text-dark-navy border border-gray-200 font-bold py-4 rounded-2xl hover:bg-gray-50 transition-all">
            <Share2 size={20} /> Share Order
          </button>
        </div>

        <div className="mt-12 pt-12 border-t border-gray-100 flex flex-col items-center">
           <div className="flex items-center gap-3 text-brand-blue font-black text-xs uppercase tracking-widest bg-brand-blue/5 px-6 py-2 rounded-full mb-6">
              <Smartphone size={16} /> WhatsApp Inquiry
           </div>
           <p className="text-sm text-gray-500 max-w-sm mb-8 leading-relaxed italic">
             Need instant help with your order? Send your Order ID to our WhatsApp support for quick confirmation.
           </p>
           <Link href="/" className="text-dark-navy font-black flex items-center gap-2 hover:text-brand-blue transition-colors underline underline-offset-8 decoration-2 decoration-brand-blue">
             Continue Shopping <ArrowRight size={20} />
           </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <main className="min-h-screen bg-section-bg pb-20">
      <Header />
      <Suspense fallback={<div className="flex items-center justify-center py-20">Loading...</div>}>
         <OrderSuccessContent />
      </Suspense>
      <Footer />
    </main>
  );
}
