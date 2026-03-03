import { NextResponse } from "next/server";
import {
  readConfig,
  getCustomerById,
  updateCustomer,
  addSubscription,
  calculateNextChargeDate
} from "@/lib/configStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Complete tokenization after card SDK success
// Fetches payment instruments and creates subscription
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
      checkoutId,
      customerId,
      amount,
      interval = "monthly",
      intervalCount = 1,
      checkoutPageId = null,
      metadata = {},
      email = null,
    } = body;

    if (!checkoutId || !customerId) {
      return NextResponse.json(
        { error: "checkoutId and customerId are required" },
        { status: 400 }
      );
    }

    if (!amount) {
      return NextResponse.json(
        { error: "Amount is required" },
        { status: 400 }
      );
    }

    // Get customer
    const customer = await getCustomerById(customerId);
    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // Verify checkout status
    const checkoutResponse = await fetch(`https://api.sumup.com/v0.1/checkouts/${checkoutId}`, {
      headers: {
        "Authorization": `Bearer ${config.apiKey}`,
      },
    });

    if (!checkoutResponse.ok) {
      const errorData = await checkoutResponse.json().catch(() => ({}));
      console.error("[POST /api/checkout/complete-tokenization] Checkout fetch error:", errorData);
      return NextResponse.json(
        { error: "Failed to verify checkout", details: errorData },
        { status: checkoutResponse.status }
      );
    }

    const checkoutData = await checkoutResponse.json();
    console.log("[POST /api/checkout/complete-tokenization] Checkout status:", checkoutData.status);
    console.log("[POST /api/checkout/complete-tokenization] Full data:", JSON.stringify(checkoutData, null, 2));

    // Check for success status
    const successStates = ["PAID", "SUCCESSFUL", "COMPLETED", "CAPTURED"];
    if (!successStates.includes(checkoutData.status)) {
      return NextResponse.json(
        { error: "Checkout is not paid", status: checkoutData.status, details: checkoutData },
        { status: 400 }
      );
    }

    const hasToken = checkoutData.payment_instrument?.token;

    // Fetch payment instruments for this customer
    const instrumentsResponse = await fetch(
      `https://api.sumup.com/v0.1/customers/${customer.sumupCustomerId}/payment-instruments`,
      {
        headers: {
          "Authorization": `Bearer ${config.apiKey}`,
        },
      }
    );

    if (!instrumentsResponse.ok) {
      const errorData = await instrumentsResponse.json().catch(() => ({}));
      console.error("[POST /api/checkout/complete-tokenization] Payment instruments fetch error:", errorData);
      return NextResponse.json(
        { error: "Failed to fetch payment instruments", details: errorData },
        { status: instrumentsResponse.status }
      );
    }

    const instrumentsData = await instrumentsResponse.json();
    console.log("[POST /api/checkout/complete-tokenization] Payment instruments:", instrumentsData);

    // Extract payment instruments array
    const instruments = Array.isArray(instrumentsData)
      ? instrumentsData
      : (instrumentsData.payment_instruments || []);

    // If no instruments from API, use the token from checkout directly
    let latestInstrument;
    if (instruments.length === 0) {
      if (hasToken) {
        console.log("[POST /api/checkout/complete-tokenization] Using token from checkout response");
        latestInstrument = { token: checkoutData.payment_instrument.token };
      } else {
        return NextResponse.json(
          { error: "No payment instruments found" },
          { status: 400 }
        );
      }
    } else {
      // Get the most recent instrument (the one just added)
      latestInstrument = instruments[instruments.length - 1] || instruments[0];
    }

    // Format payment instrument for storage
    const paymentInstrument = {
      token: latestInstrument.token,
      card_type: latestInstrument.card?.type || latestInstrument.type || "UNKNOWN",
      last_4_digits: latestInstrument.card?.last_4_digits || latestInstrument.last_4_digits || "****",
      expiry_month: latestInstrument.card?.expiry_month || "",
      expiry_year: latestInstrument.card?.expiry_year || "",
      active: true,
    };

    // Update customer with new payment instrument
    const existingInstruments = customer.paymentInstruments || [];
    // Deactivate previous instruments
    const updatedInstruments = existingInstruments.map(i => ({ ...i, active: false }));
    updatedInstruments.push(paymentInstrument);

    // Update customer with new payment instrument and real email if provided
    const customerUpdate = {
      paymentInstruments: updatedInstruments,
    };
    if (email && email.includes("@") && !email.includes("@placeholder.local")) {
      customerUpdate.email = email;
    }
    await updateCustomer(customerId, customerUpdate);

    // Create subscription
    const subscription = await addSubscription({
      customerId,
      checkoutPageId,
      amount: parseFloat(amount),
      currency: "EUR",
      interval,
      intervalCount,
      nextChargeDate: calculateNextChargeDate(interval, intervalCount),
      metadata: {
        ...metadata,
        initialCheckoutId: checkoutId,
      },
    });

    console.log("[POST /api/checkout/complete-tokenization] Subscription created:", subscription);

    return NextResponse.json({
      success: true,
      subscription,
      paymentInstrument: {
        card_type: paymentInstrument.card_type,
        last_4_digits: paymentInstrument.last_4_digits,
      },
    });
  } catch (e) {
    console.error("[POST /api/checkout/complete-tokenization] error:", e);
    return NextResponse.json(
      { error: "Internal server error", details: e.message },
      { status: 500 }
    );
  }
}
