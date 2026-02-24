"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STATUS_COLORS = {
  active: { bg: "#f0fdf4", border: "#86efac", text: "#166534" },
  paused: { bg: "#fefce8", border: "#fde047", text: "#854d0e" },
  cancelled: { bg: "#fef2f2", border: "#fecaca", text: "#991b1b" },
  past_due: { bg: "#fef2f2", border: "#fca5a5", text: "#991b1b" },
};

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingBilling, setProcessingBilling] = useState(false);
  const [billingResult, setBillingResult] = useState(null);
  const [chargeAmount, setChargeAmount] = useState("");

  async function loadSubscriptions() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/subscriptions?t=${Date.now()}`, {
        cache: "no-store",
      });
      if (res.status === 401) {
        window.location.href = "/admin";
        return;
      }
      if (!res.ok) throw new Error("Failed to load subscriptions");
      const data = await res.json();
      setSubscriptions(data.subscriptions || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSubscriptions();
  }, []);

  async function handleStatusChange(id, newStatus) {
    try {
      const res = await fetch("/api/admin/subscriptions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update subscription");
      await loadSubscriptions();
    } catch (e) {
      alert(`Error: ${e.message}`);
    }
  }

  async function handleCharge() {
    const amount = parseFloat(chargeAmount.replace(",", "."));
    if (!amount || amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    const activeSubscriptions = subscriptions.filter(s => s.status === "active");
    if (activeSubscriptions.length === 0) {
      alert("No active subscriptions to charge");
      return;
    }

    if (!confirm(`Charge ${amount} EUR to ${activeSubscriptions.length} active subscription(s)?`)) {
      return;
    }

    setProcessingBilling(true);
    setBillingResult(null);

    try {
      const res = await fetch("/api/admin/subscriptions/process-billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });

      if (!res.ok) throw new Error("Billing process failed");

      const result = await res.json();
      setBillingResult(result);
      await loadSubscriptions();
    } catch (e) {
      alert(`Error: ${e.message}`);
    } finally {
      setProcessingBilling(false);
    }
  }

  const activeCount = subscriptions.filter((s) => s.status === "active").length;
  const pausedCount = subscriptions.filter((s) => s.status === "paused").length;
  const cancelledCount = subscriptions.filter((s) => s.status === "cancelled").length;
  const pastDueCount = subscriptions.filter((s) => s.status === "past_due").length;

  return (
    <main style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
        <Link href="/admin" style={{ color: "#6d7175", textDecoration: "none" }}>
          &larr; Back
        </Link>
        <h1 style={{ margin: 0, flex: 1 }}>Subscriptions</h1>
      </div>

      {error && (
        <div
          style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: 10,
            padding: 12,
            marginBottom: 16,
            color: "#991b1b",
          }}
        >
          {error}
        </div>
      )}

      {/* Billing Card */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #e1e3e5",
          borderRadius: 12,
          padding: 20,
          marginBottom: 24,
        }}
      >
        <h2 style={{ margin: "0 0 16px 0", fontSize: 18 }}>Process Billing</h2>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div>
            <label htmlFor="chargeAmount" style={{ display: "block", marginBottom: 6, fontSize: 14, color: "#6d7175" }}>
              Amount to charge (EUR)
            </label>
            <input
              id="chargeAmount"
              type="text"
              className="field"
              value={chargeAmount}
              onChange={(e) => setChargeAmount(e.target.value.replace(/[^0-9.,]/g, ""))}
              placeholder="120,00"
              style={{ width: 150 }}
            />
          </div>
          <button
            onClick={handleCharge}
            disabled={processingBilling || activeCount === 0 || !chargeAmount}
            style={{
              padding: "12px 24px",
              backgroundColor: activeCount > 0 && chargeAmount ? "#1a1a1a" : "#e5e7eb",
              color: activeCount > 0 && chargeAmount ? "#fff" : "#9ca3af",
              border: "none",
              borderRadius: 8,
              fontWeight: 600,
              cursor: processingBilling || activeCount === 0 || !chargeAmount ? "not-allowed" : "pointer",
              fontSize: 15,
            }}
          >
            {processingBilling ? "Processing..." : `Charge ${activeCount} Subscription${activeCount !== 1 ? "s" : ""}`}
          </button>
        </div>
        <p style={{ margin: "12px 0 0 0", fontSize: 13, color: "#6d7175" }}>
          This will charge all active subscriptions with the specified amount.
        </p>
      </div>

      {billingResult && (
        <div
          style={{
            background: billingResult.failed > 0 ? "#fef9c3" : "#f0fdf4",
            border: `1px solid ${billingResult.failed > 0 ? "#fde047" : "#86efac"}`,
            borderRadius: 10,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Billing Results</div>
          <div style={{ display: "flex", gap: 24 }}>
            <div>Processed: {billingResult.processed}</div>
            <div style={{ color: "#166534" }}>Successful: {billingResult.successful}</div>
            <div style={{ color: billingResult.failed > 0 ? "#991b1b" : "inherit" }}>
              Failed: {billingResult.failed}
            </div>
          </div>
          <button
            onClick={() => setBillingResult(null)}
            style={{
              marginTop: 8,
              padding: "4px 12px",
              background: "transparent",
              border: "1px solid #ccc",
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            background: STATUS_COLORS.active.bg,
            border: `1px solid ${STATUS_COLORS.active.border}`,
            borderRadius: 10,
            padding: 16,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 28, fontWeight: 700, color: STATUS_COLORS.active.text }}>
            {activeCount}
          </div>
          <div style={{ fontSize: 13, color: "#6d7175" }}>Active</div>
        </div>
        <div
          style={{
            background: STATUS_COLORS.paused.bg,
            border: `1px solid ${STATUS_COLORS.paused.border}`,
            borderRadius: 10,
            padding: 16,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 28, fontWeight: 700, color: STATUS_COLORS.paused.text }}>
            {pausedCount}
          </div>
          <div style={{ fontSize: 13, color: "#6d7175" }}>Paused</div>
        </div>
        <div
          style={{
            background: STATUS_COLORS.past_due.bg,
            border: `1px solid ${STATUS_COLORS.past_due.border}`,
            borderRadius: 10,
            padding: 16,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 28, fontWeight: 700, color: STATUS_COLORS.past_due.text }}>
            {pastDueCount}
          </div>
          <div style={{ fontSize: 13, color: "#6d7175" }}>Past Due</div>
        </div>
        <div
          style={{
            background: STATUS_COLORS.cancelled.bg,
            border: `1px solid ${STATUS_COLORS.cancelled.border}`,
            borderRadius: 10,
            padding: 16,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 28, fontWeight: 700, color: STATUS_COLORS.cancelled.text }}>
            {cancelledCount}
          </div>
          <div style={{ fontSize: 13, color: "#6d7175" }}>Cancelled</div>
        </div>
      </div>

      {/* Subscriptions Table */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 40 }}>Loading...</div>
      ) : subscriptions.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: 40,
            background: "#fff",
            border: "1px solid #e1e3e5",
            borderRadius: 12,
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>&#128257;</div>
          <div style={{ color: "#6d7175" }}>No subscriptions yet.</div>
          <div style={{ color: "#6d7175", fontSize: 13, marginTop: 8 }}>
            Subscriptions will appear here when customers sign up.
          </div>
        </div>
      ) : (
        <div
          style={{
            background: "#fff",
            border: "1px solid #e1e3e5",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #e1e3e5" }}>
                  <th style={{ padding: 12, textAlign: "left", fontWeight: 600 }}>Customer</th>
                  <th style={{ padding: 12, textAlign: "left", fontWeight: 600 }}>Status</th>
                  <th style={{ padding: 12, textAlign: "left", fontWeight: 600 }}>Created</th>
                  <th style={{ padding: 12, textAlign: "left", fontWeight: 600 }}>Last Charged</th>
                  <th style={{ padding: 12, textAlign: "left", fontWeight: 600 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((sub) => {
                  const statusColor = STATUS_COLORS[sub.status] || STATUS_COLORS.active;

                  return (
                    <tr key={sub.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <td style={{ padding: 12 }}>
                        <div style={{ fontWeight: 500 }}>{sub.customer?.email || "Unknown"}</div>
                        <div style={{ fontSize: 12, color: "#6d7175" }}>
                          {sub.customer?.name || ""}
                        </div>
                      </td>
                      <td style={{ padding: 12 }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "4px 10px",
                            borderRadius: 20,
                            fontSize: 12,
                            fontWeight: 600,
                            backgroundColor: statusColor.bg,
                            color: statusColor.text,
                            border: `1px solid ${statusColor.border}`,
                          }}
                        >
                          {sub.status}
                        </span>
                        {sub.failedAttempts > 0 && (
                          <span style={{ marginLeft: 8, fontSize: 11, color: "#991b1b" }}>
                            ({sub.failedAttempts} failed)
                          </span>
                        )}
                      </td>
                      <td style={{ padding: 12 }}>
                        {new Date(sub.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: 12 }}>
                        {sub.lastChargeDate ? new Date(sub.lastChargeDate).toLocaleDateString() : "-"}
                      </td>
                      <td style={{ padding: 12 }}>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {sub.status === "active" && (
                            <button
                              onClick={() => handleStatusChange(sub.id, "paused")}
                              style={{
                                padding: "4px 10px",
                                fontSize: 12,
                                backgroundColor: "#fef9c3",
                                color: "#854d0e",
                                border: "1px solid #fde047",
                                borderRadius: 4,
                                cursor: "pointer",
                              }}
                            >
                              Pause
                            </button>
                          )}
                          {sub.status === "paused" && (
                            <button
                              onClick={() => handleStatusChange(sub.id, "active")}
                              style={{
                                padding: "4px 10px",
                                fontSize: 12,
                                backgroundColor: "#f0fdf4",
                                color: "#166534",
                                border: "1px solid #86efac",
                                borderRadius: 4,
                                cursor: "pointer",
                              }}
                            >
                              Resume
                            </button>
                          )}
                          {sub.status === "past_due" && (
                            <button
                              onClick={() => handleStatusChange(sub.id, "active")}
                              style={{
                                padding: "4px 10px",
                                fontSize: 12,
                                backgroundColor: "#f0fdf4",
                                color: "#166534",
                                border: "1px solid #86efac",
                                borderRadius: 4,
                                cursor: "pointer",
                              }}
                            >
                              Reset
                            </button>
                          )}
                          {sub.status !== "cancelled" && (
                            <button
                              onClick={() => handleStatusChange(sub.id, "cancelled")}
                              style={{
                                padding: "4px 10px",
                                fontSize: 12,
                                backgroundColor: "#fef2f2",
                                color: "#991b1b",
                                border: "1px solid #fecaca",
                                borderRadius: 4,
                                cursor: "pointer",
                              }}
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}
