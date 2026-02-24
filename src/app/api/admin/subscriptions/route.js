import { NextResponse } from "next/server";

import { isAdminRequestAuthenticated } from "@/lib/adminAuth";
import {
  getSubscriptions,
  updateSubscription,
  deleteSubscription,
  getCustomers,
  getCustomerById,
} from "@/lib/configStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ ok: false }, { status: 401 });
}

// Get all subscriptions with customer info
export async function GET(request) {
  try {
    if (!isAdminRequestAuthenticated(request)) return unauthorized();

    const subscriptions = await getSubscriptions();
    const customers = await getCustomers();

    // Enrich subscriptions with customer data including payment instruments
    const enrichedSubscriptions = subscriptions.map((sub) => {
      const customer = customers.find((c) => c.id === sub.customerId);
      return {
        ...sub,
        customer: customer
          ? {
              id: customer.id,
              email: customer.email,
              name: customer.name,
              sumupCustomerId: customer.sumupCustomerId,
              paymentInstruments: customer.paymentInstruments || [],
            }
          : null,
      };
    });

    return NextResponse.json(
      { subscriptions: enrichedSubscriptions },
      {
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (e) {
    console.error("[GET /api/admin/subscriptions]", e);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Update subscription (pause, resume, change amount, etc.)
export async function PUT(request) {
  try {
    if (!isAdminRequestAuthenticated(request)) return unauthorized();

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json(
        { ok: false, error: "Invalid JSON" },
        { status: 400 }
      );
    }

    if (!body.id) {
      return NextResponse.json(
        { ok: false, error: "Subscription ID is required" },
        { status: 400 }
      );
    }

    const updates = {};

    // Handle status changes
    if (body.status) {
      updates.status = body.status;
      if (body.status === "paused") {
        updates.pausedAt = new Date().toISOString();
      } else if (body.status === "cancelled") {
        updates.cancelledAt = new Date().toISOString();
      } else if (body.status === "active") {
        // Resuming from paused
        updates.pausedAt = null;
      }
    }

    // Handle amount change
    if (body.amount !== undefined) {
      updates.amount = parseFloat(body.amount);
    }

    // Handle interval change
    if (body.interval) {
      updates.interval = body.interval;
    }
    if (body.intervalCount !== undefined) {
      updates.intervalCount = parseInt(body.intervalCount, 10);
    }

    // Handle next charge date change
    if (body.nextChargeDate) {
      updates.nextChargeDate = body.nextChargeDate;
    }

    const subscription = await updateSubscription(body.id, updates);

    return NextResponse.json({ ok: true, subscription });
  } catch (e) {
    console.error("[PUT /api/admin/subscriptions]", e);
    return NextResponse.json(
      { ok: false, error: e.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// Cancel subscription
export async function DELETE(request) {
  try {
    if (!isAdminRequestAuthenticated(request)) return unauthorized();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "Subscription ID is required" },
        { status: 400 }
      );
    }

    // Mark as cancelled instead of deleting
    await updateSubscription(id, {
      status: "cancelled",
      cancelledAt: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[DELETE /api/admin/subscriptions]", e);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
