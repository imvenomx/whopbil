import { NextResponse } from "next/server";

import { readConfig } from "@/lib/configStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const config = await readConfig();
  return NextResponse.json(config, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
