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

    // Fetch plan price from Whop API
    const result = { ...page };
    if (page.whopPlanId && process.env.WHOP_API_KEY) {
      try {
        const planRes = await fetch(`https://api.whop.com/api/v5/plans/${page.whopPlanId}`, {
          headers: { Authorization: `Bearer ${process.env.WHOP_API_KEY}` },
        });
        if (planRes.ok) {
          const plan = await planRes.json();
          result.price = plan.initial_price != null
            ? (plan.initial_price / 100).toFixed(2)
            : plan.renewal_price != null
              ? (plan.renewal_price / 100).toFixed(2)
              : null;
          result.currency = plan.currency || "eur";
          result.productName = result.productName || plan.product?.name || plan.name || "Product";
          result.productImage = result.productImage || plan.product?.image || null;
        }
      } catch (e) {
        console.warn("[GET /api/checkout-page] Failed to fetch plan:", e.message);
      }
    }

    return NextResponse.json(result, {
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
