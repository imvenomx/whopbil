"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";

const I18N = {
  en: {
    store_name: "Cutekits",
    secure_checkout: "Secure checkout",
    summary_title: "Subscription summary",
    summary_items: "Recurring payment",
    free_shipping: "Free shipping",
    subtotal: "Subtotal",
    total: "Total",
    per_interval: "per",
    contact_title: "Contact",
    contact_subtitle: "We'll use this to manage your subscription.",
    email_label: "Email",
    email_placeholder: "Email",
    email_required: "Email is required for subscription",
    name_label: "Name",
    name_placeholder: "Your name",
    subscription_title: "Subscription",
    interval_label: "Billing interval",
    interval_daily: "Daily",
    interval_weekly: "Weekly",
    interval_monthly: "Monthly",
    interval_yearly: "Yearly",
    start_subscription: "Start Subscription",
    processing: "Processing...",
    subscription_success: "Subscription activated!",
    subscription_success_text: "Your card has been saved and you will be charged automatically.",
    payment_failed: "Payment failed",
    return_to_cart: "Return to cart",
  },
  fr: {
    store_name: "Cutekits",
    secure_checkout: "Paiement sécurisé",
    summary_title: "Récapitulatif abonnement",
    summary_items: "Paiement récurrent",
    free_shipping: "Livraison gratuite",
    subtotal: "Sous-total",
    total: "Total",
    per_interval: "par",
    contact_title: "Coordonnées",
    contact_subtitle: "Nous utiliserons ces informations pour gérer votre abonnement.",
    email_label: "E-mail",
    email_placeholder: "E-mail",
    email_required: "L'e-mail est requis pour l'abonnement",
    name_label: "Nom",
    name_placeholder: "Votre nom",
    subscription_title: "Abonnement",
    interval_label: "Fréquence de facturation",
    interval_daily: "Quotidien",
    interval_weekly: "Hebdomadaire",
    interval_monthly: "Mensuel",
    interval_yearly: "Annuel",
    start_subscription: "Démarrer l'abonnement",
    processing: "Traitement...",
    subscription_success: "Abonnement activé !",
    subscription_success_text: "Votre carte a été enregistrée et vous serez débité automatiquement.",
    payment_failed: "Paiement échoué",
    return_to_cart: "Retour au panier",
  },
  de: {
    store_name: "Cutekits",
    secure_checkout: "Sicherer Checkout",
    summary_title: "Abo-Übersicht",
    summary_items: "Wiederkehrende Zahlung",
    free_shipping: "Kostenloser Versand",
    subtotal: "Zwischensumme",
    total: "Gesamt",
    per_interval: "pro",
    contact_title: "Kontakt",
    contact_subtitle: "Wir verwenden diese Informationen, um dein Abonnement zu verwalten.",
    email_label: "E-Mail",
    email_placeholder: "E-Mail",
    email_required: "E-Mail ist für das Abonnement erforderlich",
    name_label: "Name",
    name_placeholder: "Dein Name",
    subscription_title: "Abonnement",
    interval_label: "Abrechnungsintervall",
    interval_daily: "Täglich",
    interval_weekly: "Wöchentlich",
    interval_monthly: "Monatlich",
    interval_yearly: "Jährlich",
    start_subscription: "Abonnement starten",
    processing: "Verarbeitung...",
    subscription_success: "Abonnement aktiviert!",
    subscription_success_text: "Deine Karte wurde gespeichert und du wirst automatisch belastet.",
    payment_failed: "Zahlung fehlgeschlagen",
    return_to_cart: "Zurück zum Warenkorb",
  },
};

const COUNTRY_TO_LANG = { FR: "fr", DE: "de", ES: "es", IT: "it", NL: "nl" };

function normalizeLang(lang) {
  if (!lang) return "en";
  const base = String(lang).toLowerCase().split("-")[0];
  return I18N[base] ? base : "en";
}

function translatePage(lang) {
  const dict = I18N[normalizeLang(lang)] || I18N.en;
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (key && dict[key]) el.textContent = dict[key];
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (key && dict[key]) el.setAttribute("placeholder", dict[key]);
  });
}

