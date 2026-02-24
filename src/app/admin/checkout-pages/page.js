"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function CheckoutPagesPage() {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [isAuthed, setIsAuthed] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    price: "",
    productName: "",
    productImage: "",
    interval: "monthly",
    intervalCount: "1",
  });

  async function loadPages() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/checkout-pages?t=${Date.now()}`, { cache: "no-store" });
      if (res.status === 401) {
        setIsAuthed(false);
        return;
      }
      if (!res.ok) throw new Error("Failed to load checkout pages");
      const data = await res.json();
      setPages(data.pages || []);
      setIsAuthed(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPages();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name) {
      setError("Page name is required");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const method = editingId ? "PUT" : "POST";
      const body = editingId
        ? { id: editingId, ...form }
        : { ...form };

      const res = await fetch("/api/admin/checkout-pages", {
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
        throw new Error(data.error || "Failed to save page");
      }

      setForm({ name: "", slug: "", price: "", productName: "", productImage: "", interval: "monthly", intervalCount: "1" });
      setEditingId(null);
      await loadPages();

      if (typeof window !== "undefined" && window.Swal) {
        await window.Swal.fire({
          icon: "success",
          title: editingId ? "Page updated" : "Page created",
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
        title: "Delete this checkout page?",
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
      const res = await fetch(`/api/admin/checkout-pages?id=${id}`, { method: "DELETE" });
      if (res.status === 401) {
        setIsAuthed(false);
        return;
      }
      if (!res.ok) throw new Error("Failed to delete page");
      await loadPages();
    } catch (e) {
      setError(e.message);
    }
  }

  function startEdit(page) {
    setEditingId(page.id);
    setForm({
      name: page.name || "",
      slug: page.slug || "",
      price: page.price || "",
      productName: page.productName || "",
      productImage: page.productImage || "",
      interval: page.interval || "monthly",
      intervalCount: String(page.intervalCount || "1"),
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm({ name: "", slug: "", price: "", productName: "", productImage: "", interval: "monthly", intervalCount: "1" });
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
      if (typeof window !== "undefined" && window.Swal) {
        window.Swal.fire({
          icon: "success",
          title: "Copied!",
          text: "Link copied to clipboard",
          timer: 1500,
          showConfirmButton: false,
        });
      }
    }).catch(() => {
      // Fallback
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      if (typeof window !== "undefined" && window.Swal) {
        window.Swal.fire({
          icon: "success",
          title: "Copied!",
          timer: 1500,
          showConfirmButton: false,
        });
      }
    });
  }

  function getCheckoutUrl(page) {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    return `${baseUrl}/checkout/${page.slug || page.id}`;
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
        <h1 style={{ margin: "0 0 12px 0" }}>Checkout Pages</h1>
        <p>Please <Link href="/admin" style={{ color: "#1773b0" }}>login to admin</Link> first.</p>
      </main>
    );
  }

  return (
    <main style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
        <Link href="/admin" style={{ color: "#1773b0", textDecoration: "none" }}>&larr; Back</Link>
        <h1 style={{ margin: 0 }}>Checkout Pages</h1>
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
          {editingId ? "Edit Checkout Page" : "Create New Checkout Page"}
        </h2>
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label htmlFor="name">Page Name *</label>
              <input
                id="name"
                className="field"
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g., Main Checkout"
              />
            </div>
            <div>
              <label htmlFor="slug">URL Slug</label>
              <input
                id="slug"
                className="field"
                type="text"
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                placeholder="e.g., main-checkout"
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label htmlFor="productName">Product Name</label>
              <input
                id="productName"
                className="field"
                type="text"
                value={form.productName}
                onChange={(e) => setForm((f) => ({ ...f, productName: e.target.value }))}
                placeholder="e.g., Premium Kit"
              />
            </div>
            <div>
              <label htmlFor="price">Price</label>
              <input
                id="price"
                className="field"
                type="text"
                value={form.price}
                onChange={(e) => setForm((f) => ({
                  ...f,
                  price: e.target.value.replace(/[^0-9.,]/g, ""),
                }))}
                placeholder="84,00"
              />
            </div>
          </div>

          <div>
            <label htmlFor="productImage">Product Image URL</label>
            <input
              id="productImage"
              className="field"
              type="url"
              value={form.productImage}
              onChange={(e) => setForm((f) => ({ ...f, productImage: e.target.value }))}
              placeholder="https://..."
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label htmlFor="interval">Billing Interval</label>
              <select
                id="interval"
                className="field"
                value={form.interval}
                onChange={(e) => setForm((f) => ({ ...f, interval: e.target.value }))}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div>
              <label htmlFor="intervalCount">Every X periods</label>
              <input
                id="intervalCount"
                className="field"
                type="number"
                min="1"
                max="12"
                value={form.intervalCount}
                onChange={(e) => setForm((f) => ({ ...f, intervalCount: e.target.value }))}
                placeholder="1"
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            {editingId && (
              <button type="button" className="btn btn-secondary" onClick={cancelEdit}>
                Cancel
              </button>
            )}
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? "Saving..." : editingId ? "Update" : "Create Page"}
            </button>
          </div>
        </form>
      </div>

      <h2 style={{ fontSize: 16, marginBottom: 12 }}>Existing Pages ({pages.length})</h2>

      {pages.length === 0 ? (
        <div style={{ color: "#6d7175", padding: 20, textAlign: "center" }}>
          No checkout pages yet. Create your first checkout page above.
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {pages.map((page) => (
            <div
              key={page.id}
              style={{
                background: "#fff",
                border: "1px solid #e1e3e5",
                borderRadius: 10,
                padding: 16,
              }}
            >
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 12,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{page.name}</div>
                  <div style={{ fontSize: 13, color: "#6d7175", marginBottom: 4 }}>
                    {page.price && `${page.price} EUR`}
                    {page.interval && ` / ${page.intervalCount > 1 ? page.intervalCount + " " : ""}${page.interval}`}
                    {page.productName && ` - ${page.productName}`}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      background: "#f0f7ff",
                      padding: "8px 12px",
                      borderRadius: 6,
                      marginTop: 8,
                    }}
                  >
                    <code style={{
                      flex: 1,
                      fontSize: 12,
                      color: "#1773b0",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}>
                      {getCheckoutUrl(page)}
                    </code>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(getCheckoutUrl(page))}
                      style={{
                        background: "#1773b0",
                        color: "#fff",
                        border: "none",
                        borderRadius: 4,
                        padding: "4px 8px",
                        fontSize: 12,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                      Copy
                    </button>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    className="btn btn-secondary"
                    onClick={() => startEdit(page)}
                    style={{ padding: "6px 12px", fontSize: 13 }}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => handleDelete(page.id)}
                    style={{ padding: "6px 12px", fontSize: 13, color: "#b42318" }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{
        marginTop: 20,
        background: "#f8fafc",
        border: "1px solid #e1e3e5",
        borderRadius: 12,
        padding: 16,
      }}>
        <h3 style={{ margin: "0 0 8px 0", fontSize: 14 }}>Note</h3>
        <p style={{ fontSize: 13, color: "#6d7175", margin: 0 }}>
          All checkout pages use the active SumUp account selected in the{" "}
          <Link href="/admin/controller" style={{ color: "#1773b0" }}>Controller</Link>.
          Changing the active account will affect all pages.
        </p>
      </div>
    </main>
  );
}
