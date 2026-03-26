"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// Icons
const Icons = {
  back: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12"/>
      <polyline points="12 19 5 12 12 5"/>
    </svg>
  ),
  plus: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  edit: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  ),
  trash: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    </svg>
  ),
  copy: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
  ),
  external: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
      <polyline points="15 3 21 3 21 9"/>
      <line x1="10" y1="14" x2="21" y2="3"/>
    </svg>
  ),
  x: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
};

export default function CheckoutPagesPage() {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [isAuthed, setIsAuthed] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    whopPlanId: "",
    whopEnvironment: "production",
    price: "",
    productName: "",
    productImage: "",
    currency: "EUR",
  });

  async function loadPages() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/checkout-pages?t=${Date.now()}`, { cache: "no-store" });
      if (res.status === 401) {
        setIsAuthed(false);
        setLoading(false);
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
    if (!form.whopPlanId) {
      setError("Whop Plan ID is required");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const method = editingId ? "PUT" : "POST";
      const body = editingId ? { id: editingId, ...form } : { ...form };

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

      resetForm();
      await loadPages();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Are you sure you want to delete this checkout page?")) return;

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
      whopPlanId: page.whopPlanId || "",
      whopEnvironment: page.whopEnvironment || "production",
      price: page.price || "",
      productName: page.productName || "",
      productImage: page.productImage || "",
      currency: page.currency || "EUR",
    });
    setShowForm(true);
  }

  function resetForm() {
    setEditingId(null);
    setShowForm(false);
    setForm({
      name: "",
      slug: "",
      whopPlanId: "",
      whopEnvironment: "production",
      price: "",
      productName: "",
      productImage: "",
      currency: "EUR",
    });
  }

  function copyToClipboard(text, id) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function getCheckoutUrl(page) {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    return `${baseUrl}/checkout/${page.slug || page.id}`;
  }

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
      </div>
    );
  }

  if (!isAuthed) {
    return (
      <div style={styles.unauthContainer}>
        <p style={styles.unauthText}>
          Please <Link href="/admin" style={styles.link}>login to admin</Link> first.
        </p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <Link href="/admin" style={styles.backLink}>
            {Icons.back}
            <span>Back to Dashboard</span>
          </Link>
        </div>

        <div style={styles.sidebarContent}>
          <h2 style={styles.sidebarTitle}>Checkout Pages</h2>
          <p style={styles.sidebarDescription}>
            Create and manage your Whop checkout pages
          </p>
        </div>

        <div style={styles.sidebarFooter}>
          <a
            href="https://docs.whop.com/payments/checkout-embed"
            target="_blank"
            rel="noopener noreferrer"
            style={styles.docsLink}
          >
            <span>Documentation</span>
            {Icons.external}
          </a>
        </div>
      </aside>

      {/* Main content */}
      <main style={styles.mainContent}>
        <div style={styles.contentWrapper}>
          {/* Header */}
          <header style={styles.header}>
            <div>
              <h1 style={styles.headerTitle}>Checkout Pages</h1>
              <p style={styles.headerSubtitle}>{pages.length} page{pages.length !== 1 ? "s" : ""} configured</p>
            </div>
            {!showForm && (
              <button onClick={() => setShowForm(true)} style={styles.primaryButton}>
                {Icons.plus}
                <span>New Page</span>
              </button>
            )}
          </header>

          {error && (
            <div style={styles.errorBanner}>
              {error}
            </div>
          )}

          {/* Form */}
          {showForm && (
            <div style={styles.formCard}>
              <div style={styles.formHeader}>
                <h2 style={styles.formTitle}>
                  {editingId ? "Edit Checkout Page" : "Create Checkout Page"}
                </h2>
                <button onClick={resetForm} style={styles.closeButton}>
                  {Icons.x}
                </button>
              </div>

              <form onSubmit={handleSubmit} style={styles.form}>
                <div style={styles.formGrid}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Page Name *</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      style={styles.input}
                      placeholder="e.g., Premium Subscription"
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>URL Slug</label>
                    <input
                      type="text"
                      value={form.slug}
                      onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                      style={styles.input}
                      placeholder="e.g., premium"
                    />
                  </div>
                </div>

                <div style={styles.formSection}>
                  <h3 style={styles.formSectionTitle}>Whop Configuration</h3>
                  <div style={styles.formGrid}>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Whop Plan ID *</label>
                      <input
                        type="text"
                        value={form.whopPlanId}
                        onChange={(e) => setForm((f) => ({ ...f, whopPlanId: e.target.value }))}
                        style={styles.input}
                        placeholder="plan_XXXXXXXXX"
                      />
                      <p style={styles.hint}>Get this from your Whop Dashboard</p>
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.label}>Environment</label>
                      <select
                        value={form.whopEnvironment}
                        onChange={(e) => setForm((f) => ({ ...f, whopEnvironment: e.target.value }))}
                        style={styles.select}
                      >
                        <option value="production">Production</option>
                        <option value="sandbox">Sandbox (Testing)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div style={styles.formSection}>
                  <h3 style={styles.formSectionTitle}>Product Details</h3>
                  <div style={styles.formGrid}>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Price *</label>
                      <input
                        type="text"
                        value={form.price}
                        onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                        style={styles.input}
                        placeholder="e.g., 49.99"
                      />
                      <p style={styles.hint}>Display price (e.g., 49.99)</p>
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.label}>Currency</label>
                      <select
                        value={form.currency}
                        onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                        style={styles.select}
                      >
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                      </select>
                    </div>
                  </div>

                  <div style={styles.formGrid}>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Product Name</label>
                      <input
                        type="text"
                        value={form.productName}
                        onChange={(e) => setForm((f) => ({ ...f, productName: e.target.value }))}
                        style={styles.input}
                        placeholder="e.g., Premium Package"
                      />
                    </div>
                  </div>

                  <div style={{ ...styles.formGroup, marginTop: "16px" }}>
                    <label style={styles.label}>Product Image URL</label>
                    <input
                      type="text"
                      value={form.productImage}
                      onChange={(e) => setForm((f) => ({ ...f, productImage: e.target.value }))}
                      style={styles.input}
                      placeholder="https://example.com/image.png"
                    />
                  </div>
                </div>

                <div style={styles.formActions}>
                  <button type="button" onClick={resetForm} style={styles.secondaryButton}>
                    Cancel
                  </button>
                  <button type="submit" disabled={saving} style={styles.primaryButton}>
                    {saving ? "Saving..." : editingId ? "Update Page" : "Create Page"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Pages list */}
          {pages.length === 0 && !showForm ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="1.5">
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                  <polyline points="14,2 14,8 20,8"/>
                </svg>
              </div>
              <h3 style={styles.emptyTitle}>No checkout pages yet</h3>
              <p style={styles.emptyDescription}>
                Create your first checkout page to start accepting payments with Whop.
              </p>
              <button onClick={() => setShowForm(true)} style={styles.primaryButton}>
                {Icons.plus}
                <span>Create Page</span>
              </button>
            </div>
          ) : (
            <div style={styles.pagesList}>
              {pages.map((page) => (
                <div key={page.id} style={styles.pageCard}>
                  <div style={styles.pageCardHeader}>
                    <div style={styles.pageInfo}>
                      <h3 style={styles.pageName}>{page.name}</h3>
                      <div style={styles.pageMeta}>
                        {page.price && (
                          <span style={styles.pagePrice}>{page.currency === "GBP" ? "£" : "€"}{page.price}</span>
                        )}
                        {page.whopPlanId && (
                          <span style={styles.pagePlanId}>
                            {page.whopPlanId}
                          </span>
                        )}
                        {page.whopEnvironment === "sandbox" && (
                          <span style={styles.sandboxBadge}>Sandbox</span>
                        )}
                      </div>
                    </div>
                    <div style={styles.pageActions}>
                      <button
                        onClick={() => startEdit(page)}
                        style={styles.iconButton}
                        title="Edit"
                      >
                        {Icons.edit}
                      </button>
                      <button
                        onClick={() => handleDelete(page.id)}
                        style={styles.iconButtonDanger}
                        title="Delete"
                      >
                        {Icons.trash}
                      </button>
                    </div>
                  </div>

                  <div style={styles.urlRow}>
                    <code style={styles.urlText}>{getCheckoutUrl(page)}</code>
                    <button
                      onClick={() => copyToClipboard(getCheckoutUrl(page), page.id)}
                      style={styles.copyButton}
                    >
                      {Icons.copy}
                      <span>{copiedId === page.id ? "Copied!" : "Copy"}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <style jsx global>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

const styles = {
  // Loading
  loadingContainer: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#09090b",
  },
  loadingSpinner: {
    width: "40px",
    height: "40px",
    border: "3px solid #27272a",
    borderTopColor: "#6366f1",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },

  // Unauth
  unauthContainer: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#09090b",
  },
  unauthText: {
    color: "#71717a",
    fontSize: "14px",
  },
  link: {
    color: "#6366f1",
    textDecoration: "none",
  },

  // Layout
  container: {
    display: "flex",
    minHeight: "100vh",
    backgroundColor: "#09090b",
  },

  // Sidebar
  sidebar: {
    width: "280px",
    backgroundColor: "#18181b",
    borderRight: "1px solid #27272a",
    display: "flex",
    flexDirection: "column",
    position: "fixed",
    top: 0,
    left: 0,
    bottom: 0,
  },
  sidebarHeader: {
    padding: "20px",
    borderBottom: "1px solid #27272a",
  },
  backLink: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#71717a",
    textDecoration: "none",
    fontSize: "14px",
    transition: "color 0.2s",
  },
  sidebarContent: {
    flex: 1,
    padding: "24px 20px",
  },
  sidebarTitle: {
    margin: "0 0 8px 0",
    fontSize: "18px",
    fontWeight: "600",
    color: "#fafafa",
  },
  sidebarDescription: {
    margin: 0,
    fontSize: "14px",
    color: "#71717a",
    lineHeight: "1.5",
  },
  sidebarFooter: {
    padding: "16px 20px",
    borderTop: "1px solid #27272a",
  },
  docsLink: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 14px",
    borderRadius: "8px",
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    color: "#6366f1",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: "500",
  },

  // Main content
  mainContent: {
    flex: 1,
    marginLeft: "280px",
    minHeight: "100vh",
  },
  contentWrapper: {
    maxWidth: "900px",
    margin: "0 auto",
    padding: "40px",
  },

  // Header
  header: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: "32px",
  },
  headerTitle: {
    margin: "0 0 4px 0",
    fontSize: "28px",
    fontWeight: "700",
    color: "#fafafa",
  },
  headerSubtitle: {
    margin: 0,
    fontSize: "14px",
    color: "#71717a",
  },

  // Buttons
  primaryButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 16px",
    backgroundColor: "#6366f1",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "background-color 0.2s",
  },
  secondaryButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 16px",
    backgroundColor: "transparent",
    color: "#a1a1aa",
    border: "1px solid #27272a",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  iconButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "36px",
    height: "36px",
    backgroundColor: "transparent",
    color: "#71717a",
    border: "1px solid #27272a",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  iconButtonDanger: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "36px",
    height: "36px",
    backgroundColor: "transparent",
    color: "#ef4444",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  closeButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "32px",
    height: "32px",
    backgroundColor: "transparent",
    color: "#71717a",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  copyButton: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 12px",
    backgroundColor: "#6366f1",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "500",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },

  // Error
  errorBanner: {
    padding: "12px 16px",
    marginBottom: "24px",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    border: "1px solid rgba(239, 68, 68, 0.2)",
    borderRadius: "8px",
    color: "#ef4444",
    fontSize: "14px",
  },

  // Form
  formCard: {
    backgroundColor: "#18181b",
    border: "1px solid #27272a",
    borderRadius: "12px",
    marginBottom: "32px",
    overflow: "hidden",
  },
  formHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 24px",
    borderBottom: "1px solid #27272a",
  },
  formTitle: {
    margin: 0,
    fontSize: "16px",
    fontWeight: "600",
    color: "#fafafa",
  },
  form: {
    padding: "24px",
  },
  formSection: {
    marginTop: "24px",
    paddingTop: "24px",
    borderTop: "1px solid #27272a",
  },
  formSectionTitle: {
    margin: "0 0 16px 0",
    fontSize: "14px",
    fontWeight: "600",
    color: "#a1a1aa",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "16px",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#a1a1aa",
  },
  input: {
    width: "100%",
    height: "40px",
    padding: "0 12px",
    fontSize: "14px",
    color: "#fafafa",
    backgroundColor: "#09090b",
    border: "1px solid #27272a",
    borderRadius: "8px",
    outline: "none",
    transition: "border-color 0.2s",
  },
  select: {
    width: "100%",
    height: "40px",
    padding: "0 12px",
    fontSize: "14px",
    color: "#fafafa",
    backgroundColor: "#09090b",
    border: "1px solid #27272a",
    borderRadius: "8px",
    outline: "none",
    cursor: "pointer",
  },
  hint: {
    margin: 0,
    fontSize: "12px",
    color: "#52525b",
  },
  formActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    marginTop: "24px",
    paddingTop: "24px",
    borderTop: "1px solid #27272a",
  },

  // Empty state
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "60px 20px",
    backgroundColor: "#18181b",
    border: "1px solid #27272a",
    borderRadius: "12px",
    textAlign: "center",
  },
  emptyIcon: {
    marginBottom: "16px",
    color: "#71717a",
  },
  emptyTitle: {
    margin: "0 0 8px 0",
    fontSize: "18px",
    fontWeight: "600",
    color: "#fafafa",
  },
  emptyDescription: {
    margin: "0 0 24px 0",
    fontSize: "14px",
    color: "#71717a",
    maxWidth: "300px",
  },

  // Pages list
  pagesList: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  pageCard: {
    backgroundColor: "#18181b",
    border: "1px solid #27272a",
    borderRadius: "12px",
    padding: "20px",
  },
  pageCardHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: "16px",
  },
  pageInfo: {
    flex: 1,
  },
  pageName: {
    margin: "0 0 8px 0",
    fontSize: "16px",
    fontWeight: "600",
    color: "#fafafa",
  },
  pageMeta: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "8px",
  },
  pagePrice: {
    fontSize: "13px",
    color: "#a1a1aa",
  },
  pagePlanId: {
    padding: "2px 8px",
    fontSize: "12px",
    fontWeight: "500",
    color: "#6366f1",
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    borderRadius: "4px",
    fontFamily: "monospace",
  },
  sandboxBadge: {
    padding: "2px 8px",
    fontSize: "11px",
    fontWeight: "600",
    color: "#f59e0b",
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    borderRadius: "4px",
    textTransform: "uppercase",
  },
  pageActions: {
    display: "flex",
    gap: "8px",
  },
  urlRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px",
    backgroundColor: "#09090b",
    borderRadius: "8px",
  },
  urlText: {
    flex: 1,
    fontSize: "13px",
    color: "#6366f1",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
};
