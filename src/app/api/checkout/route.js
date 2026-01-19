import { NextResponse } from "next/server";
import { readConfig } from "@/lib/configStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const config = await readConfig();

    if (!config.apiKey) {
      return NextResponse.json(
        { error: "No SumUp API key configured" },
        { status: 500 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch (e) {
      body = {};
    }

    const amount = body.amount || parseFloat(config.price.replace(",", ".")) || 84.00;
    const currency = body.currency || "EUR";
    const description = body.description || "Payment";

    // Create checkout with SumUp API
    const checkoutResponse = await fetch("https://api.sumup.com/v0.1/checkouts", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        checkout_reference: `checkout_${Date.now()}`,
        amount,
        currency,
        description,
        merchant_code: config.merchantCode || undefined,
      }),
    });

    if (!checkoutResponse.ok) {
      const errorData = await checkoutResponse.json().catch(() => ({}));
      console.error("[POST /api/checkout] SumUp API error:", errorData);
      return NextResponse.json(
        { error: "Failed to create checkout", details: errorData },
        { status: checkoutResponse.status }
      );
    }

    const checkoutData = await checkoutResponse.json();

    return NextResponse.json({
      checkoutId: checkoutData.id,
      amount: checkoutData.amount,
      currency: checkoutData.currency,
      status: checkoutData.status,
    });
  } catch (e) {
    console.error("[POST /api/checkout] error:", e);
    return NextResponse.json(
      { error: "Internal server error", details: e.message },
      { status: 500 }
    );
  }
}

// Get checkout status
export async function GET(request) {
  try {
    const config = await readConfig();

    if (!config.apiKey) {
      return NextResponse.json(
        { error: "No SumUp API key configured" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const checkoutId = searchParams.get("id");

    if (!checkoutId) {
      return NextResponse.json(
        { error: "Checkout ID is required" },
        { status: 400 }
      );
    }

    const checkoutResponse = await fetch(`https://api.sumup.com/v0.1/checkouts/${checkoutId}`, {
      headers: {
        "Authorization": `Bearer ${config.apiKey}`,
      },
    });

    if (!checkoutResponse.ok) {
      const errorData = await checkoutResponse.json().catch(() => ({}));
      return NextResponse.json(
        { error: "Failed to get checkout", details: errorData },
        { status: checkoutResponse.status }
      );
    }

    const checkoutData = await checkoutResponse.json();

    return NextResponse.json(checkoutData);
  } catch (e) {
    console.error("[GET /api/checkout] error:", e);
    return NextResponse.json(
      { error: "Internal server error", details: e.message },
      { status: 500 }
    );
  }
}
