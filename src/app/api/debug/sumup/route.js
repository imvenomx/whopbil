import { NextResponse } from "next/server";
import { readConfig } from "@/lib/configStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Debug endpoint to test SumUp API connectivity
export async function GET() {
  try {
    const config = await readConfig();

    if (!config.apiKey) {
      return NextResponse.json({ error: "No API key configured" }, { status: 500 });
    }

    // Test 1: Get merchant profile
    const merchantRes = await fetch("https://api.sumup.com/v0.1/me", {
      headers: {
        "Authorization": `Bearer ${config.apiKey}`,
      },
    });

    const merchantData = await merchantRes.json();

    // Test 2: Try to create a simple checkout
    const checkoutRes = await fetch("https://api.sumup.com/v0.1/checkouts", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        checkout_reference: `test_${Date.now()}`,
        amount: 1.00,
        currency: "EUR",
        merchant_code: config.merchantCode,
        description: "Test checkout",
      }),
    });

    const checkoutData = await checkoutRes.json();

    return NextResponse.json({
      merchant: {
        status: merchantRes.status,
        data: merchantData,
      },
      checkout: {
        status: checkoutRes.status,
        data: checkoutData,
      },
      config: {
        hasMerchantCode: !!config.merchantCode,
        merchantCode: config.merchantCode,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
