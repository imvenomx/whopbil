"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const initialForm = {
  username: "",
  password: "",
};

export default function AdminPage() {
  const [form, setForm] = useState(initialForm);
  const [isAuthed, setIsAuthed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeAccount, setActiveAccount] = useState(null);
  const [accountsCount, setAccountsCount] = useState(0);

  async function checkAuth() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/admin/config?t=${Date.now()}`, { cache: "no-store" });
      if (res.status === 401) {
        setIsAuthed(false);
        return;
      }
      if (!res.ok) {
        throw new Error("Failed to check auth");
      }
      setIsAuthed(true);

      // Load controller info
      const controllerRes = await fetch(`/api/admin/controller?t=${Date.now()}`, { cache: "no-store" });
      if (controllerRes.ok) {
        const data = await controllerRes.json();
        setAccountsCount(data.accounts?.length || 0);
        if (data.activeAccountId) {
          const active = data.accounts?.find((a) => a.id === data.activeAccountId);
          setActiveAccount(active || null);
        } else {
          setActiveAccount(null);
        }
      }
    } catch (e) {
      setError(`Could not connect. ${e?.message ? `(${e.message})` : ""}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    checkAuth();
  }, []);

  async function login(e) {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.username,
          password: form.password,
        }),
      });

      if (!res.ok) {
        setError("Invalid login.");
        return;
      }

      setForm(initialForm);
      await checkAuth();
    } catch (e) {
      setError("Login failed.");
    }
  }

  async function logout() {
    setError("");
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } finally {
      setIsAuthed(false);
    }
  }

  return (
    <main style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ margin: "0 0 12px 0" }}>Admin Dashboard</h1>

      {error ? (
        <div
          style={{
            background: "#fff",
            border: "1px solid #e1e3e5",
            borderRadius: 10,
            padding: 12,
            marginBottom: 12,
            color: "#b42318",
          }}
        >
          {error}
        </div>
      ) : null}

      {loading ? (
        <div>Loading...</div>
      ) : isAuthed ? (
        <>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
            <button
              onClick={logout}
              className="btn btn-secondary"
              type="button"
              style={{ height: 40 }}
            >
              Logout
            </button>
          </div>

          {/* Status Card */}
          <div
            style={{
              background: activeAccount ? "#f0fdf4" : "#fef9c3",
              border: `1px solid ${activeAccount ? "#86efac" : "#fde047"}`,
              borderRadius: 12,
              padding: 16,
              marginBottom: 24,
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 8 }}>
              {activeAccount
                ? `Active Account: ${activeAccount.name}`
                : "No SumUp account selected"}
            </div>
            <div style={{ fontSize: 13, color: "#6d7175" }}>
              {activeAccount
                ? "All checkout pages are using this account."
                : "Select an account in the Controller to enable checkout payments."}
            </div>
          </div>

          {/* Navigation Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16 }}>
            <Link href="/admin/controller" style={{ textDecoration: "none", color: "inherit" }}>
              <div
                style={{
                  background: "#fff",
                  border: "1px solid #e1e3e5",
                  borderRadius: 12,
                  padding: 20,
                  cursor: "pointer",
                  transition: "box-shadow 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)")}
                onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
              >
                <div style={{ fontSize: 24, marginBottom: 8 }}>
                  <span role="img" aria-label="controller">&#9881;</span>
                </div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Controller</div>
                <div style={{ fontSize: 13, color: "#6d7175" }}>
                  Switch active SumUp account for all checkout pages
                </div>
              </div>
            </Link>

            <Link href="/admin/accounts" style={{ textDecoration: "none", color: "inherit" }}>
              <div
                style={{
                  background: "#fff",
                  border: "1px solid #e1e3e5",
                  borderRadius: 12,
                  padding: 20,
                  cursor: "pointer",
                  transition: "box-shadow 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)")}
                onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
              >
                <div style={{ fontSize: 24, marginBottom: 8 }}>
                  <span role="img" aria-label="accounts">&#128179;</span>
                </div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>SumUp Accounts</div>
                <div style={{ fontSize: 13, color: "#6d7175" }}>
                  {accountsCount} account{accountsCount !== 1 ? "s" : ""} configured
                </div>
              </div>
            </Link>

            <Link href="/admin/checkout-pages" style={{ textDecoration: "none", color: "inherit" }}>
              <div
                style={{
                  background: "#fff",
                  border: "1px solid #e1e3e5",
                  borderRadius: 12,
                  padding: 20,
                  cursor: "pointer",
                  transition: "box-shadow 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)")}
                onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
              >
                <div style={{ fontSize: 24, marginBottom: 8 }}>
                  <span role="img" aria-label="pages">&#128196;</span>
                </div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Checkout Pages</div>
                <div style={{ fontSize: 13, color: "#6d7175" }}>
                  Manage checkout page configurations
                </div>
              </div>
            </Link>

            <Link href="/admin/subscriptions" style={{ textDecoration: "none", color: "inherit" }}>
              <div
                style={{
                  background: "#fff",
                  border: "1px solid #e1e3e5",
                  borderRadius: 12,
                  padding: 20,
                  cursor: "pointer",
                  transition: "box-shadow 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)")}
                onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
              >
                <div style={{ fontSize: 24, marginBottom: 8 }}>
                  <span role="img" aria-label="subscriptions">&#128257;</span>
                </div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Subscriptions</div>
                <div style={{ fontSize: 13, color: "#6d7175" }}>
                  Manage recurring payments and billing
                </div>
              </div>
            </Link>
          </div>

          <div style={{ marginTop: 24, color: "#6d7175", fontSize: 13 }}>
            Configuration is stored in Vercel KV.
          </div>
        </>
      ) : (
        <form
          onSubmit={login}
          style={{
            display: "grid",
            gap: 12,
            background: "#fff",
            border: "1px solid #e1e3e5",
            borderRadius: 12,
            padding: 16,
            maxWidth: 400,
          }}
        >
          <div>
            <label htmlFor="username">Username</label>
            <input
              id="username"
              className="field"
              type="text"
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              autoComplete="username"
            />
          </div>

          <div>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              className="field"
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              autoComplete="current-password"
            />
          </div>

          <button className="btn btn-primary" type="submit">
            Login
          </button>
        </form>
      )}
    </main>
  );
}
