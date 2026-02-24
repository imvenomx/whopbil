import { NextResponse } from "next/server";

import { isAdminRequestAuthenticated } from "@/lib/adminAuth";
import {
  getSubscriptions,
  updateSubscription,
  getCustomerById,
  addBillingLog,
} from "@/lib/configStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ ok: false }, { status: 401 });
}

// Process billing for all active subscriptions with a specified amount
export async function POST(request) {
  try {
    if (!isAdminRequestAuthenticated(request)) return unauthorized();

    let body = {};
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json(
        { ok: false, error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { amount } = body;

    if (!amount || parseFloat(amount) <= 0) {
      return NextResponse.json(
        { ok: false, error: "Amount is required and must be greater than 0" },
        { status: 400 }
      );
    }

    const chargeAmount = parseFloat(amount);

    // Get all active subscriptions
    const allSubscriptions = await getSubscriptions();
    const activeSubscriptions = allSubscriptions.filter((s) => s.status === "active");

    console.log(
      `[POST /api/admin/subscriptions/process-billing] Processing ${activeSubscriptions.length} active subscription(s) with amount ${chargeAmount}`
    );

    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
      details: [],
    };

    for (const subscription of activeSubscriptions) {
      results.processed++;

      const customer = await getCustomerById(subscription.customerId);

      if (!customer) {
        console.error(
          `[process-billing] Customer not found for subscription ${subscription.id}`
        );
        results.failed++;
        results.details.push({
          subscriptionId: subscription.id,
          status: "failed",
          error: "Customer not found",
        });

        await addBillingLog({
          subscriptionId: subscription.id,
          customerId: subscription.customerId,
          amount: chargeAmount,
          currency: "EUR",
          status: "failed",
          errorMessage: "Customer not found",
        });

        continue;
      }

      // Find active payment instrument
      const activeInstrument = customer.paymentInstruments?.find(
        (i) => i.active
      );

      if (!activeInstrument) {
        console.error(
          `[process-billing] No active payment instrument for customer ${customer.id}`
        );
        results.failed++;
        results.details.push({
          subscriptionId: subscription.id,
          customerEmail: customer.email,
          status: "failed",
          error: "No active payment instrument",
        });

        await addBillingLog({
          subscriptionId: subscription.id,
          customerId: subscription.customerId,
          amount: chargeAmount,
          currency: "EUR",
          status: "failed",
          errorMessage: "No active payment instrument",
        });

        // Update subscription
        const newFailedAttempts = (subscription.failedAttempts || 0) + 1;
        await updateSubscription(subscription.id, {
          failedAttempts: newFailedAttempts,
          status: newFailedAttempts >= 3 ? "past_due" : subscription.status,
        });

        continue;
      }

      // Call charge-token API
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ||
          (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

        const chargeResponse = await fetch(
          `${baseUrl}/api/checkout/charge-token`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              customerId: customer.id,
              token: activeInstrument.token,
              amount: chargeAmount,
              currency: "EUR",
              description: `Subscription payment - ${subscription.metadata?.productName || "Subscription"}`,
            }),
          }
        );

        const chargeResult = await chargeResponse.json();

        if (chargeResult.success) {
          console.log(
            `[process-billing] Successful charge for subscription ${subscription.id}`
          );
          results.successful++;
          results.details.push({
            subscriptionId: subscription.id,
            customerEmail: customer.email,
            status: "success",
            transactionCode: chargeResult.transactionCode,
            amount: chargeAmount,
          });

          // Log success
          await addBillingLog({
            subscriptionId: subscription.id,
            customerId: subscription.customerId,
            amount: chargeAmount,
            currency: "EUR",
            status: "success",
            sumupCheckoutId: chargeResult.checkoutId,
            transactionCode: chargeResult.transactionCode,
          });

          // Update subscription
          await updateSubscription(subscription.id, {
            lastChargeDate: new Date().toISOString(),
            failedAttempts: 0,
          });
        } else {
          console.error(
            `[process-billing] Failed charge for subscription ${subscription.id}:`,
            chargeResult
          );
          results.failed++;
          results.details.push({
            subscriptionId: subscription.id,
            customerEmail: customer.email,
            status: "failed",
            error: chargeResult.error || "Payment failed",
          });

          // Log failure
          await addBillingLog({
            subscriptionId: subscription.id,
            customerId: subscription.customerId,
            amount: chargeAmount,
            currency: "EUR",
            status: "failed",
            errorMessage: chargeResult.error || "Payment failed",
            sumupCheckoutId: chargeResult.checkoutId,
          });

          // Update subscription
          const newFailedAttempts = (subscription.failedAttempts || 0) + 1;
          await updateSubscription(subscription.id, {
            failedAttempts: newFailedAttempts,
            status: newFailedAttempts >= 3 ? "past_due" : subscription.status,
          });
        }
      } catch (chargeError) {
        console.error(
          `[process-billing] Error charging subscription ${subscription.id}:`,
          chargeError
        );
        results.failed++;
        results.details.push({
          subscriptionId: subscription.id,
          customerEmail: customer.email,
          status: "failed",
          error: chargeError.message,
        });

        await addBillingLog({
          subscriptionId: subscription.id,
          customerId: subscription.customerId,
          amount: chargeAmount,
          currency: "EUR",
          status: "failed",
          errorMessage: chargeError.message,
        });

        const newFailedAttempts = (subscription.failedAttempts || 0) + 1;
        await updateSubscription(subscription.id, {
          failedAttempts: newFailedAttempts,
          status: newFailedAttempts >= 3 ? "past_due" : subscription.status,
        });
      }
    }

    console.log(`[process-billing] Results:`, results);

    return NextResponse.json({
      ok: true,
      ...results,
    });
  } catch (e) {
    console.error("[POST /api/admin/subscriptions/process-billing]", e);
    return NextResponse.json(
      { ok: false, error: "Internal server error", details: e.message },
      { status: 500 }
    );
  }
}

// Get billing logs
export async function GET(request) {
  try {
    if (!isAdminRequestAuthenticated(request)) return unauthorized();

    const { getBillingLogs } = await import("@/lib/configStore");

    const { searchParams } = new URL(request.url);
    const subscriptionId = searchParams.get("subscriptionId");
    const limit = parseInt(searchParams.get("limit") || "100", 10);

    let logs;
    if (subscriptionId) {
      const allLogs = await getBillingLogs(1000);
      logs = allLogs
        .filter((l) => l.subscriptionId === subscriptionId)
        .slice(0, limit);
    } else {
      logs = await getBillingLogs(limit);
    }

    return NextResponse.json(
      { logs },
      {
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (e) {
    console.error("[GET /api/admin/subscriptions/process-billing]", e);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
