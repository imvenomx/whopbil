"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function ControllerPage() {
  const [accounts, setAccounts] = useState([]);
  const [activeAccountId, setActiveAccountId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [isAuthed, setIsAuthed] = useState(false);

  async function loadController() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/controller?t=${Date.now()}`, { cache: "no-store" });
      if (res.status === 401) {
        setIsAuthed(false);
        return;
      }
      if (!res.ok) throw new Error("Failed to load controller data");
      const data = await res.json();
      setAccounts(data.accounts || []);
      setActiveAccountId(data.activeAccountId || "");
      setIsAuthed(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadController();
  }, []);

  async function handleChange(e) {
    const newActiveId = e.target.value || null;
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/admin/controller", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activeAccountId: newActiveId }),
      });

      if (res.status === 401) {
        setIsAuthed(false);
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update controller");
      }

      setActiveAccountId(newActiveId || "");

      if (typeof window !== "undefined" && window.Swal) {
        const selectedAccount = accounts.find((a) => a.id === newActiveId);
        await window.Swal.fire({
          icon: "success",
          title: newActiveId
            ? `Switched to ${selectedAccount?.name || "selected account"}`
            : "Cleared active account",
          text: newActiveId
            ? "All checkout pages now use this SumUp account."
            : "Checkout pages will use the default configuration.",
          timer: 2000,
          showConfirmButton: false,
        });
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  const activeAccount = accounts.find((a) => a.id === activeAccountId);

  if (loading) {
    return (
      <main style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
        <div>Loading...</div>
      </main>
    );
  }

  if (!isAuthed) {
    return (
      <main style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
        <h1 style={{ margin: "0 0 12px 0" }}>Controller</h1>
        <p>Please <Link href="/admin" style={{ color: "#1773b0" }}>login to admin</Link> first.</p>
      </main>
    );
  }

  return (
    <main style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
        <Link href="/admin" style={{ color: "#1773b0", textDecoration: "none" }}>&larr; Back</Link>
        <h1 style={{ margin: 0 }}>Controller</h1>
      </div>

      {error && (
        <div style={{
          background: "#fff",
          border: "1px solid #e1e3e5",
          borderRadius: 10,
          padding: 12,
          marginBottom: 12,
          color: "#b42318",
        }}>
          {error}
        </div>
      )}

      <div style={{
        background: "#fff",
        border: "1px solid #e1e3e5",
        borderRadius: 12,
        padding: 24,
        marginBottom: 20,
      }}>
        <h2 style={{ margin: "0 0 8px 0", fontSize: 18 }}>Active SumUp Account</h2>
        <p style={{ color: "#6d7175", marginBottom: 16 }}>
          Select which SumUp account to use for all checkout pages. When you switch accounts,
          all checkout forms will immediately use the new account.
        </p>

        {accounts.length === 0 ? (
          <div style={{
            background: "#fef3c7",
            border: "1px solid #fcd34d",
            borderRadius: 8,
            padding: 16,
            marginBottom: 16,
          }}>
            <strong>No accounts found.</strong>{" "}
            <Link href="/admin/accounts" style={{ color: "#1773b0" }}>
              Add your first SumUp account
            </Link>{" "}
            to get started.
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 16 }}>
              <label htmlFor="activeAccount" style={{ display: "block", marginBottom: 8 }}>
                Select Account
              </label>
              <select
                id="activeAccount"
                className="field"
                value={activeAccountId || ""}
                onChange={handleChange}
                disabled={saving}
                style={{
                  width: "100%",
                  padding: "12px",
                  fontSize: 16,
                  cursor: saving ? "wait" : "pointer",
                }}
              >
                <option value="">-- No account selected (use default) --</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </div>

            {saving && (
              <div style={{ color: "#6d7175", marginBottom: 16 }}>
                Switching account...
              </div>
            )}
          </>
        )}

        {activeAccount && (
          <div style={{
            background: "#f0fdf4",
            border: "1px solid #86efac",
            borderRadius: 8,
            padding: 16,
          }}>
            <div style={{ fontWeight: 600, marginBottom: 8, color: "#166534" }}>
              Currently Active: {activeAccount.name}
            </div>
            <div style={{ fontSize: 13, color: "#6d7175", wordBreak: "break-all" }}>
              {activeAccount.iframeUrl}
            </div>
          </div>
        )}

        {!activeAccount && accounts.length > 0 && (
          <div style={{
            background: "#fef9c3",
            border: "1px solid #fde047",
            borderRadius: 8,
            padding: 16,
          }}>
            <div style={{ fontWeight: 600, marginBottom: 4, color: "#854d0e" }}>
              No account selected
            </div>
            <div style={{ fontSize: 13, color: "#6d7175" }}>
              Checkout pages are using the default SumUp configuration.
            </div>
          </div>
        )}
      </div>

      <div style={{
        background: "#f8fafc",
        border: "1px solid #e1e3e5",
        borderRadius: 12,
        padding: 16,
      }}>
        <h3 style={{ margin: "0 0 8px 0", fontSize: 14 }}>Quick Links</h3>
        <div style={{ display: "flex", gap: 12 }}>
          <Link
            href="/admin/accounts"
            style={{
              color: "#1773b0",
              textDecoration: "none",
              fontSize: 14,
            }}
          >
            Manage Accounts
          </Link>
          <Link
            href="/admin/checkout-pages"
            style={{
              color: "#1773b0",
              textDecoration: "none",
              fontSize: 14,
            }}
          >
            Manage Checkout Pages
          </Link>
        </div>
      </div>
    </main>
  );
}
