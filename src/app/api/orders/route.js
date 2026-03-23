import { NextResponse } from "next/server";
import { addOrder, getOrderById, getOrders } from "@/lib/configStore";
import { isAdminRequestAuthenticated } from "@/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST - create order (called from checkout on payment success)
export async function POST(request) {
  try {
    const body = await request.json();
    if (!body.email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    const order = await addOrder(body);
    return NextResponse.json({ success: true, order });
  } catch (e) {
    console.error("[POST /api/orders]", e);
    return NextResponse.json({ error: "Failed to save order" }, { status: 500 });
  }
}

// GET - get single order by id (?id=xxx) or list all (admin only)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    // Single order lookup (public - for thank you page)
    if (id) {
      const order = await getOrderById(id);
      if (!order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }
      return NextResponse.json(order);
    }

    // List all orders (admin only)
    if (!isAdminRequestAuthenticated(request)) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
    const orders = await getOrders();
    return NextResponse.json({ orders });
  } catch (e) {
    console.error("[GET /api/orders]", e);
    return NextResponse.json({ error: "Failed to load orders" }, { status: 500 });
  }
}
