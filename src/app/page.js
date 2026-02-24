"use client";

import { useEffect, useState } from "react";

const I18N = {
  en: {
    store_name: "Cutekits",
    secure_checkout: "Secure checkout",
    summary_title: "Order summary",
    summary_items: "1 item",
    order_id: "Order ID: #594039",
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
    order_id: "Commande : #594039",
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
    order_id: "Bestellnr.: #594039",
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

const COUNTRY_TO_LANG = {
  FR: "fr",
  DE: "de",
  ES: "es",
  IT: "it",
  NL: "nl",
};

function normalizeLang(lang) {
  if (!lang) return "en";
  const l = String(lang).toLowerCase();
  const base = l.split("-")[0];
  if (I18N[base]) return base;
  return "en";
}

function translatePage(lang) {
  const l = normalizeLang(lang);
  const dict = I18N[l] || I18N.en;

  document.documentElement.lang = l;

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (!key) return;
    const value = dict[key] ?? I18N.en[key];
    if (typeof value === "string") el.textContent = value;
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (!key) return;
    const value = dict[key] ?? I18N.en[key];
    if (typeof value === "string") el.setAttribute("placeholder", value);
  });
}

async function detectLangByIP() {
  try {
    const res = await fetch("https://ipapi.co/json/", { cache: "no-store" });
    if (!res.ok) throw new Error("GeoIP failed");
    const data = await res.json();
    const cc =
      data && (data.country_code || data.country)
        ? String(data.country_code || data.country).toUpperCase()
        : "";
    return COUNTRY_TO_LANG[cc] || null;
  } catch (e) {
    return null;
  }
}

// Format card number with spaces
function formatCardNumber(value) {
  const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
  const matches = v.match(/\d{4,16}/g);
  const match = (matches && matches[0]) || "";
  const parts = [];
  for (let i = 0, len = match.length; i < len; i += 4) {
    parts.push(match.substring(i, i + 4));
  }
  return parts.length ? parts.join(" ") : v;
}

// Format expiry date
function formatExpiry(value) {
  const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
  if (v.length >= 2) {
    return v.substring(0, 2) + (v.length > 2 ? " / " + v.substring(2, 4) : "");
  }
  return v;
}

