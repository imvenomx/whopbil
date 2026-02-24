import { NextResponse } from "next/server";
import { readConfig, getCustomerById } from "@/lib/configStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Charge a tokenized card (for recurring billing)
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
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const {
      customerId,
      token,
      amount,
      currency = "EUR",
      description = "Subscription Payment"
    } = body;

    if (!customerId || !token || !amount) {
      return NextResponse.json(
        { error: "customerId, token, and amount are required" },
        { status: 400 }
      );
    }

    // Get customer to verify and get SumUp customer ID
    const customer = await getCustomerById(customerId);
    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // Verify the token belongs to this customer
    const activeInstrument = customer.paymentInstruments?.find(
      i => i.token === token && i.active
    );

    if (!activeInstrument) {
      return NextResponse.json(
        { error: "Invalid or inactive payment token" },
        { status: 400 }
      );
    }

    // Create checkout for recurring payment
    const checkoutPayload = {
      checkout_reference: `sub_${Date.now()}`,
      amount: parseFloat(amount),
      currency,
      merchant_code: config.merchantCode,
      description,
    };

    console.log("[POST /api/checkout/charge-token] Creating checkout:", checkoutPayload);

    const checkoutResponse = await fetch("https://api.sumup.com/v0.1/checkouts", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(checkoutPayload),
    });

    if (!checkoutResponse.ok) {
      const errorData = await checkoutResponse.json().catch(() => ({}));
      console.error("[POST /api/checkout/charge-token] Checkout creation error:", errorData);
      return NextResponse.json(
        { error: "Failed to create checkout", details: errorData },
        { status: checkoutResponse.status }
      );
    }

    const checkoutData = await checkoutResponse.json();
    console.log("[POST /api/checkout/charge-token] Checkout created:", checkoutData.id);

    // Process the checkout with the saved token
    // Per SumUp docs: token and customer_id are required for recurring payments
    const processPayload = {
      payment_type: "card",
      installments: 1,
      token: token,
      customer_id: customer.sumupCustomerId,
    };

    console.log("[POST /api/checkout/charge-token] Processing checkout with token");

    const processResponse = await fetch(
      `https://api.sumup.com/v0.1/checkouts/${checkoutData.id}`,
      {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(processPayload),
      }
    );

    if (!processResponse.ok) {
      const errorData = await processResponse.json().catch(() => ({}));
      console.error("[POST /api/checkout/charge-token] Process error:", errorData);
      return NextResponse.json(
        {
          error: "Failed to process payment",
          details: errorData,
          checkoutId: checkoutData.id,
        },
        { status: processResponse.status }
      );
    }

    const processData = await processResponse.json();
    console.log("[POST /api/checkout/charge-token] Payment result:", processData);

    // Check if payment was successful
    const isSuccess = processData.status === "PAID";

    return NextResponse.json({
      success: isSuccess,
      checkoutId: checkoutData.id,
      status: processData.status,
      transactionCode: processData.transaction_code || null,
      transactionId: processData.transaction_id || null,
      amount: processData.amount,
      currency: processData.currency,
    });
  } catch (e) {
    console.error("[POST /api/checkout/charge-token] error:", e);
    return NextResponse.json(
      { error: "Internal server error", details: e.message },
      { status: 500 }
    );
  }
}
