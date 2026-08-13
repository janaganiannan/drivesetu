"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/lib/context/AuthContext";
import { Mail, Lock, LogIn, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(""); // Mock password
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In our mock, name is extracted from email/phone or just 'User'
    const name = email.includes("@") ? email.split("@")[0] : "User";
    login(email, name, password);
    
    // Redirect logic handled here for responsiveness
    if (email === "8125531017" && password === "annan@123") {
      router.push("/admin");
    } else {
      router.push("/account");
    }
  };

  return (
    <main className="min-h-screen bg-section-bg">
      <Header />
      
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex justify-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white p-10 md:p-12 rounded-[3.5rem] premium-shadow border border-gray-100"
        >
          <div className="text-center mb-10">
            <h1 className="text-3xl font-display font-bold text-dark-navy mb-3">Welcome Back</h1>
            <p className="text-gray-400 text-sm font-medium">Log in to TrendifyHub and access your orders.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Email or Phone Number</label>
              <div className="relative">
                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                <input 
                  required
                  type="text" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email or 81255XXXXX" 
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pl-14 pr-6 font-bold text-dark-navy focus:ring-2 focus:ring-brand-blue/10 outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Password</label>
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

            <div className="flex justify-end">
              <Link href="#" className="text-xs font-bold text-brand-blue hover:underline">Forgot Password?</Link>
            </div>

            <button 
              type="submit"
              className="w-full bg-brand-blue text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 hover:bg-brand-blue/90 transition-all shadow-lg shadow-brand-blue/20"
            >
              Log In <LogIn size={20} />
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-gray-50 text-center">
            <p className="text-sm text-gray-400 font-medium">
              Don&apos;t have an account?{" "}
              <Link href="/auth/signup" className="text-brand-blue font-black hover:underline underline-offset-4">Sign Up Now</Link>
            </p>
          </div>
        </motion.div>
      </section>

      <Footer />
    </main>
  );
}
