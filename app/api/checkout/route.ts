import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getPayloadClient } from "../../../lib/get-payload";

// This is a scaffold. You'll need to set STRIPE_SECRET_KEY in .env
export async function POST(req: Request) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
      apiVersion: "2026-07-29.dahlia",
    });

    const { items, siteDomain } = await req.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    const payload = await getPayloadClient();
    
    // In a real application, you MUST verify the prices of the items from the database
    // instead of trusting the prices sent from the client.
    
    const line_items = items.map((item: any) => ({
      price_data: {
        currency: "gbp",
        product_data: {
          name: item.name + (item.variationName ? ` - ${item.variationName}` : ""),
          metadata: {
            productId: item.productId,
            variationId: item.variationId || "",
          },
        },
        unit_amount: Math.round(item.price * 100), // Stripe expects amounts in cents/pence
      },
      quantity: item.quantity,
    }));

    // Generate Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      success_url: `https://${siteDomain || "localhost:3000"}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://${siteDomain || "localhost:3000"}/cart`,
      metadata: {
        siteDomain,
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error("Stripe Checkout Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
