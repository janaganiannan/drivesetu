"use client";

import React from "react";
import Link from "next/link";
import { Heart, ShoppingCart, Star, Eye } from "lucide-react";
import { Product } from "@/lib/data/products";
import { formatCurrency, calculateDiscount } from "@/lib/utils/format";
import { useCart } from "@/lib/context/CartContext";
import { useWishlist } from "@/lib/context/WishlistContext";
import { motion } from "framer-motion";

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { dispatch } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const discount = calculateDiscount(product.price, product.mrp);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      className="group relative bg-white rounded-[2rem] overflow-hidden border border-gray-100 premium-shadow hover:shadow-2xl transition-all duration-500"
    >
      {/* Badges */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        {discount > 0 && (
          <span className="bg-accent-orange text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">
            {discount}% OFF
          </span>
        )}
        {product.isBestSeller && (
          <span className="bg-dark-navy text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">
            Bestseller
          </span>
        )}
      </div>

      {/* Wishlist Toggle */}
      <button
        onClick={() => toggleWishlist(product)}
        className={`absolute top-4 right-4 z-10 p-2.5 rounded-full backdrop-blur-md transition-all duration-300 ${
          isInWishlist(product.id)
            ? "bg-red-500 text-white"
            : "bg-white/80 text-dark-navy hover:bg-white shadow-sm"
        }`}
      >
        <Heart size={18} fill={isInWishlist(product.id) ? "currentColor" : "none"} />
      </button>

      {/* Product Image Area */}
      <Link href={`/product/${product.id}`} className="block relative aspect-square overflow-hidden bg-gray-50">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
        />
        {/* Quick View Overlay */}
        <div className="absolute inset-0 bg-dark-navy/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
          <div className="bg-white p-3 rounded-full text-dark-navy hover:bg-brand-blue hover:text-white transition-all transform hover:scale-110">
            <Eye size={20} />
          </div>
        </div>
      </Link>

      {/* Info Part */}
      <div className="p-6 pt-5">
        <div className="flex justify-between items-start mb-2">
          <p className="text-[10px] font-black text-brand-blue uppercase tracking-[0.2em]">
            {product.category}
          </p>
          <div className="flex items-center gap-1 text-xs font-bold text-gray-500">
            <Star size={12} className="text-yellow-400 fill-yellow-400" />
            <span>{product.rating}</span>
            <span className="text-gray-300">({product.reviews})</span>
          </div>
        </div>

        <Link href={`/product/${product.id}`}>
          <h3 className="text-lg font-display font-bold text-dark-navy hover:text-brand-blue transition-colors line-clamp-1 mb-2">
            {product.name}
          </h3>
        </Link>
        
        <p className="text-sm text-gray-500 line-clamp-2 mb-4 h-10">
          {product.description}
        </p>

        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl font-black text-dark-navy">{formatCurrency(product.price)}</span>
              {product.mrp > product.price && (
                <span className="text-sm text-gray-400 line-through font-medium">
                  {formatCurrency(product.mrp)}
                </span>
              )}
            </div>
            <p className="text-[10px] text-green-600 font-bold uppercase tracking-wider">
              Free Delivery
            </p>
          </div>

          <button
            onClick={() => dispatch({ type: "ADD_TO_CART", product })}
            className="flex items-center justify-center p-3.5 bg-brand-blue text-white rounded-2xl hover:bg-brand-blue/90 transform hover:scale-105 transition-all shadow-lg shadow-brand-blue/20"
            title="Add to Cart"
          >
            <ShoppingCart size={20} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
