import { NextResponse } from "next/server";
import { getPayloadClient } from "../../../lib/get-payload";

export async function GET() {
  const payload = await getPayloadClient();
  const pages = await payload.find({
    collection: "pages",
    where: { slug: { equals: "courses/ableton-live" } },
    limit: 1
  });

  if (pages.docs.length === 0) {
    return NextResponse.json({ error: "Not found" });
  }

  const doc = pages.docs[0];
  return NextResponse.json({
    content: (doc as any).wpRawContent,
  });
}