export default function Home() {
  const [config, setConfig] = useState({ price: "84,00" });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Form fields
  const [email, setEmail] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardName, setCardName] = useState("");

  const displayPrice = `${config.price} €`;

  useEffect(() => {
    let cancelled = false;

    (async function initI18n() {
      const ipLang = await detectLangByIP();
      const browserLang = normalizeLang(navigator.language || navigator.userLanguage);
      if (cancelled) return;
      translatePage(ipLang || browserLang || "en");
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Load config on mount
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        const configRes = await fetch("/api/config", { cache: "no-store" });
        if (configRes.ok) {
          const configData = await configRes.json();
          if (cancelled) return;
          setConfig({ price: configData?.price || "84,00" });
        }
      } catch (e) {
        console.error("Failed to load config:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validate
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }
    if (cardNumber.replace(/\s/g, "").length < 15) {
      setError("Please enter a valid card number");
      return;
    }
    if (cardExpiry.length < 7) {
      setError("Please enter a valid expiry date (MM / YY)");
      return;
    }
    if (cardCvv.length < 3) {
      setError("Please enter a valid CVV");
      return;
    }

    setProcessing(true);

    try {
      const amount = parseFloat(config.price.replace(",", ".")) || 84.0;
      const [expiryMonth, expiryYear] = cardExpiry.split(" / ");

      const res = await fetch("/api/checkout/process-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name: cardName,
          amount,
          currency: "EUR",
          description: "Subscription payment",
          card: {
            number: cardNumber.replace(/\s/g, ""),
            expiry_month: expiryMonth,
            expiry_year: expiryYear,
            cvv: cardCvv,
            name: cardName,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Payment failed");
      }

      // Payment successful
      setPaymentSuccess(true);

      // Create subscription
      try {
        await fetch("/api/checkout/complete-tokenization", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            checkoutId: data.checkoutId,
            customerId: data.customerId,
            amount,
            interval: "monthly",
            intervalCount: 1,
            email,
          }),
        });
      } catch (subErr) {
        console.error("Failed to create subscription:", subErr);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  if (paymentSuccess) {
    return (
      <main style={{ padding: 40, textAlign: "center", maxWidth: 600, margin: "0 auto" }}>
        <div style={{ fontSize: 64, marginBottom: 24, color: "#22c55e" }}>&#10003;</div>
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
                    <div style={{ fontWeight: 650 }} data-i18n="summary_title">Récapitulatif</div>
                    <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 2 }} data-i18n="summary_items">1 article</div>
                  </div>
                  <span className="pill">EUR</span>
                </div>

                <div className="product">
                  <img className="product-img" src="https://cdn-icons-png.flaticon.com/512/8832/8832119.png" alt="Produit" />
                  <div style={{ minWidth: 0 }}>
                    <div className="product-title" data-i18n="order_id">Order ID: #594039</div>
                    <div className="product-variant" data-i18n="free_shipping">Livraison Gratuit</div>
                  </div>
                  <div style={{ marginLeft: "auto", fontWeight: 650 }}>{displayPrice}</div>
                </div>

                <div className="summary-row">
                  <span style={{ color: "var(--muted)" }} data-i18n="subtotal">Sous-totale</span>
                  <span>{displayPrice}</span>
                </div>
                <div className="summary-row">
                  <span className="total" data-i18n="total">Totale</span>
                  <span className="total">{displayPrice}</span>
                </div>
              </div>

              <div className="panel" style={{ padding: 0 }}>
                <h2 className="section-title" data-i18n="contact_title">Coordonnées</h2>
                <p className="section-subtitle" data-i18n="contact_subtitle">Nous utiliserons ces informations pour confirmer votre commande.</p>

                <div className="form">
                  <div>
                    <label htmlFor="email" data-i18n="email_label">E-mail</label>
                    <input
                      id="email"
                      className="field"
                      type="email"
                      placeholder="E-mail"
                      data-i18n-placeholder="email_placeholder"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div className="checkbox">
                    <input id="updates" type="checkbox" defaultChecked />
                    <label htmlFor="updates" style={{ margin: 0, color: "var(--text)", fontSize: 13 }} data-i18n="marketing_opt_in">
                      M'envoyer des offres et des actualités par e-mail
                    </label>
                  </div>
                </div>
              </div>

              <div className="panel" style={{ borderTop: "1px solid var(--border-soft)", paddingLeft: 0, paddingRight: 0 }}>
                <h2 className="section-title" data-i18n="shipping_title">Adresse de livraison</h2>

                <div>
                  <label htmlFor="address" data-i18n="address_label">Adresse</label>
                  <input id="address" className="field" type="text" placeholder="Adresse" data-i18n-placeholder="address_placeholder" autoComplete="street-address" />
                </div>

                <div>
                  <label htmlFor="apt" data-i18n="apt_label">Appartement, suite, etc. (facultatif)</label>
                  <input id="apt" className="field" type="text" placeholder="Appartement, suite, etc. (facultatif)" data-i18n-placeholder="apt_placeholder" autoComplete="address-line2" />
                </div>

                <div className="row">
                  <div>
                    <label htmlFor="city" data-i18n="city_label">Ville</label>
                    <input id="city" className="field" type="text" placeholder="Ville" data-i18n-placeholder="city_placeholder" autoComplete="address-level2" />
                  </div>
                  <div>
                    <label htmlFor="postal" data-i18n="postal_label">Code postal</label>
                    <input id="postal" className="field" type="text" placeholder="Code postal" data-i18n-placeholder="postal_placeholder" autoComplete="postal-code" />
                  </div>
                </div>

                <div className="row">
                  <div>
                    <label htmlFor="country" data-i18n="country_label">Pays/Région</label>
                    <select id="country" className="field" autoComplete="country-name" defaultValue="FR">
                      <option value="FR" data-i18n="country_fr">France</option>
                      <option value="DE" data-i18n="country_de">Allemagne</option>
                    </select>
                  </div>
                </div>

                <div className="actions">
                  <a className="link" href="#" onClick={(e) => e.preventDefault()} data-i18n="return_to_cart">Retour au panier</a>
                </div>
              </div>
            </div>
          </section>

          <aside className="right">
            <div className="right-inner">
              <div className="if">
                {loading ? (
                  <div style={{ padding: 40, textAlign: "center", color: "#6d7175" }}>Loading...</div>
                ) : (
                  <form onSubmit={handleSubmit} style={{ padding: 20 }}>
                    <h3 style={{ margin: "0 0 20px 0", fontSize: 16, fontWeight: 600 }}>Payment Details</h3>

                    {error && (
                      <div style={{
                        background: "#fef2f2",
                        border: "1px solid #fecaca",
                        borderRadius: 8,
                        padding: 12,
                        marginBottom: 16,
                        color: "#991b1b",
                        fontSize: 14,
                      }}>
                        {error}
                      </div>
                    )}

                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 500 }}>
                        Card Number
                      </label>
                      <input
                        type="text"
                        className="field"
                        placeholder="1234 5678 9012 3456"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                        maxLength={19}
                        autoComplete="cc-number"
                        style={{ fontFamily: "monospace", letterSpacing: 1 }}
                      />
                    </div>

                    <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 500 }}>
                          Expiry Date
                        </label>
                        <input
                          type="text"
                          className="field"
                          placeholder="MM / YY"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                          maxLength={7}
                          autoComplete="cc-exp"
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 500 }}>
                          CVV
                        </label>
                        <input
                          type="text"
                          className="field"
                          placeholder="123"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                          maxLength={4}
                          autoComplete="cc-csc"
                        />
                      </div>
                    </div>

                    <div style={{ marginBottom: 20 }}>
                      <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 500 }}>
                        Cardholder Name
                      </label>
                      <input
                        type="text"
                        className="field"
                        placeholder="John Doe"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        autoComplete="cc-name"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={processing}
                      style={{
                        width: "100%",
                        padding: "14px 20px",
                        backgroundColor: processing ? "#9ca3af" : "#1a1a1a",
                        color: "#fff",
                        border: "none",
                        borderRadius: 8,
                        fontSize: 16,
                        fontWeight: 600,
                        cursor: processing ? "not-allowed" : "pointer",
                        transition: "background-color 0.2s",
                      }}
                    >
                      {processing ? "Processing..." : `Pay ${displayPrice}`}
                    </button>

                    <p style={{ marginTop: 16, fontSize: 12, color: "#6d7175", textAlign: "center" }}>
                      Your payment is secured with SSL encryption
                    </p>
                  </form>
                )}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
