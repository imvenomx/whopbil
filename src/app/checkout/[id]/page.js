"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { WhopCheckoutEmbed } from "@whop/checkout/react";

export default function CheckoutPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const pageId = params.id;

  const [pageConfig, setPageConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState(false);

  // Check for return status from Whop redirect
  useEffect(() => {
    const status = searchParams.get("status");
    if (status === "success") {
      setPaymentSuccess(true);
    } else if (status === "error") {
      setPaymentError(true);
    }
  }, [searchParams]);

  // Load page config
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const pageRes = await fetch(`/api/checkout-page/${pageId}`, { cache: "no-store" });
        if (pageRes.status === 404) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        if (!pageRes.ok) throw new Error("Failed to load checkout page");
        const pageData = await pageRes.json();
        if (cancelled) return;
        setPageConfig(pageData);
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [pageId]);

  // Handle successful payment
  const handleComplete = (planId, receiptId) => {
    console.log("[Whop] Payment complete:", { planId, receiptId });
    setPaymentSuccess(true);
  };

  // Get return URL for redirects
  const getReturnUrl = () => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/checkout/${pageId}`;
    }
    return `/checkout/${pageId}`;
  };

  // Not Found page
  if (notFound) {
    return (
      <main style={styles.errorPage}>
        <h1 style={styles.errorTitle}>Checkout Not Found</h1>
        <p style={styles.errorMessage}>The checkout page you're looking for doesn't exist.</p>
      </main>
    );
  }

  // Error state from return
  if (paymentError) {
    return (
      <main style={styles.errorPage}>
        <div style={styles.errorIcon}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        </div>
        <h1 style={styles.errorTitle}>Payment Failed</h1>
        <p style={styles.errorMessage}>
          Something went wrong with your payment. Please try again.
        </p>
        <button
          onClick={() => {
            setPaymentError(false);
            window.history.replaceState({}, "", `/checkout/${pageId}`);
          }}
          style={styles.retryButton}
        >
          Try Again
        </button>
      </main>
    );
  }

  // Success page
  if (paymentSuccess) {
    return (
      <main style={styles.successPage}>
        <div style={styles.successIcon}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <h1 style={styles.successTitle}>Payment Successful!</h1>
        <p style={styles.successMessage}>
          Thank you for your purchase. You will receive a confirmation email shortly.
        </p>
      </main>
    );
  }

  // Loading state
  if (loading) {
    return (
      <main style={styles.loadingPage}>
        <div style={styles.spinner}></div>
        <p>Loading checkout...</p>
      </main>
    );
  }

  // Error state
  if (error) {
    return (
      <main style={styles.errorPage}>
        <h1 style={styles.errorTitle}>Error</h1>
        <p style={styles.errorMessage}>{error}</p>
      </main>
    );
  }

  // Check if Whop Plan ID is configured
  if (!pageConfig?.whopPlanId) {
    return (
      <main style={styles.errorPage}>
        <h1 style={styles.errorTitle}>Checkout Not Configured</h1>
        <p style={styles.errorMessage}>
          This checkout page has not been configured with a Whop Plan ID.
          Please contact the administrator.
        </p>
      </main>
    );
  }

  // Main checkout page with Whop embed
  return (
    <div style={styles.container}>
      <div style={styles.checkoutWrapper}>
        {/* Whop Checkout Embed */}
        <div style={styles.embedContainer}>
          <WhopCheckoutEmbed
            planId={pageConfig.whopPlanId}
            returnUrl={getReturnUrl()}
            environment={pageConfig.whopEnvironment || "production"}
            theme="light"
            onComplete={handleComplete}
            skipRedirect={true}
            fallback={
              <div style={styles.loadingEmbed}>
                <div style={styles.spinner}></div>
                <p>Loading payment form...</p>
              </div>
            }
          />
        </div>
      </div>

      <style jsx global>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#f8fafc",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    padding: "40px 20px",
  },
  checkoutWrapper: {
    width: "100%",
    maxWidth: "500px",
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)",
    overflow: "hidden",
  },
  header: {
    padding: "24px",
    borderBottom: "1px solid #e5e7eb",
    textAlign: "center",
  },
  headerTitle: {
    margin: "0 0 8px 0",
    fontSize: "24px",
    fontWeight: "600",
    color: "#111827",
  },
  headerPrice: {
    margin: 0,
    fontSize: "20px",
    fontWeight: "500",
    color: "#374151",
  },
  headerInterval: {
    fontSize: "14px",
    color: "#6b7280",
  },
  embedContainer: {
    minHeight: "400px",
    padding: "0",
  },
  loadingEmbed: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "60px 20px",
    color: "#6b7280",
  },
  footer: {
    padding: "16px 24px",
    borderTop: "1px solid #e5e7eb",
    textAlign: "center",
  },
  footerText: {
    margin: 0,
    fontSize: "12px",
    color: "#9ca3af",
  },
  loadingPage: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color: "#6b7280",
    gap: "16px",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "3px solid #e5e7eb",
    borderTopColor: "#3b82f6",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  errorPage: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    textAlign: "center",
  },
  errorIcon: {
    marginBottom: "16px",
  },
  errorTitle: {
    margin: "0 0 8px 0",
    fontSize: "24px",
    fontWeight: "600",
    color: "#111827",
  },
  errorMessage: {
    margin: 0,
    fontSize: "16px",
    color: "#6b7280",
    maxWidth: "400px",
  },
  retryButton: {
    marginTop: "24px",
    padding: "12px 24px",
    backgroundColor: "#3b82f6",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: "500",
    cursor: "pointer",
  },
  successPage: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    textAlign: "center",
    backgroundColor: "#f0fdf4",
  },
  successIcon: {
    marginBottom: "16px",
    width: "80px",
    height: "80px",
    backgroundColor: "#dcfce7",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  successTitle: {
    margin: "0 0 8px 0",
    fontSize: "28px",
    fontWeight: "600",
    color: "#166534",
  },
  successMessage: {
    margin: 0,
    fontSize: "16px",
    color: "#4b5563",
    maxWidth: "400px",
  },
};
