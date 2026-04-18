"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/lib/context/AuthContext";
import { useWishlist } from "@/lib/context/WishlistContext";
import { formatCurrency } from "@/lib/utils/format";
import { User, Package, Heart, MapPin, LogOut, ChevronRight, PackageCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ProductCard from "@/components/products/ProductCard";

export default function AccountPage() {
  const { user, logout, isAuthenticated } = useAuth();
  const { items: wishlistItems } = useWishlist();
  const [orders, setOrders] = useState<any[]>([]);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("orders");

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
    }
    const savedOrders = JSON.parse(localStorage.getItem("trendify_orders") || "[]");
    setOrders(savedOrders);
  }, [isAuthenticated, router]);

  if (!user) return null;

  return (
    <main className="min-h-screen bg-section-bg pb-20">
      <Header />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Header */}
        <div className="bg-white p-8 md:p-12 rounded-[3.5rem] premium-shadow border border-gray-100 mb-12 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-brand-blue/10 rounded-3xl flex items-center justify-center text-brand-blue font-black text-3xl">
              {user.name.charAt(0)}
            </div>
            <div>
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Welcome back,</p>
              <h1 className="text-3xl font-display font-bold text-dark-navy">{user.name}</h1>
              <p className="text-sm text-gray-500 font-medium">{user.email}</p>
            </div>
          </div>
          <button 
            onClick={() => { logout(); router.push("/"); }}
            className="flex items-center gap-2 text-red-500 font-bold bg-red-50 px-6 py-3 rounded-2xl hover:bg-red-100 transition-all"
          >
            <LogOut size={20} /> Logout
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Sidebar Tabs */}
          <aside className="lg:w-72 space-y-2">
            {[
              { id: "orders", label: "My Orders", icon: <Package size={20} /> },
              { id: "wishlist", label: "My Wishlist", icon: <Heart size={20} /> },
              { id: "addresses", label: "Saved Addresses", icon: <MapPin size={20} /> },
              { id: "profile", label: "Account Profile", icon: <User size={20} /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center justify-between p-5 rounded-2xl font-bold transition-all ${
                  activeTab === tab.id 
                    ? "bg-brand-blue text-white shadow-lg shadow-brand-blue/20" 
                    : "bg-white text-dark-navy hover:bg-gray-50 border border-gray-100"
                }`}
              >
                <div className="flex items-center gap-4">
                  {tab.icon}
                  <span>{tab.label}</span>
                </div>
                <ChevronRight size={16} className={activeTab === tab.id ? "opacity-100" : "opacity-30"} />
              </button>
            ))}
          </aside>

          {/* Main Content Area */}
          <div className="flex-1">
            <AnimatePresence mode="wait">
              {activeTab === "orders" && (
                <motion.div
                  key="orders"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <h2 className="text-2xl font-display font-bold text-dark-navy mb-8">Recent Orders</h2>
                  {orders.length > 0 ? (
                    orders.slice().reverse().map((order) => (
                      <div key={order.id} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 premium-shadow">
                        <div className="flex flex-col md:flex-row justify-between mb-8 gap-4 border-b border-gray-50 pb-6">
                           <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Order ID</p>
                              <p className="font-bold text-dark-navy">#{order.id}</p>
                           </div>
                           <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Placed On</p>
                              <p className="font-bold text-dark-navy">{new Date(order.date).toLocaleDateString()}</p>
                           </div>
                           <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</p>
                              <span className="bg-green-50 text-green-600 px-4 py-1 rounded-full text-[10px] font-black uppercase">{order.status}</span>
                           </div>
                           <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Amount</p>
                              <p className="text-lg font-black text-brand-blue">{formatCurrency(order.total)}</p>
                           </div>
                        </div>
                        <div className="flex flex-wrap gap-4">
                           {order.items.map((item: any, i: number) => (
                             <div key={i} className="w-12 h-12 rounded-xl overflow-hidden border border-gray-100">
                               <img src={item.image} alt="product" className="w-full h-full object-cover" />
                             </div>
                           ))}
                           <div className="ml-auto">
                              <Link 
                                href="/track-order" 
                                className="text-xs font-black text-brand-blue border-2 border-brand-blue/20 hover:border-brand-blue px-6 py-2 rounded-xl transition-all"
                              >
                                Track Package
                              </Link>
                           </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="bg-white p-20 rounded-[3rem] border border-dashed border-gray-200 text-center">
                       <Package size={48} className="text-gray-200 mx-auto mb-4" />
                       <h3 className="text-xl font-display font-bold text-dark-navy mb-2">No orders yet</h3>
                       <p className="text-gray-500 mb-8">Start shopping to see your orders here.</p>
                       <Link href="/" className="bg-dark-navy text-white px-8 py-3 rounded-2xl font-bold">Go to Shop</Link>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === "wishlist" && (
                <motion.div
                  key="wishlist"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <h2 className="text-2xl font-display font-bold text-dark-navy mb-8">My Wishlist ({wishlistItems.length})</h2>
                  {wishlistItems.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {wishlistItems.map((product) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white p-20 rounded-[3rem] border border-dashed border-gray-200 text-center">
                       <Heart size={48} className="text-gray-200 mx-auto mb-4" />
                       <h3 className="text-xl font-display font-bold text-dark-navy mb-2">Your wishlist is empty</h3>
                       <p className="text-gray-500 mb-8">Save your favorite items here to buy them later.</p>
                       <Link href="/" className="bg-brand-blue text-white px-8 py-3 rounded-2xl font-bold">Browse Products</Link>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === "profile" && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white p-12 rounded-[3.5rem] premium-shadow border border-gray-100"
                >
                  <h2 className="text-2xl font-display font-bold text-dark-navy mb-8">Profile Details</h2>
                  <div className="space-y-8">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2 mb-2">Full Name</p>
                           <p className="px-6 py-4 bg-gray-50 rounded-2xl font-bold text-dark-navy border border-gray-100">{user.name}</p>
                        </div>
                        <div>
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2 mb-2">Email Address</p>
                           <p className="px-6 py-4 bg-gray-50 rounded-2xl font-bold text-dark-navy border border-gray-100">{user.email}</p>
                        </div>
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2 mb-2">Account Type</p>
                        <p className="px-6 py-4 bg-gray-50 rounded-2xl font-bold text-dark-navy border border-gray-100 flex items-center gap-2">
                           {user.isAdmin ? (
                             <>
                               <PackageCheck className="text-brand-blue" size={20} /> Professional Merchant (Admin)
                             </>
                           ) : (
                             <>
                               <User className="text-brand-blue" size={20} /> Premium Shopper
                             </>
                           )}
                        </p>
                     </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
