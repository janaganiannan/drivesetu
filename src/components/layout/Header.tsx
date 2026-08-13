"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Search, ShoppingCart, Heart, User, Menu, X, MapPin } from "lucide-react";
import { useCart } from "@/lib/context/CartContext";
import { useWishlist } from "@/lib/context/WishlistContext";
import { useAuth } from "@/lib/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { state: cartState } = useCart();
  const { items: wishlistItems } = useWishlist();
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-100 premium-shadow">
      {/* Top bar (Location/India) */}
      <div className="hidden md:flex bg-dark-navy text-white py-1.5 px-6 justify-between items-center text-xs font-medium">
        <div className="flex items-center gap-1.5">
          <MapPin size={14} className="text-brand-blue" />
          <span>Deliver to India | Free Shipping on orders over ₹999</span>
        </div>
        <div className="flex gap-4">
          <Link href="/track-order" className="hover:text-brand-blue transition-colors">Track Order</Link>
          <Link href="/help" className="hover:text-brand-blue transition-colors">Help</Link>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20 gap-4">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0 flex items-center">
            <span className="text-2xl md:text-3xl font-display font-bold text-dark-navy tracking-tight">
              Trendify<span className="text-brand-blue">Hub</span>
            </span>
          </Link>

          {/* Search Bar (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-xl relative">
            <input
              type="text"
              placeholder="Search for premium products..."
              className="w-full bg-gray-50 border border-gray-200 rounded-full py-2.5 px-5 pr-12 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
            />
            <button className="absolute right-0 top-0 h-full px-5 bg-brand-blue text-white rounded-r-full hover:bg-brand-blue/90 transition-colors">
              <Search size={20} />
            </button>
          </div>

          {/* Nav Icons */}
          <div className="flex items-center gap-2 md:gap-5">
            <Link href="/account" className="hidden sm:flex flex-col items-center text-dark-navy hover:text-brand-blue transition-colors">
              <User size={24} />
              <span className="text-[10px] font-bold uppercase mt-0.5">Account</span>
            </Link>

            <Link href="/wishlist" className="relative flex flex-col items-center text-dark-navy hover:text-brand-blue transition-colors">
              <Heart size={24} />
              {wishlistItems.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-accent-orange text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {wishlistItems.length}
                </span>
              )}
              <span className="hidden sm:block text-[10px] font-bold uppercase mt-0.5">Wishlist</span>
            </Link>

            <Link href="/cart" className="relative flex flex-col items-center text-dark-navy hover:text-brand-blue transition-colors">
              <ShoppingCart size={24} />
              {cartState.totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-brand-blue text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {cartState.totalItems}
                </span>
              )}
              <span className="hidden sm:block text-[10px] font-bold uppercase mt-0.5">Cart</span>
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-dark-navy hover:bg-gray-100 rounded-lg transition-colors"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Sub-navbar (Categories) - Desktop */}
      <nav className="hidden md:block bg-white border-t border-gray-50 overflow-x-auto shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-12 flex items-center justify-center gap-8 whitespace-nowrap">
          <Link href="/watches" className="text-sm font-semibold text-dark-navy/70 hover:text-brand-blue transition-colors py-3 border-b-2 border-transparent hover:border-brand-blue translation-all">Watches</Link>
          <Link href="/electronics" className="text-sm font-semibold text-dark-navy/70 hover:text-brand-blue transition-colors py-3 border-b-2 border-transparent hover:border-brand-blue translation-all">Electronics</Link>
          <Link href="/deals" className="text-sm font-semibold text-accent-orange hover:text-accent-orange/80 transition-colors py-3 border-b-2 border-transparent hover:border-accent-orange translation-all">🔥 Flash Deals</Link>
          {user?.isAdmin && (
            <Link href="/admin" className="text-sm font-bold text-brand-blue bg-blue-50 px-3 py-1 rounded-full hover:bg-blue-100 transition-all">Admin Dashboard</Link>
          )}
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: 200 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 200 }}
            className="fixed inset-y-0 right-0 w-full max-w-sm bg-white z-[60] shadow-2xl md:hidden p-6"
          >
            <div className="flex justify-between items-center mb-8">
              <span className="text-2xl font-display font-bold text-dark-navy">Menu</span>
              <button onClick={() => setIsMenuOpen(false)} className="p-2 bg-gray-100 rounded-full">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              <Link onClick={() => setIsMenuOpen(false)} href="/" className="block text-xl font-bold text-dark-navy border-b border-gray-100 pb-2">Home</Link>
              <Link onClick={() => setIsMenuOpen(false)} href="/watches" className="block text-xl font-bold text-dark-navy border-b border-gray-100 pb-2">Watches</Link>
              <Link onClick={() => setIsMenuOpen(false)} href="/electronics" className="block text-xl font-bold text-dark-navy border-b border-gray-100 pb-2">Electronics</Link>
              <Link onClick={() => setIsMenuOpen(false)} href="/deals" className="block text-xl font-bold text-accent-orange border-b border-gray-100 pb-2">Flash Deals</Link>
              <Link onClick={() => setIsMenuOpen(false)} href="/account" className="block text-xl font-bold text-dark-navy border-b border-gray-100 pb-2">My Account</Link>
            </div>

            <div className="absolute bottom-10 left-6 right-6">
              <button className="w-full bg-dark-navy text-white font-bold py-4 rounded-xl">
                Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
