import { NextResponse } from "next/server";

import { isAdminRequestAuthenticated } from "@/lib/adminAuth";
import { readConfig, writeConfig } from "@/lib/configStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidatePath = () => null; // disable data cache

function unauthorized() {
  return NextResponse.json({ ok: false }, { status: 401 });
}

export async function GET(request) {
  try {
    if (!isAdminRequestAuthenticated(request)) return unauthorized();
    const config = await readConfig();
    return NextResponse.json(config, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("[GET /api/admin/config]", e);
    return NextResponse.json(
      { ok: false, error: "Internal server error", details: e?.stack || String(e) },
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

    const updated = await writeConfig({
      iframeUrl: body?.iframeUrl,
      price: body?.price,
    });

    return NextResponse.json(updated);
  } catch (e) {
    console.error("[PUT /api/admin/config]", e);
    return NextResponse.json(
      { ok: false, error: "Internal server error", details: e?.stack || String(e) },
      { status: 500 }
    );
  }
}
