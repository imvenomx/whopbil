import { NextResponse } from "next/server";
import { readConfig, addCustomer, getCustomerByEmail, getCustomers } from "@/lib/configStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Create a new customer (creates in SumUp and stores locally)
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

    const { email, name } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Check if customer already exists locally
    const existingCustomer = await getCustomerByEmail(email);
    if (existingCustomer) {
      return NextResponse.json({
        customer: existingCustomer,
        isNew: false,
      });
    }

    // Create customer in SumUp
    const sumupResponse = await fetch("https://api.sumup.com/v0.1/customers", {
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

    if (!sumupResponse.ok) {
      const errorData = await sumupResponse.json().catch(() => ({}));
      console.error("[POST /api/customers] SumUp API error:", errorData);
      return NextResponse.json(
        { error: "Failed to create customer in SumUp", details: errorData },
        { status: sumupResponse.status }
      );
    }

    const sumupData = await sumupResponse.json();
    console.log("[POST /api/customers] SumUp customer created:", sumupData);

    // Store customer locally
    const customer = await addCustomer({
      sumupCustomerId: sumupData.customer_id,
      email,
      name: name || "",
      paymentInstruments: [],
    });

    return NextResponse.json({
      customer,
      isNew: true,
    });
  } catch (e) {
    console.error("[POST /api/customers] error:", e);
    return NextResponse.json(
      { error: "Internal server error", details: e.message },
      { status: 500 }
    );
  }
}

// Get all customers (for admin)
export async function GET(request) {
  try {
    const customers = await getCustomers();

    return NextResponse.json({
      customers,
    }, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("[GET /api/customers] error:", e);
    return NextResponse.json(
      { error: "Internal server error", details: e.message },
      { status: 500 }
    );
  }
}
