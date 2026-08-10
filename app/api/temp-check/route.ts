import { NextResponse } from "next/server";
import { getPayloadClient } from "../../../lib/get-payload";

export async function GET() {
  const payload = await getPayloadClient();
  const products = await payload.find({
    collection: "products",
    where: { slug: { like: "electronic-dj" } },
    limit: 100,
    depth: 1
  });

  return NextResponse.json({
    products: products.docs.map((d: any) => ({
      slug: d.slug,
      id: d.id,
      site: typeof d.site === "object" ? d.site?.domain : d.site,
      price: d.price,
      variations: d.variations
    }))
  });
}
