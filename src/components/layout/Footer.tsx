import React from "react";
import Link from "next/link";
import { Mail, Phone, MapPin, Share2, Globe, MessageCircle } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-dark-navy text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand & About */}
          <div className="space-y-6">
            <Link href="/" className="text-3xl font-display font-bold text-white tracking-tight">
              Trendify<span className="text-brand-blue">Hub</span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed">
              TrendifyHub is India&apos;s fastest growing destination for premium clothing, elegant watches, and cutting-edge electronics. We bring you the world&apos;s best trends at unbeatable prices.
            </p>
            <div className="flex gap-4">
              <Link href="#" className="p-2 bg-white/5 rounded-full hover:bg-brand-blue transition-colors text-white"><Share2 size={18} /></Link>
              <Link href="#" className="p-2 bg-white/5 rounded-full hover:bg-brand-blue transition-colors text-white"><Globe size={18} /></Link>
              <Link href="#" className="p-2 bg-white/5 rounded-full hover:bg-brand-blue transition-colors text-white"><MessageCircle size={18} /></Link>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-6">
            <h4 className="text-lg font-bold font-display">Quick Links</h4>
            <ul className="space-y-4 text-sm text-gray-400">
              <li><Link href="/clothing" className="hover:text-brand-blue transition-colors">Men&apos;s Clothing</Link></li>
              <li><Link href="/watches" className="hover:text-brand-blue transition-colors">Premium Watches</Link></li>
              <li><Link href="/electronics" className="hover:text-brand-blue transition-colors">New Electronics</Link></li>
              <li><Link href="/deals" className="hover:text-brand-blue transition-colors">Flash Deals</Link></li>
              <li><Link href="/account" className="hover:text-brand-blue transition-colors">My Account</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div className="space-y-6">
            <h4 className="text-lg font-bold font-display">Customer Support</h4>
            <ul className="space-y-4 text-sm text-gray-400">
              <li><Link href="/track-order" className="hover:text-brand-blue transition-colors">Track Your Order</Link></li>
              <li><Link href="/shipping" className="hover:text-brand-blue transition-colors">Shipping Policy</Link></li>
              <li><Link href="/returns" className="hover:text-brand-blue transition-colors">Returns & Refunds</Link></li>
              <li><Link href="/faq" className="hover:text-brand-blue transition-colors">FAQs</Link></li>
              <li><Link href="/contact" className="hover:text-brand-blue transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <h4 className="text-lg font-bold font-display">Get in Touch</h4>
            <ul className="space-y-4 text-sm text-gray-400">
              <li className="flex items-start gap-3">
                <MapPin className="text-brand-blue shrink-0" size={18} />
                <span>123 Trendify Tower, Cyber City, Gurgaon, Haryana, 122002</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="text-brand-blue shrink-0" size={18} />
                <span>+91 98765 43210</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="text-brand-blue shrink-0" size={18} />
                <span>support@trendifyhub.in</span>
              </li>
            </ul>
            {/* Payment Badges */}
            <div className="pt-4 flex flex-wrap gap-2 opacity-50">
              <div className="bg-white px-2 py-1 rounded text-[10px] font-bold text-dark-navy italic">UPI</div>
              <div className="bg-white px-2 py-1 rounded text-[10px] font-bold text-dark-navy italic">VISA</div>
              <div className="bg-white px-2 py-1 rounded text-[10px] font-bold text-dark-navy italic">MASTERCARD</div>
              <div className="bg-white px-2 py-1 rounded text-[10px] font-bold text-dark-navy uppercase">COD</div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500 font-medium">
          <p>© 2024 TrendifyHub. All Rights Reserved.</p>
          <p className="flex items-center gap-1.5 uppercase tracking-widest">
            Made with <span className="text-red-500 text-lg">♥</span> in India
          </p>
          <div className="flex gap-6">
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
