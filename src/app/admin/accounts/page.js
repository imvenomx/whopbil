"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function AccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [isAuthed, setIsAuthed] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: "", apiKey: "", merchantCode: "" });

  async function loadAccounts() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/accounts?t=${Date.now()}`, { cache: "no-store" });
      if (res.status === 401) {
        setIsAuthed(false);
        return;
      }
      if (!res.ok) throw new Error("Failed to load accounts");
      const data = await res.json();
      setAccounts(data.accounts || []);
      setIsAuthed(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAccounts();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name || !form.apiKey) {
      setError("Name and API key are required");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const method = editingId ? "PUT" : "POST";
      const body = editingId
        ? { id: editingId, name: form.name, apiKey: form.apiKey, merchantCode: form.merchantCode }
        : { name: form.name, apiKey: form.apiKey, merchantCode: form.merchantCode };

      const res = await fetch("/api/admin/accounts", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.status === 401) {
        setIsAuthed(false);
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save account");
      }

      setForm({ name: "", apiKey: "", merchantCode: "" });
      setEditingId(null);
      await loadAccounts();

      if (typeof window !== "undefined" && window.Swal) {
        await window.Swal.fire({
          icon: "success",
          title: editingId ? "Account updated" : "Account added",
          timer: 1500,
          showConfirmButton: false,
        });
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (typeof window !== "undefined" && window.Swal) {
      const result = await window.Swal.fire({
        title: "Delete this account?",
        text: "This action cannot be undone.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        confirmButtonText: "Delete",
      });
      if (!result.isConfirmed) return;
    }

    setError("");
    try {
      const res = await fetch(`/api/admin/accounts?id=${id}`, { method: "DELETE" });
      if (res.status === 401) {
        setIsAuthed(false);
        return;
      }
      if (!res.ok) throw new Error("Failed to delete account");
      await loadAccounts();
    } catch (e) {
      setError(e.message);
    }
  }

  function startEdit(account) {
    setEditingId(account.id);
    setForm({ name: account.name, apiKey: account.apiKey || "", merchantCode: account.merchantCode || "" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm({ name: "", apiKey: "", merchantCode: "" });
  }

  function maskApiKey(key) {
    if (!key || key.length < 8) return key;
    return key.substring(0, 4) + "..." + key.substring(key.length - 4);
  }

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
        <h1 style={{ margin: "0 0 12px 0" }}>SumUp Accounts</h1>
        <p>Please <Link href="/admin" style={{ color: "#1773b0" }}>login to admin</Link> first.</p>
      </main>
    );
  }

  return (
    <main style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
        <Link href="/admin" style={{ color: "#1773b0", textDecoration: "none" }}>&larr; Back</Link>
        <h1 style={{ margin: 0 }}>SumUp Accounts</h1>
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
        padding: 16,
        marginBottom: 20,
      }}>
        <h2 style={{ margin: "0 0 12px 0", fontSize: 16 }}>
          {editingId ? "Edit Account" : "Add New Account"}
        </h2>
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
          <div>
            <label htmlFor="name">Account Name</label>
            <input
              id="name"
              className="field"
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g., Sumup1"
            />
          </div>
          <div>
            <label htmlFor="apiKey">SumUp API Key</label>
            <input
              id="apiKey"
              className="field"
              type="password"
              value={form.apiKey}
              onChange={(e) => setForm((f) => ({ ...f, apiKey: e.target.value }))}
              placeholder="Enter your SumUp API key"
            />
            <div style={{ fontSize: 12, color: "#6d7175", marginTop: 4 }}>
              Get your API key from SumUp Developer Portal
            </div>
          </div>
          <div>
            <label htmlFor="merchantCode">Merchant Code (optional)</label>
            <input
              id="merchantCode"
              className="field"
              type="text"
              value={form.merchantCode}
              onChange={(e) => setForm((f) => ({ ...f, merchantCode: e.target.value }))}
              placeholder="e.g., MXXXXXXXXX"
            />
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            {editingId && (
              <button type="button" className="btn btn-secondary" onClick={cancelEdit}>
                Cancel
              </button>
            )}
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? "Saving..." : editingId ? "Update" : "Add Account"}
            </button>
          </div>
        </form>
      </div>

      <h2 style={{ fontSize: 16, marginBottom: 12 }}>Existing Accounts ({accounts.length})</h2>

      {accounts.length === 0 ? (
        <div style={{ color: "#6d7175", padding: 20, textAlign: "center" }}>
          No accounts yet. Add your first SumUp account above.
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {accounts.map((account) => (
            <div
              key={account.id}
              style={{
                background: "#fff",
                border: "1px solid #e1e3e5",
                borderRadius: 10,
                padding: 16,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{account.name}</div>
                <div style={{ fontSize: 13, color: "#6d7175", marginBottom: 2 }}>
                  API Key: {maskApiKey(account.apiKey)}
                </div>
                {account.merchantCode && (
                  <div style={{ fontSize: 13, color: "#6d7175" }}>
                    Merchant: {account.merchantCode}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => startEdit(account)}
                  style={{ padding: "6px 12px", fontSize: 13 }}
                >
                  Edit
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => handleDelete(account.id)}
                  style={{ padding: "6px 12px", fontSize: 13, color: "#b42318" }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
