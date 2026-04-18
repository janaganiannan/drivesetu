"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useCart } from "@/lib/context/CartContext";
import { formatCurrency, generateOrderId } from "@/lib/utils/format";
import { CheckCircle2, CreditCard, Truck, ShieldCheck, ArrowRight, MessageSquareQuote } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CheckoutPage() {
  const router = useRouter();
  const { state, dispatch } = useCart();
  const [step, setStep] = useState(1); // 1: Address, 2: Payment
  
  const [address, setAddress] = useState({
    name: "",
    phone: "",
    pincode: "",
    address: "",
    city: "",
    state: ""
  });

  const [paymentMethod, setPaymentMethod] = useState("cod");

  const subtotal = state.totalPrice;
  const shipping = subtotal > 999 ? 0 : 99;
  const tax = Math.round(subtotal * 0.18);
  const total = subtotal + shipping + tax;

  useEffect(() => {
    if (state.items.length === 0 && step !== 3) {
      router.push("/cart");
    }
  }, [state.items.length, step, router]);

  if (state.items.length === 0 && step !== 3) {
    return null;
  }

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handlePlaceOrder = () => {
    // Generate order ID
    const orderId = generateOrderId();
    
    // Save order to localStorage for tracking simulation
    const newOrder = {
      id: orderId,
      items: state.items,
      total: total,
      address: address,
      paymentMethod: paymentMethod,
      date: new Date().toISOString(),
      status: "Processing"
    };
    
    const existingOrders = JSON.parse(localStorage.getItem("trendify_orders") || "[]");
    localStorage.setItem("trendify_orders", JSON.stringify([...existingOrders, newOrder]));

    // Clear cart
    dispatch({ type: "CLEAR_CART" });

    // Redirect to success
    router.push(`/order-success?id=${orderId}`);
  };

  return (
    <main className="min-h-screen bg-section-bg pb-20">
      <Header />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* LEFT: Checkout Steps */}
          <div className="flex-1 space-y-8">
            
            {/* Step Indicators */}
            <div className="flex items-center gap-4 mb-12">
               <div className={`flex items-center gap-2 font-bold ${step >= 1 ? "text-brand-blue" : "text-gray-300"}`}>
                 <span className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 1 ? "border-brand-blue bg-brand-blue/5" : "border-gray-200"}`}>1</span>
                 <span className="hidden sm:inline">Shipping</span>
               </div>
               <div className="w-12 h-px bg-gray-200"></div>
               <div className={`flex items-center gap-2 font-bold ${step >= 2 ? "text-brand-blue" : "text-gray-300"}`}>
                 <span className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 2 ? "border-brand-blue bg-brand-blue/5" : "border-gray-200"}`}>2</span>
                 <span className="hidden sm:inline">Payment</span>
               </div>
            </div>

            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.div 
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-white p-8 md:p-12 rounded-[2.5rem] premium-shadow border border-gray-100"
                >
                  <h2 className="text-2xl font-display font-bold text-dark-navy mb-8">Delivery Address</h2>
                  <form onSubmit={handleAddressSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2 space-y-2">
                       <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-2">Full Name</label>
                       <input 
                         required
                         type="text" 
                         value={address.name}
                         onChange={(e) => setAddress({...address, name: e.target.value})}
                         placeholder="John Doe" 
                         className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3.5 px-6 font-bold focus:ring-2 focus:ring-brand-blue/10 outline-none"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-2">Phone Number</label>
                       <input 
                         required
                         type="tel" 
                         value={address.phone}
                         onChange={(e) => setAddress({...address, phone: e.target.value})}
                         placeholder="+91 9876543210" 
                         className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3.5 px-6 font-bold focus:ring-2 focus:ring-brand-blue/10 outline-none"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-2">Pincode</label>
                       <input 
                         required
                         type="text" 
                         value={address.pincode}
                         onChange={(e) => setAddress({...address, pincode: e.target.value})}
                         placeholder="110001" 
                         className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3.5 px-6 font-bold focus:ring-2 focus:ring-brand-blue/10 outline-none"
                       />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                       <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-2">Full Address</label>
                       <textarea 
                         required
                         rows={3}
                         value={address.address}
                         onChange={(e) => setAddress({...address, address: e.target.value})}
                         placeholder="House No, Building Name, Street, Area" 
                         className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3.5 px-6 font-bold focus:ring-2 focus:ring-brand-blue/10 outline-none"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-2">City</label>
                       <input 
                         required
                         type="text" 
                         value={address.city}
                         onChange={(e) => setAddress({...address, city: e.target.value})}
                         placeholder="New Delhi" 
                         className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3.5 px-6 font-bold focus:ring-2 focus:ring-brand-blue/10 outline-none"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-2">State</label>
                       <input 
                         required
                         type="text" 
                         value={address.state}
                         onChange={(e) => setAddress({...address, state: e.target.value})}
                         placeholder="Delhi" 
                         className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3.5 px-6 font-bold focus:ring-2 focus:ring-brand-blue/10 outline-none"
                       />
                    </div>
                    <div className="md:col-span-2 pt-6">
                      <button 
                        type="submit"
                        className="w-full bg-brand-blue text-white font-black py-5 rounded-2xl flex items-center justify-center gap-2 hover:bg-brand-blue/90 transition-all shadow-lg shadow-brand-blue/20"
                      >
                        Deliver to this Address <ArrowRight size={20} />
                      </button>
                    </div>
                  </form>
                </motion.div>
              ) : (
                <motion.div 
                  key="step2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-white p-8 md:p-12 rounded-[2.5rem] premium-shadow border border-gray-100"
                >
                  <h2 className="text-2xl font-display font-bold text-dark-navy mb-4">Payment Method</h2>
                  <p className="text-gray-400 text-sm mb-8">Select a secure payment method to finish your order.</p>
                  
                  <div className="space-y-4 mb-10">
                    <label className={`flex items-center justify-between p-6 rounded-2xl border-2 cursor-pointer transition-all ${paymentMethod === 'cod' ? 'border-brand-blue bg-brand-blue/5' : 'border-gray-100 hover:border-gray-200'}`}>
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-full ${paymentMethod === 'cod' ? 'bg-brand-blue text-white' : 'bg-gray-100 text-gray-400'}`}>
                          <Truck size={24} />
                        </div>
                        <div>
                          <p className="font-bold text-dark-navy">Cash on Delivery (COD)</p>
                          <p className="text-xs text-gray-400 font-medium">Pay securely at your doorstep</p>
                        </div>
                      </div>
                      <input 
                        type="radio" 
                        name="payment" 
                        checked={paymentMethod === 'cod'}
                        onChange={() => setPaymentMethod('cod')}
                        className="w-5 h-5 text-brand-blue"
                      />
                    </label>

                    <label className={`flex items-center justify-between p-6 rounded-2xl border-2 cursor-pointer transition-all ${paymentMethod === 'upi' ? 'border-brand-blue bg-brand-blue/5' : 'border-gray-100 hover:border-gray-200'}`}>
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-full ${paymentMethod === 'upi' ? 'bg-brand-blue text-white' : 'bg-gray-100 text-gray-400'}`}>
                          <CreditCard size={24} />
                        </div>
                        <div>
                          <p className="font-bold text-dark-navy">Manual UPI Transfer</p>
                          <p className="text-xs text-gray-400 font-medium">GPay, PhonePe, Paytm (No PG Fees)</p>
                        </div>
                      </div>
                      <input 
                        type="radio" 
                        name="payment" 
                        checked={paymentMethod === 'upi'}
                        onChange={() => setPaymentMethod('upi')}
                        className="w-5 h-5 text-brand-blue"
                      />
                    </label>
                  </div>

                  {paymentMethod === 'upi' && (
                    <div className="mb-10 p-6 bg-gray-50 rounded-3xl border border-gray-100 flex flex-col items-center text-center">
                       <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Scan or Pay to ID</p>
                       <p className="text-2xl font-black text-brand-blue mb-2">trendifyhub@okicici</p>
                       <p className="text-xs text-gray-500 max-w-xs leading-relaxed italic">
                         After payment, please take a screenshot. You can share it with us on WhatsApp with your Order ID for instant confirmation.
                       </p>
                    </div>
                  )}

                  <div className="flex flex-col gap-4">
                    <button 
                      onClick={handlePlaceOrder}
                      className="w-full bg-brand-blue text-white font-black py-5 rounded-2xl flex items-center justify-center gap-2 hover:bg-brand-blue/90 transition-all shadow-lg shadow-brand-blue/20"
                    >
                      Place Order & Pay <ArrowRight size={20} />
                    </button>
                    <button 
                      onClick={() => setStep(1)}
                      className="text-xs font-bold text-gray-400 hover:text-dark-navy transition-colors py-2"
                    >
                      Back to Shipping Address
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* RIGHT: Summary Sidebar */}
          <div className="lg:col-span-5 lg:w-[400px]">
             <div className="bg-dark-navy text-white p-8 md:p-10 rounded-[2.5rem] premium-shadow sticky top-32">
                <h3 className="text-xl font-display font-bold mb-8">Order Summary</h3>
                
                <div className="space-y-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar mb-8">
                  {state.items.map(item => (
                    <div key={item.id} className="flex gap-4 items-center">
                      <div className="w-16 h-16 bg-white/10 rounded-xl overflow-hidden shrink-0">
                         <img src={item.image} alt="item" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                         <h4 className="text-sm font-bold truncate">{item.name}</h4>
                         <p className="text-xs text-gray-400">{item.quantity} x {formatCurrency(item.price)}</p>
                      </div>
                      <span className="font-bold text-sm">{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-4 border-t border-white/10 pt-8 mb-8">
                  <div className="flex justify-between text-sm font-medium text-gray-400">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium text-gray-400">
                    <span>Shipping</span>
                    <span className="text-brand-blue">{shipping === 0 ? "FREE" : formatCurrency(shipping)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium text-gray-400">
                    <span>Tax (GST 18%)</span>
                    <span>{formatCurrency(tax)}</span>
                  </div>
                  <div className="flex justify-between items-end pt-2">
                    <span className="text-xs font-black uppercase tracking-widest text-gray-300">Total Payable</span>
                    <span className="text-3xl font-black text-brand-blue">{formatCurrency(total)}</span>
                  </div>
                </div>

                <div className="space-y-4 pt-4">
                  <div className="flex items-center gap-3 text-xs text-gray-400 font-medium">
                    <ShieldCheck className="text-brand-blue" size={18} />
                    Verified & Encrypted Transaction
                  </div>
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/10 italic text-[10px] text-gray-400 leading-relaxed">
                    <MessageSquareQuote className="inline mr-2" size={14} />
                    &quot;Best quality electronics I&apos;ve bought online in a long time. Highly recommend TrendifyHub!&quot; — Rahul S.
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
