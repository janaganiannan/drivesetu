"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/lib/context/AuthContext";
import { formatCurrency } from "@/lib/utils/format";
import { products } from "@/lib/data/products";
import { 
  BarChart3, 
  ShoppingBag, 
  Users, 
  ArrowUpRight, 
  ArrowDownRight, 
  IndianRupee, 
  Package, 
  Clock, 
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { motion } from "framer-motion";

export default function AdminDashboard() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    if (!isAuthenticated || !user?.isAdmin) {
      router.push("/");
    }
    const savedOrders = JSON.parse(localStorage.getItem("trendify_orders") || "[]");
    setOrders(savedOrders);
  }, [isAuthenticated, user, router]);

  const stats = useMemo(() => {
    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const totalOrders = orders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    return [
      { id: 1, name: "Total Revenue", value: formatCurrency(totalRevenue), icon: <IndianRupee size={24} />, trend: "+12.5%", color: "text-green-500", bg: "bg-green-50" },
      { id: 2, name: "Total Orders", value: totalOrders.toString(), icon: <ShoppingBag size={24} />, trend: "+4.3%", color: "text-blue-500", bg: "bg-blue-50" },
      { id: 3, name: "Inventory Size", value: products.length.toString(), icon: <Package size={24} />, trend: "Steady", color: "text-accent-orange", bg: "bg-orange-50" },
      { id: 4, name: "Avg. Order Value", value: formatCurrency(avgOrderValue), icon: <BarChart3 size={24} />, trend: "-2.1%", color: "text-purple-500", bg: "bg-purple-50" },
    ];
  }, [orders]);

  if (!user?.isAdmin) return null;

  return (
    <main className="min-h-screen bg-section-bg pb-20">
      <Header />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
          <div>
            <span className="text-brand-blue font-black text-[10px] uppercase tracking-[0.3em] mb-2 inline-block">Management Console</span>
            <h1 className="text-4xl font-display font-bold text-dark-navy">Admin <span className="text-brand-blue">Dashboard</span></h1>
          </div>
          <div className="flex gap-4">
             <div className="bg-white px-6 py-3 rounded-2xl border border-gray-100 font-bold text-dark-navy flex items-center gap-2">
                <Clock size={18} className="text-brand-blue" /> {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
             </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {stats.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: item.id * 0.1 }}
              className="bg-white p-8 rounded-[2.5rem] premium-shadow border border-gray-100"
            >
              <div className={`p-4 rounded-2xl w-max mb-6 ${item.bg} ${item.color}`}>
                {item.icon}
              </div>
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">{item.name}</p>
              <h3 className="text-2xl font-black text-dark-navy mb-4 font-display">{item.value}</h3>
              <div className="flex items-center gap-2 text-[10px] font-black italic">
                 {item.trend.startsWith('+') ? (
                   <ArrowUpRight size={14} className="text-green-500" />
                 ) : (
                   <ArrowDownRight size={14} className="text-red-500" />
                 )}
                 <span className={item.trend.startsWith('+') ? 'text-green-500' : 'text-red-500'}>{item.trend} Since last month</span>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Latest Orders Table */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-8 md:p-12 rounded-[3.5rem] premium-shadow border border-gray-100">
               <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-display font-bold text-dark-navy">Recent Customer Orders</h3>
                  <button className="text-xs font-black text-brand-blue hover:underline uppercase tracking-widest">View All Orders</button>
               </div>
               
               <div className="overflow-x-auto">
                 <table className="w-full">
                    <thead className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-left border-b border-gray-100">
                       <tr>
                         <th className="pb-4 pl-2">Order ID</th>
                         <th className="pb-4">Customer</th>
                         <th className="pb-4">Amount</th>
                         <th className="pb-4">Payment</th>
                         <th className="pb-4">Status</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                       {orders.length > 0 ? (
                         orders.slice().reverse().map((order) => (
                           <tr key={order.id} className="group hover:bg-gray-50/50 transition-colors">
                             <td className="py-5 font-black text-sm text-dark-navy pl-2">#{order.id}</td>
                             <td className="py-5">
                                <div className="text-sm font-bold text-dark-navy">{order.address.name}</div>
                                <div className="text-[10px] text-gray-400">{order.address.city}</div>
                             </td>
                             <td className="py-5 font-black text-sm text-brand-blue">{formatCurrency(order.total)}</td>
                             <td className="py-5 text-[10px] font-black uppercase text-gray-500 italic">{order.paymentMethod}</td>
                             <td className="py-5">
                                <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black uppercase">
                                  {order.status}
                                </span>
                             </td>
                           </tr>
                         ))
                       ) : (
                         <tr>
                           <td colSpan={5} className="py-20 text-center text-gray-400 italic">No orders recorded yet.</td>
                         </tr>
                       )}
                    </tbody>
                 </table>
               </div>
            </div>
          </div>

          {/* Quick Actions & Insight */}
          <div className="space-y-8">
             <div className="bg-dark-navy text-white p-10 rounded-[3rem] premium-shadow">
                <h3 className="text-xl font-display font-bold mb-6">Operational Insights</h3>
                <div className="space-y-6">
                   <div className="flex gap-4 items-start">
                      <div className="p-3 bg-white/5 rounded-2xl text-brand-blue shrink-0">
                         <AlertCircle size={20} />
                      </div>
                      <div>
                         <p className="text-xs font-bold text-gray-300 mb-1">Stock Alert</p>
                         <p className="text-sm text-gray-400 leading-relaxed font-medium">3 products are currently running low on inventory.</p>
                      </div>
                   </div>
                   <div className="flex gap-4 items-start">
                      <div className="p-3 bg-white/5 rounded-2xl text-green-500 shrink-0">
                         <CheckCircle2 size={20} />
                      </div>
                      <div>
                         <p className="text-xs font-bold text-gray-300 mb-1">Customer Sentiment</p>
                         <p className="text-sm text-gray-400 leading-relaxed font-medium">Average rating remains high at 4.8★ across all categories.</p>
                      </div>
                   </div>
                </div>
                
                <div className="mt-10 pt-8 border-t border-white/10">
                   <button className="w-full bg-brand-blue text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-brand-blue/90 transition-all">
                      Add New Product <ArrowUpRight size={18} />
                   </button>
                </div>
             </div>

             <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 premium-shadow">
                <h3 className="text-lg font-display font-bold text-dark-navy mb-6">System Health</h3>
                <div className="space-y-4">
                   <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-gray-400">Database Sync</span>
                      <span className="text-green-500 uppercase tracking-widest">Active</span>
                   </div>
                   <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-gray-400">Next.js Version</span>
                      <span className="text-dark-navy uppercase tracking-widest">14.1.0 (Stable)</span>
                   </div>
                   <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-gray-400">Brand Color</span>
                      <div className="flex items-center gap-2">
                         <div className="w-3 h-3 rounded-full bg-brand-blue"></div>
                         <span className="text-dark-navy uppercase tracking-widest">#2563EB</span>
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
