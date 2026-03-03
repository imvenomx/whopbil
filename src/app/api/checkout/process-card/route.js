import { NextResponse } from "next/server";
import { readConfig, getCustomerByEmail, addCustomer, updateCustomer } from "@/lib/configStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Process card payment directly (without widget) for tokenization
export async function POST(request) {
  try {
    const config = await readConfig();

    if (!config.apiKey) {
      return NextResponse.json(
        { error: "[Step 1] No SumUp API key configured", step: 1 },
        { status: 500 }
      );
    }

    if (!config.merchantCode) {
      return NextResponse.json(
        { error: "[Step 1] No SumUp merchant code configured", step: 1 },
        { status: 500 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json(
        { error: "[Step 2] Invalid request body", step: 2 },
        { status: 400 }
      );
    }

    const {
      email,
      name,
      amount,
      currency = "EUR",
      description = "Subscription",
      card, // { number, expiry_month, expiry_year, cvv, name, zip_code }
    } = body;

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "[Step 3] Valid email is required", step: 3 },
        { status: 400 }
      );
    }

    if (!amount) {
      return NextResponse.json(
        { error: "[Step 3] Amount is required", step: 3 },
        { status: 400 }
      );
    }

    if (!card || !card.number || !card.expiry_month || !card.expiry_year || !card.cvv) {
      return NextResponse.json(
        { error: "[Step 3] Complete card details are required", step: 3, received: { hasCard: !!card, hasNumber: !!card?.number, hasMonth: !!card?.expiry_month, hasYear: !!card?.expiry_year, hasCvv: !!card?.cvv } },
        { status: 400 }
      );
    }

    // Get or create customer
    let customer = await getCustomerByEmail(email);

    if (!customer) {
      // Create customer in SumUp - use email-based ID (alphanumeric only)
      const customerId = email.replace(/[^a-zA-Z0-9]/g, "").substring(0, 20) + Date.now();
      const sumupCustomerResponse = await fetch("https://api.sumup.com/v0.1/customers", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer_id: customerId,
          personal_details: {
            email,
            first_name: name || card.name || "",
          },
        }),
      });

      if (!sumupCustomerResponse.ok) {
        const errorText = await sumupCustomerResponse.text();
        console.error("[process-card] SumUp customer creation error:", sumupCustomerResponse.status, errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { raw: errorText };
        }
        return NextResponse.json(
          { error: `[Step 4] Failed to create customer: ${errorData.message || errorData.error_code || errorText}`, step: 4, details: errorData },
          { status: sumupCustomerResponse.status }
        );
      }

      const sumupCustomerData = await sumupCustomerResponse.json();
      console.log("[process-card] SumUp customer created:", sumupCustomerData.customer_id);

      // Store customer locally
      customer = await addCustomer({
        sumupCustomerId: sumupCustomerData.customer_id,
        email,
        name: name || card.name || "",
        paymentInstruments: [],
      });
    }

    // Get the origin for redirect URL
    const origin = request.headers.get("origin") || request.headers.get("referer")?.split("/").slice(0, 3).join("/") || "";

    // Create checkout with customer_id and purpose for tokenization
    // Per SumUp docs: purpose: "SETUP_RECURRING_PAYMENT" is required to tokenize the card
    const checkoutPayload = {
      checkout_reference: `card_${Date.now()}`,
      amount: parseFloat(amount),
      currency,
      merchant_code: config.merchantCode,
      description,
      customer_id: customer.sumupCustomerId,
      purpose: "SETUP_RECURRING_PAYMENT",
    };

    // Add redirect_url if we have origin
    if (origin) {
      checkoutPayload.redirect_url = `${origin}/api/checkout/3ds-complete`;
    }

    console.log("[process-card] Using customer_id:", customer.sumupCustomerId);
    console.log("[process-card] Redirect URL:", checkoutPayload.redirect_url);

    console.log("[process-card] Creating checkout:", checkoutPayload);

    const checkoutResponse = await fetch("https://api.sumup.com/v0.1/checkouts", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(checkoutPayload),
    });

    if (!checkoutResponse.ok) {
      const errorText = await checkoutResponse.text();
      console.error("[process-card] Checkout creation error:", checkoutResponse.status, errorText);
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { raw: errorText };
      }
      // Include more details in the error message
      let errorMsg = errorData.message || errorData.error_code || "Unknown error";
      if (errorData.error_message) errorMsg = errorData.error_message;
      if (errorData.param) errorMsg += ` (param: ${errorData.param})`;

      return NextResponse.json(
        {
          error: `[Step 5] Failed to create checkout: ${errorMsg}`,
          step: 5,
          details: errorData,
          checkoutPayload: { ...checkoutPayload, customer_id: "hidden" },
        },
        { status: checkoutResponse.status }
      );
    }

    const checkoutData = await checkoutResponse.json();
    console.log("[process-card] Checkout created:", checkoutData.id);

    // Process the checkout with card details and mandate
    // The mandate object states that we have obtained customer consent
    const cardPayload = {
      name: card.name || name || "Cardholder",
      number: card.number.replace(/\s/g, ""),
      expiry_month: String(card.expiry_month).trim().padStart(2, "0"),
      expiry_year: String(card.expiry_year).trim().length === 2
        ? `20${String(card.expiry_year).trim()}`
        : String(card.expiry_year).trim(),
      cvv: String(card.cvv).trim(),
    };

    // Only add zip_code if provided
    if (card.zip_code && String(card.zip_code).trim()) {
      cardPayload.zip_code = String(card.zip_code).trim();
    }

    // Per SumUp docs: for SETUP_RECURRING_PAYMENT, use installments: 1
    const processPayload = {
      payment_type: "card",
      card: cardPayload,
      installments: 1,
    };

    console.log("[process-card] Processing checkout with card:", {
      ...processPayload,
      card: { ...processPayload.card, number: "****", cvv: "***" }
    });

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

    console.log("[process-card] Process response:", processResponse.status, processData);

    if (!processResponse.ok) {
      // Extract detailed error info
      let errorMessage = "Unknown error";
      if (processData.message) {
        errorMessage = processData.message;
      } else if (processData.error_message) {
        errorMessage = processData.error_message;
      } else if (processData.error_code) {
        errorMessage = processData.error_code;
      } else if (processData.error) {
        errorMessage = typeof processData.error === 'string' ? processData.error : JSON.stringify(processData.error);
      }

      // Check for param errors
      if (processData.param) {
        errorMessage += ` (field: ${processData.param})`;
      }

      console.error("[process-card] Full error response:", JSON.stringify(processData, null, 2));

      return NextResponse.json(
        {
          error: `[Step 6] Payment processing failed: ${errorMessage}`,
          step: 6,
          details: processData,
          checkoutId: checkoutData.id,
        },
        { status: processResponse.status }
      );
    }

    // Check if 3D Secure is required
    if (processData.next_step) {
      return NextResponse.json({
        success: false,
        requires3DS: true,
        checkoutId: checkoutData.id,
        customerId: customer.id,
        nextStep: processData.next_step,
      });
    }

    // Check if payment was successful
    const isSuccess = processData.status === "PAID";

    if (!isSuccess) {
      return NextResponse.json({
        success: false,
        error: `[Step 7] Payment not completed. Status: ${processData.status}. Full response: ${JSON.stringify(processData)}`,
        step: 7,
        checkoutId: checkoutData.id,
        status: processData.status,
        details: processData,
      });
    }

    // Payment successful - now fetch and store the payment instrument (token)
    let paymentInstrument = null;

    if (processData.payment_instrument?.token) {
      // Token returned directly in response
      paymentInstrument = {
        token: processData.payment_instrument.token,
        card_type: card.number.startsWith("4") ? "VISA" : card.number.startsWith("5") ? "MASTERCARD" : "UNKNOWN",
        last_4_digits: card.number.slice(-4),
        expiry_month: card.expiry_month,
        expiry_year: card.expiry_year,
        active: true,
      };
    } else {
      // Fetch payment instruments from customer
      try {
        const instrumentsResponse = await fetch(
          `https://api.sumup.com/v0.1/customers/${customer.sumupCustomerId}/payment-instruments`,
          {
            headers: {
              "Authorization": `Bearer ${config.apiKey}`,
            },
          }
        );

        if (instrumentsResponse.ok) {
          const instrumentsData = await instrumentsResponse.json();
          const instruments = Array.isArray(instrumentsData)
            ? instrumentsData
            : (instrumentsData.payment_instruments || []);

          if (instruments.length > 0) {
            const latest = instruments[instruments.length - 1] || instruments[0];
            paymentInstrument = {
              token: latest.token,
              card_type: latest.card?.type || latest.type || "UNKNOWN",
              last_4_digits: latest.card?.last_4_digits || latest.last_4_digits || card.number.slice(-4),
              expiry_month: latest.card?.expiry_month || card.expiry_month,
              expiry_year: latest.card?.expiry_year || card.expiry_year,
              active: true,
            };
          }
        }
      } catch (e) {
        console.error("[process-card] Failed to fetch payment instruments:", e);
      }
    }

    // Update customer with payment instrument if we got one
    if (paymentInstrument) {
      const existingInstruments = customer.paymentInstruments || [];
      const updatedInstruments = existingInstruments.map(i => ({ ...i, active: false }));
      updatedInstruments.push(paymentInstrument);

      await updateCustomer(customer.id, {
        paymentInstruments: updatedInstruments,
      });
    }

    return NextResponse.json({
      success: true,
      checkoutId: checkoutData.id,
      status: processData.status,
      transactionCode: processData.transaction_code || null,
      customerId: customer.id,
      cardSaved: !!paymentInstrument,
      card: paymentInstrument ? {
        last_4_digits: paymentInstrument.last_4_digits,
        card_type: paymentInstrument.card_type,
      } : null,
    });
  } catch (e) {
    console.error("[process-card] error:", e);
    return NextResponse.json(
      { error: `[Exception] Internal server error: ${e.message}`, step: 0, details: e.message, stack: e.stack },
      { status: 500 }
    );
  }
}
