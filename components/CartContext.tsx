"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type CartItem = {
  productId: string | number;
  productSlug: string;
  name: string;
  price: number;
  quantity: number;
  variationId?: string;
  variationName?: string;
  imageUrl?: string;
};

type CartContextType = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string | number, variationId?: string) => void;
  updateQuantity: (productId: string | number, quantity: number, variationId?: string) => void;
  clearCart: () => void;
  cartTotal: number;
  itemCount: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const savedCart = localStorage.getItem("gmp_cart");
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (err) {
        console.error("Failed to parse cart from local storage", err);
      }
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("gmp_cart", JSON.stringify(items));
    }
  }, [items, isMounted]);

  const addItem = (newItem: CartItem) => {
    setItems((prevItems) => {
      const existingItemIndex = prevItems.findIndex(
        (item) => item.productId === newItem.productId && item.variationId === newItem.variationId
      );

      if (existingItemIndex >= 0) {
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex].quantity += newItem.quantity;
        return updatedItems;
      }
      return [...prevItems, newItem];
    });
  };

  const removeItem = (productId: string | number, variationId?: string) => {
    setItems((prevItems) =>
      prevItems.filter((item) => !(item.productId === productId && item.variationId === variationId))
    );
  };

  const updateQuantity = (productId: string | number, quantity: number, variationId?: string) => {
    if (quantity <= 0) {
      removeItem(productId, variationId);
      return;
    }
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.productId === productId && item.variationId === variationId
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const cartTotal = items.reduce((total, item) => total + item.price * item.quantity, 0);
  const itemCount = items.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        cartTotal,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
