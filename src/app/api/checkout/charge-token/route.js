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

    // Create checkout for recurring payment with customer_id
    const checkoutPayload = {
      checkout_reference: `sub_${Date.now()}`,
      amount: parseFloat(amount),
      currency,
      merchant_code: config.merchantCode,
      description,
      customer_id: customer.sumupCustomerId,
    };

    console.log("[charge-token] Creating checkout:", JSON.stringify(checkoutPayload, null, 2));
    console.log("[charge-token] Customer sumupCustomerId:", customer.sumupCustomerId);
    console.log("[charge-token] Token:", token);

    const checkoutResponse = await fetch("https://api.sumup.com/v0.1/checkouts", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(checkoutPayload),
    });

    const checkoutText = await checkoutResponse.text();
    let checkoutData;
    try {
      checkoutData = JSON.parse(checkoutText);
    } catch {
      checkoutData = { raw: checkoutText };
    }

    if (!checkoutResponse.ok) {
      console.error("[charge-token] Checkout creation error:", checkoutResponse.status, checkoutData);
      return NextResponse.json(
        {
          error: `Failed to create checkout: ${checkoutData.message || checkoutData.error_code || "Unknown error"}`,
          details: checkoutData,
          step: "checkout_creation",
        },
        { status: checkoutResponse.status }
      );
    }

    console.log("[charge-token] Checkout created:", checkoutData.id);

    // Process the checkout with the saved token
    // Per SumUp docs: token and customer_id are required for recurring payments
    const processPayload = {
      payment_type: "card",
      token: token,
      customer_id: customer.sumupCustomerId,
    };

    console.log("[charge-token] Processing with payload:", JSON.stringify(processPayload, null, 2));

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

    const processText = await processResponse.text();
    let processData;
    try {
      processData = JSON.parse(processText);
    } catch {
      processData = { raw: processText };
    }

    console.log("[charge-token] Process response:", processResponse.status, JSON.stringify(processData, null, 2));

    if (!processResponse.ok) {
      return NextResponse.json(
        {
          error: `Failed to process payment: ${processData.message || processData.error_code || "Unknown error"}`,
          details: processData,
          checkoutId: checkoutData.id,
          step: "payment_processing",
        },
        { status: processResponse.status }
      );
    }

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
