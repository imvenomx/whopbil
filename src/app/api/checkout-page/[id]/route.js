import { NextResponse } from "next/server";
import { getCheckoutPages } from "@/lib/configStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const pages = await getCheckoutPages();

    // Find page by ID or slug
    const page = pages.find((p) => p.id === id || p.slug === id);

    if (!page) {
      return NextResponse.json(
        { error: "Checkout page not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(page, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    console.error("[GET /api/checkout-page/[id]]", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
