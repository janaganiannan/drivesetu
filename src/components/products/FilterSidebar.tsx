"use client";

import React from "react";
import { Filter, Star, ChevronDown, RotateCcw } from "lucide-react";

interface FilterSidebarProps {
  onFilterChange: (filters: any) => void;
  onClear: () => void;
  activeFilters: {
    priceRange: [number, number];
    rating: number | null;
    sortBy: string;
  };
}

const FilterSidebar: React.FC<FilterSidebarProps> = ({ 
  onFilterChange, 
  onClear, 
  activeFilters 
}) => {
  return (
    <aside className="w-full lg:w-72 flex-shrink-0 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <div className="flex items-center gap-2 font-display font-bold text-dark-navy uppercase tracking-widest text-sm">
          <Filter size={18} className="text-brand-blue" />
          <span>Filters</span>
        </div>
        <button 
          onClick={onClear}
          className="text-xs font-bold text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors"
        >
          <RotateCcw size={14} /> Clear All
        </button>
      </div>

      {/* Sort By */}
      <div className="space-y-4">
        <h4 className="text-sm font-black font-display text-dark-navy uppercase tracking-wider">Sort By</h4>
        <div className="relative">
          <select 
            value={activeFilters.sortBy}
            onChange={(e) => onFilterChange({ sortBy: e.target.value })}
            className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 appearance-none focus:outline-none focus:ring-2 focus:ring-brand-blue/10 font-medium text-sm text-dark-navy"
          >
            <option value="popular">Popularity</option>
            <option value="newest">Newest First</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rating">Top Rated</option>
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
        </div>
      </div>

      {/* Price Range */}
      <div className="space-y-4">
        <h4 className="text-sm font-black font-display text-dark-navy uppercase tracking-wider">Price Range</h4>
        <div className="flex items-center gap-3">
          <input 
            type="number" 
            placeholder="Min"
            className="w-full bg-gray-50 border border-gray-100 rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/10"
          />
          <div className="w-4 h-px bg-gray-300"></div>
          <input 
            type="number" 
            placeholder="Max"
            className="w-full bg-gray-50 border border-gray-100 rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/10"
          />
        </div>
      </div>

      {/* Customer Ratings */}
      <div className="space-y-4">
        <h4 className="text-sm font-black font-display text-dark-navy uppercase tracking-wider">Customer Rating</h4>
        <div className="space-y-2">
          {[4, 3, 2, 1].map((star) => (
            <label key={star} className="flex items-center gap-3 cursor-pointer group">
              <input 
                type="radio" 
                name="rating" 
                checked={activeFilters.rating === star}
                onChange={() => onFilterChange({ rating: star })}
                className="w-4 h-4 rounded border-gray-300 text-brand-blue focus:ring-brand-blue"
              />
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    size={14} 
                    className={i < star ? "text-yellow-400 fill-yellow-400" : "text-gray-200"} 
                  />
                ))}
                <span className="text-xs font-bold text-gray-500 ml-1">& Up</span>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Trust Badge (Promo) */}
      <div className="p-6 bg-brand-blue rounded-3xl text-white">
        <h5 className="font-display font-bold mb-2">Weekend Sale!</h5>
        <p className="text-xs text-blue-100 mb-4 font-medium">Get an extra 10% off on all clothing items. Use code TRENDY10.</p>
        <button className="text-[10px] uppercase font-black tracking-widest bg-white text-brand-blue px-4 py-2 rounded-lg">
          Explore Now
        </button>
      </div>
    </aside>
  );
};

export default FilterSidebar;
