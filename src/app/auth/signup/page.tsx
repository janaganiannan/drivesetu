"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/lib/context/AuthContext";
import { Mail, Lock, UserPlus, ArrowRight, User } from "lucide-react";
import { motion } from "framer-motion";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(email, name);
    router.push("/account");
  };

  return (
    <main className="min-h-screen bg-section-bg">
      <Header />
      
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white p-10 md:p-12 rounded-[3.5rem] premium-shadow border border-gray-100"
        >
          <div className="text-center mb-10">
            <h1 className="text-3xl font-display font-bold text-dark-navy mb-3">Join the Hub</h1>
            <p className="text-gray-400 text-sm font-medium">Create a free account and start your premium journey.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                <input 
                  required
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe" 
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pl-14 pr-6 font-bold text-dark-navy focus:ring-2 focus:ring-brand-blue/10 outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                <input 
                  required
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@email.com" 
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pl-14 pr-6 font-bold text-dark-navy focus:ring-2 focus:ring-brand-blue/10 outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Create Password</label>
              <div className="relative">
                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                <input 
                  required
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pl-14 pr-6 font-bold text-dark-navy focus:ring-2 focus:ring-brand-blue/10 outline-none"
                />
              </div>
            </div>

            <p className="text-[10px] text-gray-400 px-2 leading-relaxed italic">
              By creating an account, you agree to our <Link href="#" className="underline">Terms of Service</Link> and <Link href="#" className="underline">Privacy Policy</Link>.
            </p>

            <button 
              type="submit"
              className="w-full bg-brand-blue text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 hover:bg-brand-blue/90 transition-all shadow-lg shadow-brand-blue/20"
            >
              Start Shopping <UserPlus size={20} />
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-gray-50 text-center">
            <p className="text-sm text-gray-400 font-medium">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-brand-blue font-black hover:underline underline-offset-4">Log In</Link>
            </p>
          </div>
        </motion.div>
      </section>

      <Footer />
    </main>
  );
}
