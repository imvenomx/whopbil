import { NextResponse } from "next/server";

import { isAdminRequestAuthenticated } from "@/lib/adminAuth";
import {
  getActiveSumupAccountId,
  setActiveSumupAccountId,
  getSumupAccounts,
} from "@/lib/configStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ ok: false }, { status: 401 });
}

export async function GET(request) {
  try {
    if (!isAdminRequestAuthenticated(request)) return unauthorized();

    const [activeAccountId, accounts] = await Promise.all([
      getActiveSumupAccountId(),
      getSumupAccounts(),
    ]);

    return NextResponse.json(
      { activeAccountId, accounts },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    console.error("[GET /api/admin/controller]", e);
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

    const { activeAccountId } = body;

    // Validate the account exists if an ID is provided
    if (activeAccountId) {
      const accounts = await getSumupAccounts();
      const accountExists = accounts.some((a) => a.id === activeAccountId);
      if (!accountExists) {
        return NextResponse.json(
          { ok: false, error: "Account not found" },
          { status: 404 }
        );
      }
    }

    await setActiveSumupAccountId(activeAccountId || null);

    return NextResponse.json({ ok: true, activeAccountId: activeAccountId || null });
  } catch (e) {
    console.error("[PUT /api/admin/controller]", e);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
