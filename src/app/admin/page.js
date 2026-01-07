"use client";

import { useEffect, useState } from "react";

const initialForm = {
  username: "",
  password: "",
};

export default function AdminPage() {
  const [form, setForm] = useState(initialForm);
  const [isAuthed, setIsAuthed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [config, setConfig] = useState({
    iframeUrl: "",
    price: "",
  });

  async function loadConfig() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/config", { cache: "no-store" });
      if (res.status === 401) {
        setIsAuthed(false);
        return;
      }
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status}${text ? `: ${text}` : ""}`);
      }

      const data = await res.json();
      setConfig({
        iframeUrl: data?.iframeUrl || "",
        price: data?.price || "",
      });
      setIsAuthed(true);
    } catch (e) {
      setError(`Could not load admin config. ${e?.message ? `(${e.message})` : ""}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadConfig();
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
      await loadConfig();
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

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const numericPrice = String(config.price || "")
      .replace(/[^0-9.,]/g, "")
      .trim();

    try {
      const res = await fetch("/api/admin/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          iframeUrl: config.iframeUrl,
          price: numericPrice,
        }),
      });

      if (res.status === 401) {
        setIsAuthed(false);
        setError("Session expired. Please log in again.");
        return;
      }

      if (!res.ok) {
        setError("Save failed.");
        return;
      }

      const data = await res.json();
      setConfig({
        iframeUrl: data?.iframeUrl || "",
        price: data?.price || "",
      });

      if (typeof window !== "undefined" && window.Swal) {
        await window.Swal.fire({
          icon: "success",
          title: "Changes saved successfully",
          timer: 1500,
          showConfirmButton: false,
        });
      }
    } catch (e) {
      setError("Save failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main style={{ padding: 24, maxWidth: 720, margin: "0 auto" }}>
      <h1 style={{ margin: "0 0 12px 0" }}>Admin</h1>

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
        <div>Loading…</div>
      ) : isAuthed ? (
        <>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
            <button
              onClick={logout}
              className="btn btn-secondary"
              type="button"
              style={{ height: 40 }}
            >
              Logout
            </button>
          </div>

          <form onSubmit={save} style={{ display: "grid", gap: 12 }}>
            <div>
              <label htmlFor="iframeUrl">SumUp iframe URL</label>
              <input
                id="iframeUrl"
                className="field"
                type="url"
                value={config.iframeUrl}
                onChange={(e) => setConfig((c) => ({ ...c, iframeUrl: e.target.value }))}
                placeholder="https://pay.sumup.com/b2c/..."
              />
            </div>

            <div>
              <label htmlFor="price">Price (number only)</label>
              <input
                id="price"
                className="field"
                type="text"
                value={config.price}
                onChange={(e) =>
                  setConfig((c) => ({
                    ...c,
                    price: e.target.value.replace(/[^0-9.,]/g, ""),
                  }))
                }
                placeholder="84,00"
              />
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="btn btn-primary" type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </button>
            </div>

            <div style={{ color: "#6d7175", fontSize: 13 }}>
              Changes are saved server-side to <code>checkout-config.json</code>.
            </div>
          </form>
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
