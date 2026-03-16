import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const { planId, email, metadata } = body;

    if (!planId) {
      return NextResponse.json(
        { success: false, error: "Plan ID is required" },
        { status: 400 }
      );
    }

    const whopApiKey = process.env.WHOP_API_KEY;
    if (!whopApiKey) {
      console.error("[Whop] WHOP_API_KEY not configured");
      return NextResponse.json(
        { success: false, error: "Payment system not configured" },
        { status: 500 }
      );
    }

    // Create checkout configuration with Whop API
    const response = await fetch("https://api.whop.com/api/v1/checkout_configurations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${whopApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        plan_id: planId,
        mode: "payment",
        metadata: {
          email: email || undefined,
          ...metadata,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[Whop] API error:", data);
      return NextResponse.json(
        { success: false, error: data.message || "Failed to create checkout session" },
        { status: response.status }
      );
    }

    console.log("[Whop] Checkout config created:", data.id);

    return NextResponse.json({
      success: true,
      sessionId: data.id,
      purchaseUrl: data.purchase_url,
    });

  } catch (error) {
    console.error("[Whop] Create session error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
