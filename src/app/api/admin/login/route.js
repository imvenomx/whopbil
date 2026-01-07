import { NextResponse } from "next/server";

import { setAdminSessionCookie } from "@/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getAdminUsername() {
  return process.env.ADMIN_USERNAME || "issam";
}

function getAdminPassword() {
  return process.env.ADMIN_PASSWORD || "ISS@2025";
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const username = body?.username;
  const password = body?.password;

  if (username !== getAdminUsername() || password !== getAdminPassword()) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  setAdminSessionCookie(res, username);
  return res;
}
