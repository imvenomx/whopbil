import { NextResponse } from "next/server";
import { readConfig, getCustomerByEmail, addCustomer } from "@/lib/configStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Create a tokenization checkout (for saving card with mandate)
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

    const { email, name, amount, currency = "EUR", description = "Subscription" } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    if (!amount) {
      return NextResponse.json(
        { error: "Amount is required" },
        { status: 400 }
      );
    }

    // Get or create customer
    let customer = await getCustomerByEmail(email);

    if (!customer) {
      // Create customer in SumUp
      const sumupCustomerResponse = await fetch("https://api.sumup.com/v0.1/customers", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer_id: `cust_${Date.now()}`,
          personal_details: {
            email,
            first_name: name || "",
          },
        }),
      });

      if (!sumupCustomerResponse.ok) {
        const errorText = await sumupCustomerResponse.text();
        console.error("[POST /api/checkout/tokenize] SumUp customer creation error:", sumupCustomerResponse.status, errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { raw: errorText };
        }
        return NextResponse.json(
          { error: `Failed to create customer: ${errorData.message || errorData.error_code || errorText}`, details: errorData },
          { status: sumupCustomerResponse.status }
        );
      }

      const sumupCustomerData = await sumupCustomerResponse.json();
      console.log("[POST /api/checkout/tokenize] SumUp customer created:", sumupCustomerData);

      // Store customer locally
      customer = await addCustomer({
        sumupCustomerId: sumupCustomerData.customer_id,
        email,
        name: name || "",
        paymentInstruments: [],
      });
    }

    // Try to create checkout with mandate for tokenization
    let checkoutPayload = {
      checkout_reference: `token_${Date.now()}`,
      amount: parseFloat(amount),
      currency,
      description,
      customer_id: customer.sumupCustomerId,
      mandate: {
        type: "recurrent",
        merchant_code: config.merchantCode,
      },
    };

    console.log("[POST /api/checkout/tokenize] Creating checkout with mandate:", checkoutPayload);

    let checkoutResponse = await fetch("https://api.sumup.com/v0.1/checkouts", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(checkoutPayload),
    });

    let tokenizationEnabled = true;

    // If mandate checkout fails, try regular checkout (without tokenization)
    if (!checkoutResponse.ok) {
      const errorText = await checkoutResponse.text();
      console.warn("[POST /api/checkout/tokenize] Mandate checkout failed, trying regular checkout:", errorText);

      tokenizationEnabled = false;

      // Fallback to regular checkout without mandate
      checkoutPayload = {
        checkout_reference: `checkout_${Date.now()}`,
        amount: parseFloat(amount),
        currency,
        description,
        merchant_code: config.merchantCode,
      };

      console.log("[POST /api/checkout/tokenize] Creating regular checkout:", checkoutPayload);

      checkoutResponse = await fetch("https://api.sumup.com/v0.1/checkouts", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(checkoutPayload),
      });

      if (!checkoutResponse.ok) {
        const fallbackErrorText = await checkoutResponse.text();
        console.error("[POST /api/checkout/tokenize] Regular checkout also failed:", fallbackErrorText);
        let errorData;
        try {
          errorData = JSON.parse(fallbackErrorText);
        } catch {
          errorData = { raw: fallbackErrorText };
        }
        return NextResponse.json(
          { error: `Failed to create checkout: ${errorData.message || errorData.error_code || fallbackErrorText}`, details: errorData },
          { status: checkoutResponse.status }
        );
      }
    }

    const checkoutData = await checkoutResponse.json();
    console.log("[POST /api/checkout/tokenize] Checkout created:", checkoutData, "tokenization:", tokenizationEnabled);

    return NextResponse.json({
      checkoutId: checkoutData.id,
      customerId: customer.id,
      sumupCustomerId: customer.sumupCustomerId,
      amount: checkoutData.amount,
      currency: checkoutData.currency,
      status: checkoutData.status,
      tokenizationEnabled,
    });
  } catch (e) {
    console.error("[POST /api/checkout/tokenize] error:", e);
    return NextResponse.json(
      { error: "Internal server error", details: e.message },
      { status: 500 }
    );
  }
}
