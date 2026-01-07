import { NextResponse } from "next/server";

import { isAdminRequestAuthenticated } from "@/lib/adminAuth";
import { readConfig, writeConfig } from "@/lib/configStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ ok: false }, { status: 401 });
}

export async function GET(request) {
  if (!isAdminRequestAuthenticated(request)) return unauthorized();
  const config = await readConfig();
  return NextResponse.json(config, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export async function PUT(request) {
  if (!isAdminRequestAuthenticated(request)) return unauthorized();

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const updated = await writeConfig({
    iframeUrl: body?.iframeUrl,
    price: body?.price,
  });

  return NextResponse.json(updated);
}
