import { NextResponse } from "next/server";
import { readConfig, getCustomerById, updateCustomer } from "@/lib/configStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Check checkout status (after 3DS completion)
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

    const { checkoutId, customerId } = body;

    if (!checkoutId) {
      return NextResponse.json(
        { error: "checkoutId is required" },
        { status: 400 }
      );
    }

    // Fetch checkout status from SumUp
    const checkoutResponse = await fetch(
      `https://api.sumup.com/v0.1/checkouts/${checkoutId}`,
      {
        headers: {
          "Authorization": `Bearer ${config.apiKey}`,
        },
      }
    );

    if (!checkoutResponse.ok) {
      const errorData = await checkoutResponse.json().catch(() => ({}));
      return NextResponse.json(
        { error: "Failed to fetch checkout status", details: errorData },
        { status: checkoutResponse.status }
      );
    }

    const checkoutData = await checkoutResponse.json();
    console.log("==========================================");
    console.log("[check-status] Checkout ID:", checkoutId);
    console.log("[check-status] Checkout status:", checkoutData.status);
    console.log("[check-status] Transaction ID:", checkoutData.transaction_id);
    console.log("[check-status] Transaction code:", checkoutData.transaction_code);
    console.log("[check-status] Full checkout data:", JSON.stringify(checkoutData, null, 2));
    console.log("==========================================");

    // Check if payment was successful
    // For SETUP_RECURRING_PAYMENT: having a token means success (card is tokenized)
    // The actual charge happens separately via complete-tokenization
    const successStates = ["PAID", "SUCCESSFUL", "COMPLETED", "CAPTURED"];
    const hasToken = checkoutData.payment_instrument?.token;
    const failedStates = ["FAILED", "EXPIRED", "CANCELLED", "DECLINED"];
    const isFailed = failedStates.includes(checkoutData.status);

    console.log("[check-status] hasToken:", hasToken);
    console.log("[check-status] isFailed:", isFailed);

    // Success if: PAID status OR (has token AND not explicitly failed)
    // IMPORTANT: Check token BEFORE checking pending status!
    if (successStates.includes(checkoutData.status) || (hasToken && !isFailed)) {
      // Payment successful - fetch and store the payment instrument
      let paymentInstrument = null;

      if (customerId) {
        const customer = await getCustomerById(customerId);

        if (customer) {
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
                  last_4_digits: latest.card?.last_4_digits || latest.last_4_digits || "****",
                  expiry_month: latest.card?.expiry_month || "",
                  expiry_year: latest.card?.expiry_year || "",
                  active: true,
                };

                // Update customer with payment instrument
                const existingInstruments = customer.paymentInstruments || [];
                const updatedInstruments = existingInstruments.map(i => ({ ...i, active: false }));
                updatedInstruments.push(paymentInstrument);

                await updateCustomer(customer.id, {
                  paymentInstruments: updatedInstruments,
                });
              }
            }
          } catch (e) {
            console.error("[check-status] Failed to fetch payment instruments:", e);
          }
        }
      }

      return NextResponse.json({
        success: true,
        checkoutId,
        status: "PAID",
        transactionCode: checkoutData.transaction_code || null,
        customerId,
        cardSaved: !!paymentInstrument,
        card: paymentInstrument ? {
          last_4_digits: paymentInstrument.last_4_digits,
          card_type: paymentInstrument.card_type,
        } : null,
      });
    }

    // Check if still pending (3DS in progress) - only if no token yet
    const pendingStates = ["PENDING", "PROCESSING", "CREATED", "IN_PROGRESS"];
    if (pendingStates.includes(checkoutData.status) || !checkoutData.status) {
      return NextResponse.json({
        success: false,
        pending: true,
        status: checkoutData.status || "PENDING",
        checkoutId,
        _debug: checkoutData,
      });
    }

    // Only treat FAILED status as actual failure
    if (isFailed) {
      // Extract transaction failure reason if available
      let failureReason = checkoutData.status;
      if (checkoutData.transactions && checkoutData.transactions.length > 0) {
        const lastTxn = checkoutData.transactions[checkoutData.transactions.length - 1];
        if (lastTxn.status) failureReason = lastTxn.status;
        if (lastTxn.failure_reason) failureReason += `: ${lastTxn.failure_reason}`;
      }

      console.log("[check-status] Payment failed. Reason:", failureReason);
      console.log("[check-status] Full checkout data:", JSON.stringify(checkoutData, null, 2));

      return NextResponse.json({
        success: false,
        error: `Payment ${failureReason}`,
        checkoutId,
        status: checkoutData.status,
        details: checkoutData,
      });
    }

    // Unknown status - treat as pending to avoid false failures
    console.log("[check-status] Unknown status, treating as pending:", checkoutData.status);
    return NextResponse.json({
      success: false,
      pending: true,
      status: checkoutData.status,
      checkoutId,
    });
  } catch (e) {
    console.error("[check-status] error:", e);
    return NextResponse.json(
      { error: "Internal server error", details: e.message },
      { status: 500 }
    );
  }
}
