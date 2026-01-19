import { NextResponse } from "next/server";

import { readConfig } from "@/lib/configStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidatePath = () => null; // disable data cache

export async function GET() {
  console.log("[GET /api/config] reading config");
  const config = await readConfig();
  console.log("[GET /api/config] returning:", config);
  return NextResponse.json(config, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
