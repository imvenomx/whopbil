"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/orders?t=${Date.now()}`, { cache: "no-store" });
        if (res.status === 401) { setIsAuthed(false); setLoading(false); return; }
        if (!res.ok) throw new Error();
        const data = await res.json();
        setOrders(data.orders || []);
        setIsAuthed(true);
      } catch { }
      setLoading(false);
    })();
  }, []);

  const countryNames = { IT: "Italy", FR: "France", DE: "Germany", ES: "Spain", NL: "Netherlands", AT: "Austria", BE: "Belgium", PT: "Portugal", CH: "Switzerland", GB: "United Kingdom" };

  if (loading) return <div style={s.loading}><div style={s.spinner} /><style jsx global>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>;
  if (!isAuthed) return <div style={s.loading}><p style={{ color: "#71717a", fontSize: 14 }}>Please <Link href="/admin" style={{ color: "#6366f1" }}>login to admin</Link> first.</p></div>;

  return (
    <div style={s.container}>
      <aside style={s.sidebar}>
        <div style={s.sidebarHeader}>
          <Link href="/admin" style={s.backLink}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            <span>Back to Dashboard</span>
          </Link>
        </div>
        <div style={s.sidebarContent}>
          <h2 style={s.sidebarTitle}>Orders</h2>
          <p style={s.sidebarDesc}>View all completed orders</p>
        </div>
      </aside>

      <main style={s.main}>
        <div style={s.wrapper}>
          <header style={s.header}>
            <div>
              <h1 style={s.title}>Orders</h1>
              <p style={s.subtitle}>{orders.length} order{orders.length !== 1 ? "s" : ""}</p>
            </div>
          </header>

          {/* Stats */}
          <div style={s.statsGrid}>
            <div style={s.statCard}>
              <div style={s.statIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div>
                <p style={s.statLabel}>Total Orders</p>
                <p style={s.statValue}>{orders.length}</p>
              </div>
            </div>
            <div style={s.statCard}>
              <div style={{ ...s.statIcon, backgroundColor: "rgba(34,197,94,0.1)", color: "#22c55e" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              </div>
              <div>
                <p style={s.statLabel}>Total Earnings</p>
                <p style={{ ...s.statValue, color: "#22c55e" }}>€{orders.reduce((sum, o) => sum + (parseFloat(o.price) || 0), 0).toFixed(2)}</p>
              </div>
            </div>
          </div>

          {orders.length === 0 ? (
            <div style={s.empty}>
              <h3 style={s.emptyTitle}>No orders yet</h3>
              <p style={s.emptyDesc}>Orders will appear here after successful payments.</p>
            </div>
          ) : (
            <div style={s.list}>
              {orders.map((order) => (
                <div key={order.id} style={s.card}>
                  <div style={s.cardHeader} onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}>
                    <div style={s.cardLeft}>
                      <span style={s.orderId}>#{order.id}</span>
                      <span style={s.cardName}>{order.firstName} {order.lastName}</span>
                      <span style={s.cardEmail}>{order.email}</span>
                    </div>
                    <div style={s.cardRight}>
                      <span style={s.cardPrice}>{order.price ? `€${order.price}` : "—"}</span>
                      <span style={s.badge}>Completed</span>
                      <span style={s.cardDate}>{new Date(order.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                  </div>

                  {expandedId === order.id && (
                    <div style={s.cardBody}>
                      <div style={s.grid}>
                        <div style={s.detail}>
                          <span style={s.detailLabel}>Product</span>
                          <span style={s.detailValue}>{order.productName || "—"}</span>
                        </div>
                        <div style={s.detail}>
                          <span style={s.detailLabel}>Plan ID</span>
                          <span style={s.detailValue}>{order.planId || "—"}</span>
                        </div>
                        <div style={s.detail}>
                          <span style={s.detailLabel}>Receipt ID</span>
                          <span style={s.detailValue}>{order.receiptId || "—"}</span>
                        </div>
                        <div style={s.detail}>
                          <span style={s.detailLabel}>Phone</span>
                          <span style={s.detailValue}>{order.phone || "—"}</span>
                        </div>
                      </div>
                      <div style={{ ...s.detail, marginTop: 12 }}>
                        <span style={s.detailLabel}>Delivery Address</span>
                        <span style={s.detailValue}>
                          {order.firstName} {order.lastName}, {order.address}{order.apartment ? `, ${order.apartment}` : ""}, {order.city}{order.province ? `, ${order.province}` : ""} {order.postalCode}, {countryNames[order.country] || order.country}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <style jsx global>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

const s = {
  loading: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#09090b" },
  spinner: { width: 40, height: 40, border: "3px solid #27272a", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 1s linear infinite" },
  container: { display: "flex", minHeight: "100vh", backgroundColor: "#09090b" },
  sidebar: { width: 280, backgroundColor: "#18181b", borderRight: "1px solid #27272a", display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, bottom: 0 },
  sidebarHeader: { padding: 20, borderBottom: "1px solid #27272a" },
  backLink: { display: "flex", alignItems: "center", gap: 8, color: "#71717a", textDecoration: "none", fontSize: 14 },
  sidebarContent: { flex: 1, padding: "24px 20px" },
  sidebarTitle: { margin: "0 0 8px", fontSize: 18, fontWeight: 600, color: "#fafafa" },
  sidebarDesc: { margin: 0, fontSize: 14, color: "#71717a" },
  main: { flex: 1, marginLeft: 280, minHeight: "100vh" },
  wrapper: { maxWidth: 900, margin: "0 auto", padding: 40 },
  header: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 },
  statsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 28 },
  statCard: { display: "flex", alignItems: "center", gap: 14, padding: "18px 20px", backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: 12 },
  statIcon: { width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(99,102,241,0.1)", borderRadius: 10, color: "#6366f1" },
  statLabel: { margin: "0 0 2px", fontSize: 12, color: "#71717a" },
  statValue: { margin: 0, fontSize: 22, fontWeight: 700, color: "#fafafa" },
  title: { margin: "0 0 4px", fontSize: 28, fontWeight: 700, color: "#fafafa" },
  subtitle: { margin: 0, fontSize: 14, color: "#71717a" },
  empty: { display: "flex", flexDirection: "column", alignItems: "center", padding: "60px 20px", backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: 12, textAlign: "center" },
  emptyTitle: { margin: "0 0 8px", fontSize: 18, fontWeight: 600, color: "#fafafa" },
  emptyDesc: { margin: 0, fontSize: 14, color: "#71717a" },
  list: { display: "flex", flexDirection: "column", gap: 12 },
  card: { backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: 12, overflow: "hidden" },
  cardHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", cursor: "pointer", flexWrap: "wrap", gap: 8 },
  cardLeft: { display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" },
  orderId: { fontSize: 12, fontWeight: 600, color: "#6366f1", fontFamily: "monospace" },
  cardName: { fontSize: 14, fontWeight: 600, color: "#fafafa" },
  cardEmail: { fontSize: 13, color: "#71717a" },
  cardRight: { display: "flex", alignItems: "center", gap: 12 },
  cardPrice: { fontSize: 14, fontWeight: 700, color: "#fafafa" },
  badge: { padding: "2px 8px", fontSize: 11, fontWeight: 600, color: "#22c55e", backgroundColor: "rgba(34,197,94,0.1)", borderRadius: 4, textTransform: "uppercase" },
  cardDate: { fontSize: 12, color: "#52525b" },
  cardBody: { padding: "0 20px 20px", borderTop: "1px solid #27272a", paddingTop: 16 },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  detail: { display: "flex", flexDirection: "column", gap: 2 },
  detailLabel: { fontSize: 12, color: "#71717a" },
  detailValue: { fontSize: 13, color: "#a1a1aa", wordBreak: "break-all" },
};
