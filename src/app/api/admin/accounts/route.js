import { NextResponse } from "next/server";

import { isAdminRequestAuthenticated } from "@/lib/adminAuth";
import {
  getSumupAccounts,
  addSumupAccount,
  updateSumupAccount,
  deleteSumupAccount,
} from "@/lib/configStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ ok: false }, { status: 401 });
}

export async function GET(request) {
  try {
    if (!isAdminRequestAuthenticated(request)) return unauthorized();
    const accounts = await getSumupAccounts();
    return NextResponse.json({ accounts }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    console.error("[GET /api/admin/accounts]", e);
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

    if (!body.name || !body.apiKey) {
      return NextResponse.json(
        { ok: false, error: "Name and API key are required" },
        { status: 400 }
      );
    }

    const account = await addSumupAccount({
      name: body.name,
      apiKey: body.apiKey,
      merchantCode: body.merchantCode || "",
    });

    return NextResponse.json({ ok: true, account });
  } catch (e) {
    console.error("[POST /api/admin/accounts]", e);
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
        { ok: false, error: "Account ID is required" },
        { status: 400 }
      );
    }

    const account = await updateSumupAccount(body.id, {
      name: body.name,
      apiKey: body.apiKey,
      merchantCode: body.merchantCode,
    });

    return NextResponse.json({ ok: true, account });
  } catch (e) {
    console.error("[PUT /api/admin/accounts]", e);
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
        { ok: false, error: "Account ID is required" },
        { status: 400 }
      );
    }

    await deleteSumupAccount(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[DELETE /api/admin/accounts]", e);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
