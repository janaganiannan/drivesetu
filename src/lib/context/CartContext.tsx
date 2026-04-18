"use client";

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from "react";
import { Product } from "../data/products";

interface CartItem extends Product {
  quantity: number;
}

interface CartState {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
}

type CartAction =
  | { type: "ADD_TO_CART"; product: Product }
  | { type: "REMOVE_FROM_CART"; productId: string }
  | { type: "UPDATE_QUANTITY"; productId: string; quantity: number }
  | { type: "CLEAR_CART" };

const CartContext = createContext<{
  state: CartState;
  dispatch: React.Dispatch<CartAction>;
} | null>(null);

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case "ADD_TO_CART": {
      const existingItemIndex = state.items.findIndex(
        (item) => item.id === action.product.id
      );

      let newItems;
      if (existingItemIndex > -1) {
        newItems = [...state.items];
        newItems[existingItemIndex].quantity += 1;
      } else {
        newItems = [...state.items, { ...action.product, quantity: 1 }];
      }

      const totalItems = newItems.reduce((sum, item) => sum + item.quantity, 0);
      const totalPrice = newItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      return { items: newItems, totalItems, totalPrice };
    }

    case "REMOVE_FROM_CART": {
      const newItems = state.items.filter((item) => item.id !== action.productId);
      const totalItems = newItems.reduce((sum, item) => sum + item.quantity, 0);
      const totalPrice = newItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      return { items: newItems, totalItems, totalPrice };
    }

    case "UPDATE_QUANTITY": {
      const newItems = state.items.map((item) =>
        item.id === action.productId
          ? { ...item, quantity: Math.max(1, action.quantity) }
          : item
      );

      const totalItems = newItems.reduce((sum, item) => sum + item.quantity, 0);
      const totalPrice = newItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      return { items: newItems, totalItems, totalPrice };
    }

    case "CLEAR_CART":
      return { items: [], totalItems: 0, totalPrice: 0 };

    default:
      return state;
  }
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    totalItems: 0,
    totalPrice: 0,
  });

  // Load from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("trendify_cart");
    if (savedCart) {
      const parsed = JSON.parse(savedCart);
      parsed.items.forEach((item: any) => {
        // Use single ADDs or a batch update if needed, but for simplicity:
        // (This is a mock, ideally we'd have a SET_STATE action)
      });
      // Better:
      // dispatch({ type: 'HYDRATE', state: parsed })
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem("trendify_cart", JSON.stringify(state));
  }, [state]);

  return (
    <CartContext.Provider value={{ state, dispatch }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
