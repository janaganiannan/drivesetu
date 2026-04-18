"use client";

import React, { useState, useMemo } from "react";
import { Product } from "@/lib/data/products";
import ProductCard from "./ProductCard";
import FilterSidebar from "./FilterSidebar";
import { Search } from "lucide-react";

interface ProductGridProps {
  initialProducts: Product[];
  title: string;
}

const ProductGrid: React.FC<ProductGridProps> = ({ initialProducts, title }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    priceRange: [0, 100000] as [number, number],
    rating: null as number | null,
    sortBy: "popular"
  });

  const filteredProducts = useMemo(() => {
    let result = [...initialProducts];

    // Search filter
    if (searchQuery) {
      result = result.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Rating filter
    if (filters.rating) {
      result = result.filter(p => p.rating >= (filters.rating as number));
    }

    // Sort
    switch (filters.sortBy) {
      case "price-low":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        result.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        result.sort((a, b) => b.rating - a.rating);
        break;
      case "newest":
        // In a real app we'd use date, here we'll just reverse
        result.reverse();
        break;
      default:
        // Already popular/default
        break;
    }

    return result;
  }, [initialProducts, searchQuery, filters]);

  const handleFilterChange = (newFilters: any) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const clearFilters = () => {
    setFilters({
      priceRange: [0, 100000],
      rating: null,
      sortBy: "popular"
    });
    setSearchQuery("");
  };

  return (
    <div className="flex flex-col lg:flex-row gap-12">
      {/* Sidebar - Desktop */}
      <div className="hidden lg:block">
        <FilterSidebar 
          onFilterChange={handleFilterChange} 
          onClear={clearFilters}
          activeFilters={filters}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 space-y-8">
        {/* Search & Results Info */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder={`Search in ${title}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 border-none rounded-2xl py-2.5 pl-11 pr-4 focus:ring-2 focus:ring-brand-blue/10 text-sm font-medium"
            />
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            {filteredProducts.length} Results Found
          </p>
        </div>

        {/* The Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-[3rem] border border-dashed border-gray-200">
            <div className="mb-4 text-gray-300">
               <Search size={48} />
            </div>
            <h3 className="text-xl font-display font-bold text-dark-navy mb-2">No products found</h3>
            <p className="text-gray-500 mb-6">Try adjusting your filters or search query.</p>
            <button 
              onClick={clearFilters}
              className="bg-brand-blue text-white px-6 py-2 rounded-xl font-bold"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductGrid;
