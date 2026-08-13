"use client";

import React from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Search, HelpCircle, Mail, Phone, MessageCircle, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const faqs = [
  {
    q: "How do I track my order?",
    a: "You can track your order by clicking on the 'Track Order' link in the header and entering your Order ID (e.g., TH-XXXX)."
  },
  {
    q: "What payment methods are supported?",
    a: "We support Cash on Delivery (COD) and manual UPI transfers (GPay, PhonePe, Paytm) for secure and easy payments."
  },
  {
    q: "What is your return policy?",
    a: "We offer a 7-day hassle-free return policy on all our products. Please ensure the items are in their original condition and packaging."
  },
  {
    q: "Is there a delivery fee?",
    a: "We offer FREE delivery on all orders over ₹999. A small shipping fee of ₹99 is applicable on orders below this amount."
  }
];

export default function HelpPage() {
  return (
    <main className="min-h-screen bg-section-bg">
      <Header />

      <section className="bg-dark-navy text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-display font-bold mb-6">How can we <span className="text-brand-blue">help?</span></h1>
          <p className="text-gray-400 text-lg md:text-xl mb-12">Search our knowledge base or get in touch with our support team.</p>
          
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={24} />
            <input 
              type="text" 
              placeholder="Search for questions, orders, returns..." 
              className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-[2rem] py-5 pl-16 pr-8 text-white focus:outline-none focus:ring-2 focus:ring-brand-blue/50 text-lg font-medium"
            />
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* FAQ Area */}
          <div className="lg:col-span-2 space-y-8">
            <h2 className="text-3xl font-display font-bold text-dark-navy flex items-center gap-3">
              <HelpCircle className="text-brand-blue" /> Frequently Asked Questions
            </h2>
            
            <div className="space-y-4">
              {faqs.map((faq, idx) => (
                <div key={idx} className="bg-white p-8 rounded-3xl border border-gray-100 premium-shadow">
                  <h3 className="text-xl font-bold text-dark-navy mb-4">{faq.q}</h3>
                  <p className="text-gray-500 leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Methods */}
          <div className="space-y-8">
            <h2 className="text-2xl font-display font-bold text-dark-navy">Direct Contact</h2>
            
            <div className="space-y-4">
              <div className="bg-brand-blue p-8 rounded-[2.5rem] text-white">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
                  <MessageCircle size={24} />
                </div>
                <h3 className="text-xl font-bold mb-2">Chat with Us</h3>
                <p className="text-blue-100 text-sm mb-6">Get instant support for your orders on WhatsApp.</p>
                <Link href="#" className="inline-flex items-center gap-2 bg-white text-brand-blue px-6 py-3 rounded-xl font-black text-sm hover:bg-white/90 transition-all">
                  Open WhatsApp <ArrowRight size={16} />
                </Link>
              </div>

              <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 premium-shadow">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-gray-50 text-brand-blue rounded-2xl flex items-center justify-center">
                    <Mail size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-dark-navy text-sm">Email Support</h4>
                    <p className="text-xs text-gray-400">help@trendifyhub.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-50 text-brand-blue rounded-2xl flex items-center justify-center">
                    <Phone size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-dark-navy text-sm">Phone Support</h4>
                    <p className="text-xs text-gray-400">+91 999 000 1111</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
