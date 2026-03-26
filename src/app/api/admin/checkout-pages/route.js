import { NextResponse } from "next/server";

import { isAdminRequestAuthenticated } from "@/lib/adminAuth";
import {
  getCheckoutPages,
  addCheckoutPage,
  updateCheckoutPage,
  deleteCheckoutPage,
} from "@/lib/configStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ ok: false }, { status: 401 });
}

export async function GET(request) {
  try {
    if (!isAdminRequestAuthenticated(request)) return unauthorized();
    const pages = await getCheckoutPages();
    return NextResponse.json({ pages }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    console.error("[GET /api/admin/checkout-pages]", e);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    if (!isAdminRequestAuthenticated(request)) return unauthorized();

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
    }

    if (!body.name) {
      return NextResponse.json(
        { ok: false, error: "Page name is required" },
        { status: 400 }
      );
    }

    const page = await addCheckoutPage({
      name: body.name,
      slug: body.slug,
      whopPlanId: body.whopPlanId || "",
      whopEnvironment: body.whopEnvironment || "production",
      price: body.price || "",
      productName: body.productName || "",
      productImage: body.productImage || "",
      currency: body.currency || "EUR",
    });

    return NextResponse.json({ ok: true, page });
  } catch (e) {
    console.error("[POST /api/admin/checkout-pages]", e);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    if (!isAdminRequestAuthenticated(request)) return unauthorized();

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
    }

    if (!body.id) {
      return NextResponse.json(
        { ok: false, error: "Page ID is required" },
        { status: 400 }
      );
    }

    const page = await updateCheckoutPage(body.id, {
      name: body.name,
      slug: body.slug,
      whopPlanId: body.whopPlanId,
      whopEnvironment: body.whopEnvironment,
      price: body.price || "",
      productName: body.productName || "",
      productImage: body.productImage || "",
      currency: body.currency || "EUR",
    });

    return NextResponse.json({ ok: true, page });
  } catch (e) {
    console.error("[PUT /api/admin/checkout-pages]", e);
    return NextResponse.json(
      { ok: false, error: e.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    if (!isAdminRequestAuthenticated(request)) return unauthorized();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "Page ID is required" },
        { status: 400 }
      );
    }

    await deleteCheckoutPage(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[DELETE /api/admin/checkout-pages]", e);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
