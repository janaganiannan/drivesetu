"use client";

import React from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useCart } from "@/lib/context/CartContext";
import { formatCurrency } from "@/lib/utils/format";
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

export default function CartPage() {
  const { state, dispatch } = useCart();

  const subtotal = state.totalPrice;
  const shipping = subtotal > 999 ? 0 : 99;
  const tax = Math.round(subtotal * 0.18); // 18% GST (mock)
  const total = subtotal + shipping + tax;

  if (state.items.length === 0) {
    return (
      <main className="min-h-screen bg-section-bg">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex flex-col items-center justify-center">
          <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center mb-8 shadow-sm">
             <ShoppingBag size={48} className="text-gray-200" />
          </div>
          <h1 className="text-3xl font-display font-bold text-dark-navy mb-4">Your cart is empty</h1>
          <p className="text-gray-500 mb-8 max-w-sm text-center">Looks like you haven&apos;t added any premium trends to your cart yet.</p>
          <Link href="/clothing" className="bg-brand-blue text-white px-10 py-4 rounded-2xl font-bold shadow-lg shadow-brand-blue/20 hover:scale-105 transition-all">
            Start Shopping
          </Link>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-section-bg">
      <Header />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <h1 className="text-3xl md:text-5xl font-display font-bold text-dark-navy mb-12">
          Your <span className="text-brand-blue">Shopping Cart</span>
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* LEFT: Items List */}
          <div className="lg:col-span-8 space-y-4">
            {state.items.map((item) => (
              <motion.div 
                layout
                key={item.id}
                className="bg-white p-6 rounded-[2rem] border border-gray-100 premium-shadow flex flex-col sm:flex-row gap-6 items-center"
              >
                {/* Image */}
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl overflow-hidden bg-gray-50 flex-shrink-0">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </div>

                {/* Info */}
                <div className="flex-1 text-center sm:text-left">
                  <p className="text-[10px] font-black text-brand-blue uppercase tracking-widest mb-1">{item.category}</p>
                  <h3 className="text-lg font-display font-bold text-dark-navy mb-2">{item.name}</h3>
                  <p className="text-xl font-black text-dark-navy">{formatCurrency(item.price)}</p>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-6">
                  <div className="flex items-center bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
                    <button 
                      onClick={() => dispatch({ type: "UPDATE_QUANTITY", productId: item.id, quantity: item.quantity - 1 })}
                      className="p-2 hover:bg-gray-100 transition-colors"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="px-4 font-bold text-dark-navy">{item.quantity}</span>
                    <button 
                      onClick={() => dispatch({ type: "UPDATE_QUANTITY", productId: item.id, quantity: item.quantity + 1 })}
                      className="p-2 hover:bg-gray-100 transition-colors"
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  <button 
                    onClick={() => dispatch({ type: "REMOVE_FROM_CART", productId: item.id })}
                    className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* RIGHT: Summary */}
          <div className="lg:col-span-4 sticky top-32">
            <div className="bg-white p-8 rounded-[2.5rem] premium-shadow border border-gray-100 space-y-8">
              <h3 className="text-xl font-display font-bold text-dark-navy">Order Summary</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between text-gray-500 font-medium">
                  <span>Subtotal ({state.totalItems} items)</span>
                  <span className="text-dark-navy">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-500 font-medium">
                  <span>Shipping Fee</span>
                  <span className={shipping === 0 ? "text-green-600 font-bold" : "text-dark-navy"}>
                    {shipping === 0 ? "FREE" : formatCurrency(shipping)}
                  </span>
                </div>
                <div className="flex justify-between text-gray-500 font-medium">
                  <span>Estimated Tax (GST 18%)</span>
                  <span className="text-dark-navy">{formatCurrency(tax)}</span>
                </div>
                
                <div className="h-px bg-gray-100 my-4"></div>
                
                <div className="flex justify-between items-end">
                  <span className="text-gray-500 font-bold uppercase text-xs tracking-widest">Total Payable</span>
                  <span className="text-3xl font-black text-dark-navy">{formatCurrency(total)}</span>
                </div>
              </div>

              {/* Coupon Row */}
              <div className="pt-4">
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Apply Coupon Code" 
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-brand-blue/10 outline-none"
                  />
                  <button className="absolute right-2 top-1.5 px-4 py-1.5 bg-brand-blue text-white text-xs font-bold rounded-lg hover:bg-brand-blue/90 transition-all">
                    Apply
                  </button>
                </div>
              </div>

              <Link 
                href="/checkout"
                className="w-full bg-brand-blue text-white font-bold py-5 rounded-2xl flex items-center justify-center gap-2 hover:bg-brand-blue/90 transition-all shadow-lg shadow-brand-blue/20"
              >
                Secure Checkout <ArrowRight size={20} />
              </Link>

              <div className="flex items-center justify-center gap-2 text-gray-400 text-[10px] font-bold uppercase tracking-widest pt-4">
                <ShieldCheck size={16} /> 100% Secure SSL Payment
              </div>
            </div>
            
            {/* Delivery Promise Card */}
            <div className="mt-6 p-6 bg-blue-50 rounded-3xl border border-blue-100 text-center">
              <p className="text-blue-600 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Happiness Guaranteed</p>
              <p className="text-xs text-blue-800 font-medium italic">We offer no questions asked 7-day returns on all verified items.</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
