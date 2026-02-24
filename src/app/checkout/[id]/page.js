"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";

const I18N = {
  en: {
    store_name: "Cutekits",
    secure_checkout: "Secure checkout",
    summary_title: "Order summary",
    summary_items: "1 item",
    free_shipping: "Free shipping",
    subtotal: "Subtotal",
    total: "Total",
    contact_title: "Contact",
    contact_subtitle: "We'll use this to confirm your order.",
    email_label: "Email",
    email_placeholder: "Email",
    marketing_opt_in: "Email me with news and offers",
    shipping_title: "Shipping address",
    address_label: "Address",
    address_placeholder: "Address",
    apt_label: "Apartment, suite, etc. (optional)",
    apt_placeholder: "Apartment, suite, etc. (optional)",
    city_label: "City",
    city_placeholder: "City",
    postal_label: "Postal code",
    postal_placeholder: "Postal code",
    country_label: "Country/Region",
    country_fr: "France",
    country_de: "Germany",
    return_to_cart: "Return to cart",
  },
  fr: {
    store_name: "Cutekits",
    secure_checkout: "Paiement sécurisé",
    summary_title: "Récapitulatif",
    summary_items: "1 article",
    free_shipping: "Livraison gratuite",
    subtotal: "Sous-total",
    total: "Total",
    contact_title: "Coordonnées",
    contact_subtitle: "Nous utiliserons ces informations pour confirmer votre commande.",
    email_label: "E-mail",
    email_placeholder: "E-mail",
    marketing_opt_in: "M'envoyer des offres et des actualités par e-mail",
    shipping_title: "Adresse de livraison",
    address_label: "Adresse",
    address_placeholder: "Adresse",
    apt_label: "Appartement, suite, etc. (facultatif)",
    apt_placeholder: "Appartement, suite, etc. (facultatif)",
    city_label: "Ville",
    city_placeholder: "Ville",
    postal_label: "Code postal",
    postal_placeholder: "Code postal",
    country_label: "Pays/Région",
    country_fr: "France",
    country_de: "Allemagne",
    return_to_cart: "Retour au panier",
  },
  de: {
    store_name: "Cutekits",
    secure_checkout: "Sicherer Checkout",
    summary_title: "Bestellübersicht",
    summary_items: "1 Artikel",
    free_shipping: "Kostenloser Versand",
    subtotal: "Zwischensumme",
    total: "Gesamt",
    contact_title: "Kontakt",
    contact_subtitle: "Wir verwenden diese Informationen, um deine Bestellung zu bestätigen.",
    email_label: "E-Mail",
    email_placeholder: "E-Mail",
    marketing_opt_in: "E-Mails mit Neuigkeiten und Angeboten erhalten",
    shipping_title: "Lieferadresse",
    address_label: "Adresse",
    address_placeholder: "Adresse",
    apt_label: "Wohnung, Suite usw. (optional)",
    apt_placeholder: "Wohnung, Suite usw. (optional)",
    city_label: "Stadt",
    city_placeholder: "Stadt",
    postal_label: "Postleitzahl",
    postal_placeholder: "Postleitzahl",
    country_label: "Land/Region",
    country_fr: "Frankreich",
    country_de: "Deutschland",
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
  const [email, setEmail] = useState("");
  const [checkoutId, setCheckoutId] = useState(null);
  const [customerId, setCustomerId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cardMounted, setCardMounted] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const cardInstanceRef = useRef(null);
  const sessionIdRef = useRef(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  const displayPrice = pageConfig ? `${pageConfig.price} €` : "...";

  // i18n
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ipLang = await detectLangByIP();
      const browserLang = normalizeLang(navigator.language);
      if (!cancelled) translatePage(ipLang || browserLang || "en");
    })();
    return () => { cancelled = true; };
  }, []);

  // Load page config and create checkout immediately
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch page config
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

        // Create tokenization checkout immediately with placeholder email
        const amount = parseFloat(pageData.price.replace(",", ".")) || 84.0;
        const placeholderEmail = `pending_${sessionIdRef.current}@placeholder.local`;

        const res = await fetch("/api/checkout/tokenize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: placeholderEmail,
            name: "",
            amount,
            currency: "EUR",
            description: pageData.productName || "Subscription payment",
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to create checkout");
        }

        const data = await res.json();
        if (cancelled) return;
        setCheckoutId(data.checkoutId);
        setCustomerId(data.customerId);
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [pageId]);

  // Mount SumUp Card
  useEffect(() => {
    if (!checkoutId || cardMounted) return;

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
          const card = window.SumUpCard.mount({
            id: "sumup-card",
            checkoutId: checkoutId,
            onResponse: async function (type, body) {
              console.log("SumUp response:", type, body);
              if (type === "success") {
                // Get the email from the form
                const emailInput = document.getElementById("email");
                const customerEmail = emailInput?.value || "";

                if (!customerEmail || !customerEmail.includes("@")) {
                  if (window.Swal) {
                    window.Swal.fire({
                      icon: "warning",
                      title: "Email required",
                      text: "Please enter your email address.",
                    });
                  }
                  return;
                }

                // Complete tokenization - save card and create subscription
                try {
                  const amount = parseFloat(pageConfig.price.replace(",", ".")) || 84.0;
                  const completeRes = await fetch("/api/checkout/complete-tokenization", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      checkoutId,
                      customerId,
                      amount,
                      interval: pageConfig.interval || "monthly",
                      intervalCount: pageConfig.intervalCount || 1,
                      checkoutPageId: pageId,
                      email: customerEmail,
                      metadata: {
                        productName: pageConfig.productName,
                      },
                    }),
                  });

                  const completeData = await completeRes.json();
                  console.log("Tokenization complete:", completeData);
                } catch (e) {
                  console.error("Failed to complete tokenization:", e);
                }

                setPaymentSuccess(true);
                if (window.Swal) {
                  window.Swal.fire({
                    icon: "success",
                    title: "Payment successful!",
                    text: "Thank you for your purchase. Your subscription is now active.",
                  });
                }
              } else if (type === "error" && window.Swal) {
                window.Swal.fire({
                  icon: "error",
                  title: "Payment failed",
                  text: body?.message || "Please try again.",
                });
              }
            },
          });
          cardInstanceRef.current = card;
          setCardMounted(true);
        } catch (e) {
          setError("Failed to load payment form");
        }
      }
    };

    mountCard();
  }, [checkoutId, cardMounted, customerId, pageConfig, pageId]);

  if (notFound) {
    return (
      <main style={{ padding: 40, textAlign: "center" }}>
        <h1>Checkout Not Found</h1>
        <p>The checkout page you're looking for doesn't exist.</p>
      </main>
    );
  }

  if (paymentSuccess) {
    return (
      <main style={{ padding: 40, textAlign: "center", maxWidth: 600, margin: "0 auto" }}>
        <div style={{ fontSize: 64, marginBottom: 24 }}>&#10003;</div>
        <h1 style={{ marginBottom: 16 }}>Payment Successful!</h1>
        <p style={{ color: "#6d7175", marginBottom: 24 }}>
          Thank you for your subscription. Your card has been saved for future billing.
        </p>
        <p style={{ color: "#6d7175" }}>
          You will receive a confirmation email at <strong>{email}</strong>
        </p>
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
                    <div style={{ fontWeight: 650 }} data-i18n="summary_title">Order summary</div>
                    <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 2 }} data-i18n="summary_items">1 item</div>
                  </div>
                  <span className="pill">EUR</span>
                </div>

                <div className="product">
                  {pageConfig?.productImage && (
                    <img className="product-img" src={pageConfig.productImage} alt="Product" />
                  )}
                  {!pageConfig?.productImage && (
                    <img className="product-img" src="https://cdn-icons-png.flaticon.com/512/8832/8832119.png" alt="Product" />
                  )}
                  <div style={{ minWidth: 0 }}>
                    <div className="product-title">{pageConfig?.productName || "Product"}</div>
                    <div className="product-variant" data-i18n="free_shipping">Free shipping</div>
                  </div>
                  <div style={{ marginLeft: "auto", fontWeight: 650 }}>{displayPrice}</div>
                </div>

                <div className="summary-row">
                  <span style={{ color: "var(--muted)" }} data-i18n="subtotal">Subtotal</span>
                  <span>{displayPrice}</span>
                </div>
                <div className="summary-row">
                  <span className="total" data-i18n="total">Total</span>
                  <span className="total">{displayPrice}</span>
                </div>
              </div>

              <div className="panel" style={{ padding: 0 }}>
                <h2 className="section-title" data-i18n="contact_title">Contact</h2>
                <p className="section-subtitle" data-i18n="contact_subtitle">We'll use this to confirm your order.</p>
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
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="checkbox">
                    <input id="updates" type="checkbox" defaultChecked />
                    <label htmlFor="updates" style={{ margin: 0, color: "var(--text)", fontSize: 13 }} data-i18n="marketing_opt_in">Email me with news and offers</label>
                  </div>
                </div>
              </div>

              <div className="panel" style={{ borderTop: "1px solid var(--border-soft)", paddingLeft: 0, paddingRight: 0 }}>
                <h2 className="section-title" data-i18n="shipping_title">Shipping address</h2>
                <div>
                  <label htmlFor="address" data-i18n="address_label">Address</label>
                  <input id="address" className="field" type="text" placeholder="Address" data-i18n-placeholder="address_placeholder" autoComplete="street-address" />
                </div>
                <div>
                  <label htmlFor="apt" data-i18n="apt_label">Apartment, suite, etc. (optional)</label>
                  <input id="apt" className="field" type="text" placeholder="Apartment, suite, etc. (optional)" data-i18n-placeholder="apt_placeholder" autoComplete="address-line2" />
                </div>
                <div className="row">
                  <div>
                    <label htmlFor="city" data-i18n="city_label">City</label>
                    <input id="city" className="field" type="text" placeholder="City" data-i18n-placeholder="city_placeholder" autoComplete="address-level2" />
                  </div>
                  <div>
                    <label htmlFor="postal" data-i18n="postal_label">Postal code</label>
                    <input id="postal" className="field" type="text" placeholder="Postal code" data-i18n-placeholder="postal_placeholder" autoComplete="postal-code" />
                  </div>
                </div>
                <div className="row">
                  <div>
                    <label htmlFor="country" data-i18n="country_label">Country/Region</label>
                    <select id="country" className="field" autoComplete="country-name" defaultValue="FR">
                      <option value="FR" data-i18n="country_fr">France</option>
                      <option value="DE" data-i18n="country_de">Germany</option>
                    </select>
                  </div>
                </div>
                <div className="actions">
                  <a className="link" href="#" onClick={(e) => e.preventDefault()} data-i18n="return_to_cart">Return to cart</a>
                </div>
              </div>
            </div>
          </section>

          <aside className="right">
            <div className="right-inner">
              <div className="if">
                {loading ? (
                  <div style={{ padding: 40, textAlign: "center", color: "#6d7175" }}>Loading payment form...</div>
                ) : error ? (
                  <div style={{ padding: 40, textAlign: "center", color: "#b42318" }}>{error}</div>
                ) : (
                  <div id="sumup-card" style={{ minHeight: 400 }}></div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
