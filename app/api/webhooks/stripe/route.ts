import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getPayloadClient } from "../../../../lib/get-payload";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-06-20",
});

export async function POST(req: Request) {
  const payload = await getPayloadClient();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature provided" }, { status: 400 });
  }

  let event;

  try {
    const body = await req.text();
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ""
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: "Webhook Error" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    // Optional: Retrieve line items to save detailed order info
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
    
    // Construct order details based on Payload's Orders collection
    const orderData: any = {
      orderNumber: `ORD-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      status: "processing",
      total: (session.amount_total || 0) / 100,
      currency: session.currency?.toUpperCase() || "GBP",
      orderDate: new Date().toISOString(),
      // Link to site ID if passed via metadata
      // site: session.metadata?.siteId 
    };

    try {
      await payload.create({
        collection: "orders",
        data: orderData,
      });
      console.log(`Created order for session ${session.id}`);
    } catch (err) {
      console.error("Failed to create order in Payload", err);
      return NextResponse.json({ error: "Failed to process order internally" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