async function detectLangByIP() {
  try {
    const res = await fetch("https://ipapi.co/json/", { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    const cc = String(data.country_code || data.country || "").toUpperCase();
    return COUNTRY_TO_LANG[cc] || null;
  } catch {
    return null;
  }
}

export default function CheckoutPage() {
  const params = useParams();
  const pageId = params.id;

  const [pageConfig, setPageConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [lang, setLang] = useState("en");

  // Subscription form state
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [emailError, setEmailError] = useState("");

  // Checkout state
  const [checkoutId, setCheckoutId] = useState(null);
  const [customerId, setCustomerId] = useState(null);
  const [cardMounted, setCardMounted] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  const cardRef = useRef(null);

  const displayPrice = pageConfig ? `${pageConfig.price} €` : "...";
  const dict = I18N[lang] || I18N.en;

  // i18n
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ipLang = await detectLangByIP();
      const browserLang = normalizeLang(navigator.language);
      const detectedLang = ipLang || browserLang || "en";
      if (!cancelled) {
        setLang(detectedLang);
        translatePage(detectedLang);
      }
    })();
    return () => { cancelled = true; };
  }, []);

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

  // Handle starting subscription (creating tokenization checkout)
  const handleStartSubscription = async () => {
    // Validate email
    if (!email || !email.includes("@")) {
      setEmailError(dict.email_required);
      return;
    }
    setEmailError("");
    setProcessing(true);

    try {
      const amount = parseFloat(pageConfig.price.replace(",", ".")) || 84.00;

      // Create tokenization checkout
      const tokenizeRes = await fetch("/api/checkout/tokenize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name,
          amount,
          currency: "EUR",
          description: pageConfig?.productName || "Subscription",
        }),
      });

      if (!tokenizeRes.ok) {
        const errData = await tokenizeRes.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to create checkout");
      }

      const tokenizeData = await tokenizeRes.json();
      setCheckoutId(tokenizeData.checkoutId);
      setCustomerId(tokenizeData.customerId);
      setShowPayment(true);
    } catch (e) {
      setError(e.message);
      if (window.Swal) {
        window.Swal.fire({
          icon: "error",
          title: dict.payment_failed,
          text: e.message,
        });
      }
    } finally {
      setProcessing(false);
    }
  };

  // Mount SumUp Card when checkout is ready
  useEffect(() => {
    if (!checkoutId || !showPayment || cardMounted) return;

    const mountCard = async () => {
      if (!window.SumUpCard) {
        const script = document.createElement("script");
        script.src = "https://gateway.sumup.com/gateway/ecom/card/v2/sdk.js";
        script.async = true;
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      await new Promise((resolve) => setTimeout(resolve, 100));

      if (window.SumUpCard) {
        try {
          window.SumUpCard.mount({
            id: "sumup-card",
            checkoutId: checkoutId,
            onResponse: async function (type, body) {
              if (type === "success") {
                // Complete tokenization and create subscription
                try {
                  const amount = parseFloat(pageConfig.price.replace(",", ".")) || 84.00;

                  const completeRes = await fetch("/api/checkout/complete-tokenization", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      checkoutId,
                      customerId,
                      amount,
                      interval: "monthly",
                      intervalCount: 1,
                      checkoutPageId: pageConfig?.id || null,
                      metadata: {
                        productName: pageConfig?.productName || "Subscription",
                        email,
                        name,
                      },
                    }),
                  });

                  if (!completeRes.ok) {
                    const errData = await completeRes.json().catch(() => ({}));
                    throw new Error(errData.error || "Failed to activate subscription");
                  }

                  const completeData = await completeRes.json();

                  if (window.Swal) {
                    window.Swal.fire({
                      icon: "success",
                      title: dict.subscription_success,
                      html: `
                        <p>${dict.subscription_success_text}</p>
                        <p style="margin-top: 12px; font-size: 14px; color: #666;">
                          Card: ${completeData.paymentInstrument?.card_type || "Card"} ending in ${completeData.paymentInstrument?.last_4_digits || "****"}
                        </p>
                      `,
                    });
                  }
                } catch (e) {
                  console.error("Subscription activation error:", e);
                  if (window.Swal) {
                    window.Swal.fire({
                      icon: "warning",
                      title: "Payment processed",
                      text: "Payment was successful but subscription setup had an issue. Please contact support.",
                    });
                  }
                }
              } else if (type === "error") {
                if (window.Swal) {
                  window.Swal.fire({
                    icon: "error",
                    title: dict.payment_failed,
                    text: body?.message || "Please try again.",
                  });
                }
              }
            },
          });
          setCardMounted(true);
        } catch (e) {
          setError("Failed to load payment form");
        }
      }
    };

    mountCard();
  }, [checkoutId, showPayment, cardMounted, customerId, pageConfig, email, name, dict]);

  if (notFound) {
    return (
      <main style={{ padding: 40, textAlign: "center" }}>
        <h1>Checkout Not Found</h1>
        <p>The checkout page you're looking for doesn't exist.</p>
      </main>
    );
  }

  return (
    <>
      <header className="header">
        <div className="header-inner">
          <div className="header-grid">
            <div className="header-left">
              <div className="header-left-inner">
                <div className="store-name" data-i18n="store_name">Cutekits</div>
              </div>
            </div>
            <div className="header-right">
              <div className="header-right-inner">
                <div className="secure-badge" data-i18n="secure_checkout">Secure checkout</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container">
        <div className="grid">
          <section className="left">
            <div className="left-inner">
              <div className="summary summary-card">
                <div className="summary-row" style={{ paddingTop: 0 }}>
                  <div>
                    <div style={{ fontWeight: 650 }} data-i18n="summary_title">Subscription summary</div>
                    <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 2 }} data-i18n="summary_items">Recurring payment</div>
                  </div>
                  <span className="pill">EUR</span>
                </div>

                <div className="product">
                  {pageConfig?.productImage ? (
                    <img className="product-img" src={pageConfig.productImage} alt="Product" />
                  ) : (
                    <img className="product-img" src="https://cdn-icons-png.flaticon.com/512/8832/8832119.png" alt="Product" />
                  )}
                  <div style={{ minWidth: 0 }}>
                    <div className="product-title">{pageConfig?.productName || "Subscription"}</div>
                    <div className="product-variant">
                      {displayPrice} / month
                    </div>
                  </div>
                  <div style={{ marginLeft: "auto", fontWeight: 650 }}>{displayPrice}</div>
                </div>

                <div className="summary-row">
                  <span style={{ color: "var(--muted)" }} data-i18n="subtotal">Subtotal</span>
                  <span>{displayPrice}</span>
                </div>
                <div className="summary-row">
                  <span className="total" data-i18n="total">Total</span>
                  <span className="total">{displayPrice} / month</span>
                </div>
              </div>

              <div className="panel" style={{ padding: 0 }}>
                <h2 className="section-title" data-i18n="contact_title">Contact</h2>
                <p className="section-subtitle" data-i18n="contact_subtitle">We'll use this to manage your subscription.</p>
                <div className="form">
                  <div>
                    <label htmlFor="email" data-i18n="email_label">Email</label>
                    <input
                      id="email"
                      className="field"
                      type="email"
                      placeholder="Email"
                      data-i18n-placeholder="email_placeholder"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
                      disabled={showPayment}
                      required
                    />
                    {emailError && (
                      <div style={{ color: "#b42318", fontSize: 12, marginTop: 4 }}>{emailError}</div>
                    )}
                  </div>
                  <div>
                    <label htmlFor="name" data-i18n="name_label">Name</label>
                    <input
                      id="name"
                      className="field"
                      type="text"
                      placeholder="Your name"
                      data-i18n-placeholder="name_placeholder"
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={showPayment}
                    />
                  </div>
                </div>
              </div>

              {!showPayment && (
                <div className="panel" style={{ borderTop: "1px solid var(--border-soft)", paddingLeft: 0, paddingRight: 0 }}>
                  <div className="actions">
                    <button
                      className="btn-primary"
                      onClick={handleStartSubscription}
                      disabled={processing || loading}
                      style={{
                        width: "100%",
                        padding: "14px 24px",
                        fontSize: 16,
                        fontWeight: 600,
                        backgroundColor: "#1a1a1a",
                        color: "#fff",
                        border: "none",
                        borderRadius: 8,
                        cursor: processing || loading ? "not-allowed" : "pointer",
                        opacity: processing || loading ? 0.7 : 1,
                      }}
                    >
                      {processing ? dict.processing : dict.start_subscription}
                    </button>
                  </div>
                </div>
              )}

              {!showPayment && (
                <div className="actions" style={{ marginTop: 10 }}>
                  <a className="link" href="#" onClick={(e) => e.preventDefault()} data-i18n="return_to_cart">Return to cart</a>
                </div>
              )}
            </div>
          </section>

          <aside className="right">
            <div className="right-inner">
              <div className="if">
                {loading ? (
                  <div style={{ padding: 40, textAlign: "center", color: "#6d7175" }}>Loading...</div>
                ) : error ? (
                  <div style={{ padding: 40, textAlign: "center", color: "#b42318" }}>{error}</div>
                ) : !showPayment ? (
                  <div style={{ padding: 40, textAlign: "center", color: "#6d7175" }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>💳</div>
                    <p>Enter your email and click "{dict.start_subscription}" to continue</p>
                  </div>
                ) : (
                  <div id="sumup-card" ref={cardRef} style={{ minHeight: 400 }}></div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
