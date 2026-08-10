"use client";

import React, { useState } from "react";
import { useCart } from "./CartContext";

type Variation = {
  name: string;
  price: number;
  id: string; // The variation object _id or generated id
};

export default function AddToCart({ 
  product,
  variations = []
}: { 
  product: any,
  variations?: Variation[]
}) {
  const { addItem } = useCart();
  const [selectedVariationId, setSelectedVariationId] = useState<string>(variations.length > 0 ? variations[0].id : "");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const selectedVariation = variations.find((v) => v.id === selectedVariationId);
  const displayPrice = selectedVariation ? selectedVariation.price : product.price;

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      productSlug: product.slug,
      name: product.name,
      price: displayPrice,
      quantity,
      variationId: selectedVariation?.id,
      variationName: selectedVariation?.name,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 3000);
  };

  return (
    <div style={{ marginTop: "2rem", padding: "1.5rem", border: "1px solid #eee", borderRadius: "8px", background: "#f9f9f9" }}>
      {variations.length > 0 && (
        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>Select Option:</label>
          <select 
            value={selectedVariationId} 
            onChange={(e) => setSelectedVariationId(e.target.value)}
            style={{ width: "100%", padding: "0.75rem", border: "1px solid #ccc", borderRadius: "4px" }}
          >
            {variations.map((v) => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
        </div>
      )}
      
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
        <p style={{ fontSize: "1.5rem", fontWeight: "bold", margin: 0 }}>
          {new Intl.NumberFormat("en-GB", { style: "currency", currency: product.currency || "GBP" }).format(displayPrice)}
        </p>
      </div>

      <div style={{ display: "flex", gap: "1rem" }}>
        <input 
          type="number" 
          min="1" 
          value={quantity} 
          onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
          style={{ width: "80px", padding: "0.75rem", border: "1px solid #ccc", borderRadius: "4px" }}
        />
        <button 
          onClick={handleAddToCart}
          style={{ 
            flex: 1, 
            padding: "0.75rem 1.5rem", 
            background: added ? "#4BB543" : "#ce1713", 
            color: "#fff", 
            border: "none", 
            borderRadius: "4px", 
            cursor: "pointer",
            fontWeight: "bold",
            transition: "background 0.3s"
          }}
        >
          {added ? "Added!" : "Add to Cart"}
        </button>
      </div>
    </div>
  );
}
