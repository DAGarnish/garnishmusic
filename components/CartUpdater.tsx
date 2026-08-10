"use client";

import { useEffect } from "react";
import { useCart } from "./CartContext";

export default function CartUpdater() {
  const { itemCount } = useCart();

  useEffect(() => {
    // Find all cart amount badges in the static header HTML and update them
    const amountElements = document.querySelectorAll(".mkd-cart-amount");
    amountElements.forEach((el) => {
      el.textContent = itemCount.toString();
    });
  }, [itemCount]);

  return null;
}
