"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const initialForm = {
  username: "",
  password: "",
};

// Icons as SVG components
const Icons = {
  pages: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
      <polyline points="14,2 14,8 20,8"/>
    </svg>
  ),
  logout: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  whop: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
    </svg>
  ),
  check: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  arrowRight: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/>
      <polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
  external: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
      <polyline points="15 3 21 3 21 9"/>
      <line x1="10" y1="14" x2="21" y2="3"/>
    </svg>
  ),
};

export default function AdminPage() {
  const [form, setForm] = useState(initialForm);
  const [isAuthed, setIsAuthed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [checkoutPagesCount, setCheckoutPagesCount] = useState(0);

  async function checkAuth() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/admin/config?t=${Date.now()}`, { cache: "no-store" });
      if (res.status === 401) {
        setIsAuthed(false);
        setLoading(false);
        return;
      }
      if (!res.ok) {
        throw new Error("Failed to check auth");
      }
      setIsAuthed(true);

      // Load checkout pages count
      const pagesRes = await fetch(`/api/admin/checkout-pages?t=${Date.now()}`, { cache: "no-store" });
      if (pagesRes.ok) {
        const data = await pagesRes.json();
        setCheckoutPagesCount(data.pages?.length || 0);
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
        setError("Invalid credentials");
        return;
      }

      setForm(initialForm);
      await checkAuth();
    } catch (e) {
      setError("Login failed");
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

  // Loading state
  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
      </div>
    );
  }

  // Login form
  if (!isAuthed) {
    return (
      <div style={styles.loginContainer}>
        <div style={styles.loginCard}>
          <div style={styles.loginHeader}>
            <div style={styles.loginLogo}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <h1 style={styles.loginTitle}>Admin Dashboard</h1>
            <p style={styles.loginSubtitle}>Sign in to manage your checkout pages</p>
          </div>

          {error && (
            <div style={styles.errorBanner}>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={login} style={styles.loginForm}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Username</label>
              <input
                type="text"
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                style={styles.input}
                placeholder="Enter your username"
                autoComplete="username"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                style={styles.input}
                placeholder="Enter your password"
                autoComplete="current-password"
              />
            </div>

            <button type="submit" style={styles.loginButton}>
              Sign in
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Dashboard
  return (
    <div style={styles.dashboardContainer}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <div style={styles.sidebarLogo}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
            <span style={styles.sidebarLogoText}>Whop Admin</span>
          </div>
        </div>

        <nav style={styles.sidebarNav}>
          <Link href="/admin/checkout-pages" style={styles.sidebarLink}>
            <span style={styles.sidebarLinkIcon}>{Icons.pages}</span>
            <span>Checkout Pages</span>
            {checkoutPagesCount > 0 && (
              <span style={styles.badge}>{checkoutPagesCount}</span>
            )}
          </Link>
        </nav>

        <div style={styles.sidebarFooter}>
          <a
            href="https://whop.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            style={styles.sidebarExternalLink}
          >
            <span>Whop Dashboard</span>
            {Icons.external}
          </a>
          <button onClick={logout} style={styles.logoutButton}>
            {Icons.logout}
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={styles.mainContent}>
        <div style={styles.contentWrapper}>
          {/* Header */}
          <header style={styles.header}>
            <div>
              <h1 style={styles.headerTitle}>Dashboard</h1>
              <p style={styles.headerSubtitle}>Manage your Whop checkout integration</p>
            </div>
          </header>

          {error && (
            <div style={styles.errorBannerDash}>
              {error}
            </div>
          )}

          {/* Stats Grid */}
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>
                {Icons.pages}
              </div>
              <div style={styles.statContent}>
                <p style={styles.statLabel}>Checkout Pages</p>
                <p style={styles.statValue}>{checkoutPagesCount}</p>
              </div>
            </div>

            <div style={styles.statCardSuccess}>
              <div style={styles.statIconSuccess}>
                {Icons.check}
              </div>
              <div style={styles.statContent}>
                <p style={styles.statLabel}>Integration Status</p>
                <p style={styles.statValueSuccess}>Active</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Quick Actions</h2>
            <div style={styles.actionsGrid}>
              <Link href="/admin/checkout-pages" style={styles.actionCard}>
                <div style={styles.actionCardContent}>
                  <div style={styles.actionIcon}>{Icons.pages}</div>
                  <div>
                    <h3 style={styles.actionTitle}>Manage Checkout Pages</h3>
                    <p style={styles.actionDescription}>
                      Create and configure checkout pages with Whop Plan IDs
                    </p>
                  </div>
                </div>
                <div style={styles.actionArrow}>{Icons.arrowRight}</div>
              </Link>
            </div>
          </section>

          {/* Info Card */}
          <section style={styles.section}>
            <div style={styles.infoCard}>
              <div style={styles.infoCardHeader}>
                <h3 style={styles.infoCardTitle}>Getting Started with Whop</h3>
              </div>
              <div style={styles.infoCardContent}>
                <ol style={styles.infoList}>
                  <li>Create a plan in your <a href="https://whop.com/dashboard" target="_blank" rel="noopener noreferrer" style={styles.infoLink}>Whop Dashboard</a></li>
                  <li>Copy your Plan ID (format: plan_XXXXXXXXX)</li>
                  <li>Create a checkout page and paste your Plan ID</li>
                  <li>Share your checkout URL with customers</li>
                </ol>
              </div>
            </div>
          </section>
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

  // Login
  loginContainer: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#09090b",
    padding: "20px",
  },
  loginCard: {
    width: "100%",
    maxWidth: "400px",
    backgroundColor: "#18181b",
    borderRadius: "16px",
    border: "1px solid #27272a",
    padding: "40px",
  },
  loginHeader: {
    textAlign: "center",
    marginBottom: "32px",
  },
  loginLogo: {
    marginBottom: "20px",
  },
  loginTitle: {
    margin: "0 0 8px 0",
    fontSize: "24px",
    fontWeight: "600",
    color: "#fafafa",
  },
  loginSubtitle: {
    margin: 0,
    fontSize: "14px",
    color: "#71717a",
  },
  loginForm: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  label: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#a1a1aa",
  },
  input: {
    width: "100%",
    height: "44px",
    padding: "0 16px",
    fontSize: "14px",
    color: "#fafafa",
    backgroundColor: "#09090b",
    border: "1px solid #27272a",
    borderRadius: "8px",
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
  },
  loginButton: {
    width: "100%",
    height: "44px",
    marginTop: "8px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#ffffff",
    backgroundColor: "#6366f1",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "background-color 0.2s",
  },
  errorBanner: {
    padding: "12px 16px",
    marginBottom: "20px",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    border: "1px solid rgba(239, 68, 68, 0.2)",
    borderRadius: "8px",
    color: "#ef4444",
    fontSize: "14px",
  },

  // Dashboard
  dashboardContainer: {
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
    padding: "24px",
    borderBottom: "1px solid #27272a",
  },
  sidebarLogo: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  sidebarLogoText: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#fafafa",
  },
  sidebarNav: {
    flex: 1,
    padding: "16px 12px",
  },
  sidebarLink: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 16px",
    borderRadius: "8px",
    color: "#a1a1aa",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: "500",
    transition: "all 0.2s",
    backgroundColor: "rgba(99, 102, 241, 0.1)",
  },
  sidebarLinkIcon: {
    display: "flex",
    alignItems: "center",
    color: "#6366f1",
  },
  badge: {
    marginLeft: "auto",
    padding: "2px 8px",
    fontSize: "12px",
    fontWeight: "600",
    color: "#6366f1",
    backgroundColor: "rgba(99, 102, 241, 0.2)",
    borderRadius: "12px",
  },
  sidebarFooter: {
    padding: "16px 12px",
    borderTop: "1px solid #27272a",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  sidebarExternalLink: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 16px",
    borderRadius: "8px",
    color: "#71717a",
    textDecoration: "none",
    fontSize: "14px",
    transition: "all 0.2s",
  },
  logoutButton: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 16px",
    borderRadius: "8px",
    color: "#71717a",
    backgroundColor: "transparent",
    border: "none",
    fontSize: "14px",
    cursor: "pointer",
    transition: "all 0.2s",
  },

  // Main content
  mainContent: {
    flex: 1,
    marginLeft: "280px",
    minHeight: "100vh",
  },
  contentWrapper: {
    maxWidth: "1000px",
    margin: "0 auto",
    padding: "40px",
  },

  // Header
  header: {
    marginBottom: "40px",
  },
  headerTitle: {
    margin: "0 0 8px 0",
    fontSize: "32px",
    fontWeight: "700",
    color: "#fafafa",
    letterSpacing: "-0.5px",
  },
  headerSubtitle: {
    margin: 0,
    fontSize: "16px",
    color: "#71717a",
  },

  errorBannerDash: {
    padding: "12px 16px",
    marginBottom: "24px",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    border: "1px solid rgba(239, 68, 68, 0.2)",
    borderRadius: "8px",
    color: "#ef4444",
    fontSize: "14px",
  },

  // Stats
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "20px",
    marginBottom: "40px",
  },
  statCard: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    padding: "24px",
    backgroundColor: "#18181b",
    border: "1px solid #27272a",
    borderRadius: "12px",
  },
  statCardSuccess: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    padding: "24px",
    backgroundColor: "rgba(34, 197, 94, 0.05)",
    border: "1px solid rgba(34, 197, 94, 0.2)",
    borderRadius: "12px",
  },
  statIcon: {
    width: "48px",
    height: "48px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    borderRadius: "10px",
    color: "#6366f1",
  },
  statIconSuccess: {
    width: "48px",
    height: "48px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    borderRadius: "10px",
    color: "#22c55e",
  },
  statContent: {},
  statLabel: {
    margin: "0 0 4px 0",
    fontSize: "14px",
    color: "#71717a",
  },
  statValue: {
    margin: 0,
    fontSize: "28px",
    fontWeight: "700",
    color: "#fafafa",
  },
  statValueSuccess: {
    margin: 0,
    fontSize: "20px",
    fontWeight: "600",
    color: "#22c55e",
  },

  // Sections
  section: {
    marginBottom: "32px",
  },
  sectionTitle: {
    margin: "0 0 16px 0",
    fontSize: "18px",
    fontWeight: "600",
    color: "#fafafa",
  },

  // Actions
  actionsGrid: {
    display: "grid",
    gap: "16px",
  },
  actionCard: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "20px 24px",
    backgroundColor: "#18181b",
    border: "1px solid #27272a",
    borderRadius: "12px",
    textDecoration: "none",
    transition: "all 0.2s",
  },
  actionCardContent: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  actionIcon: {
    width: "44px",
    height: "44px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    borderRadius: "10px",
    color: "#6366f1",
  },
  actionTitle: {
    margin: "0 0 4px 0",
    fontSize: "16px",
    fontWeight: "600",
    color: "#fafafa",
  },
  actionDescription: {
    margin: 0,
    fontSize: "14px",
    color: "#71717a",
  },
  actionArrow: {
    color: "#71717a",
  },

  // Info card
  infoCard: {
    backgroundColor: "#18181b",
    border: "1px solid #27272a",
    borderRadius: "12px",
    overflow: "hidden",
  },
  infoCardHeader: {
    padding: "16px 24px",
    borderBottom: "1px solid #27272a",
  },
  infoCardTitle: {
    margin: 0,
    fontSize: "16px",
    fontWeight: "600",
    color: "#fafafa",
  },
  infoCardContent: {
    padding: "20px 24px",
  },
  infoList: {
    margin: 0,
    padding: "0 0 0 20px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    fontSize: "14px",
    color: "#a1a1aa",
    lineHeight: "1.6",
  },
  infoLink: {
    color: "#6366f1",
    textDecoration: "none",
  },
};
