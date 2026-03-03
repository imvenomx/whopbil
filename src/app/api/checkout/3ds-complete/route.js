import { NextResponse } from "next/server";
import { readConfig } from "@/lib/configStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// SumUp redirects here after 3DS completion
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const checkoutId = searchParams.get("checkout_id") || searchParams.get("id");
  const status = searchParams.get("status");

  console.log("==========================================");
  console.log("[3ds-complete] HIT! Full URL:", request.url);
  console.log("[3ds-complete] checkout_id:", checkoutId);
  console.log("[3ds-complete] status:", status);
  console.log("[3ds-complete] All params:", Object.fromEntries(searchParams));

  // Immediately check checkout status with SumUp
  if (checkoutId) {
    try {
      const config = await readConfig();
      const checkoutResponse = await fetch(
        `https://api.sumup.com/v0.1/checkouts/${checkoutId}`,
        {
          headers: {
            "Authorization": `Bearer ${config.apiKey}`,
          },
        }
      );
      const checkoutData = await checkoutResponse.json();
      console.log("[3ds-complete] SumUp checkout status:", checkoutData.status);
      console.log("[3ds-complete] SumUp full response:", JSON.stringify(checkoutData, null, 2));
    } catch (e) {
      console.error("[3ds-complete] Error checking SumUp:", e.message);
    }
  }
  console.log("==========================================");

  // Return HTML page that notifies parent via postMessage
  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Verification Complete</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: #f9fafb;
    }
    .container {
      text-align: center;
      padding: 40px;
    }
    .icon {
      font-size: 64px;
      margin-bottom: 20px;
    }
    h1 {
      font-size: 24px;
      margin-bottom: 10px;
      color: #111;
    }
    p {
      color: #6b7280;
      margin: 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">✓</div>
    <h1>Verification Complete</h1>
    <p>Please wait while we confirm your payment...</p>
  </div>
  <script>
    // Notify parent window that 3DS is complete
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({
        type: '3DS_COMPLETE',
        checkoutId: '${checkoutId || ""}',
        status: '${status || ""}'
      }, '*');
    }
  </script>
</body>
</html>
  `;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html",
    },
  });
}
