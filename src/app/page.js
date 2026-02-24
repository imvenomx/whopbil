"use client";

import { useEffect, useState, useRef } from "react";

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
    contact_subtitle:
      "Wir verwenden diese Informationen, um deine Bestellung zu bestätigen.",
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
  es: {
    store_name: "Cutekits",
    secure_checkout: "Pago seguro",
    summary_title: "Resumen del pedido",
    summary_items: "1 artículo",
    order_id: "Pedido: #594039",
    free_shipping: "Envío gratis",
    subtotal: "Subtotal",
    total: "Total",
    contact_title: "Contacto",
    contact_subtitle:
      "Usaremos esta información para confirmar tu pedido.",
    email_label: "Correo electrónico",
    email_placeholder: "Correo electrónico",
    marketing_opt_in: "Enviarme novedades y ofertas por correo",
    shipping_title: "Dirección de envío",
    address_label: "Dirección",
    address_placeholder: "Dirección",
    apt_label: "Apartamento, piso, etc. (opcional)",
    apt_placeholder: "Apartamento, piso, etc. (opcional)",
    city_label: "Ciudad",
    city_placeholder: "Ciudad",
    postal_label: "Código postal",
    postal_placeholder: "Código postal",
    country_label: "País/Región",
    country_fr: "Francia",
    country_de: "Alemania",
    return_to_cart: "Volver al carrito",
  },
  it: {
    store_name: "Cutekits",
    secure_checkout: "Pagamento sicuro",
    summary_title: "Riepilogo ordine",
    summary_items: "1 articolo",
    order_id: "Ordine: #594039",
    free_shipping: "Spedizione gratuita",
    subtotal: "Subtotale",
    total: "Totale",
    contact_title: "Contatto",
    contact_subtitle:
      "Useremo queste informazioni per confermare il tuo ordine.",
    email_label: "Email",
    email_placeholder: "Email",
    marketing_opt_in: "Inviami novità e offerte via email",
    shipping_title: "Indirizzo di spedizione",
    address_label: "Indirizzo",
    address_placeholder: "Indirizzo",
    apt_label: "Appartamento, interno, ecc. (facoltativo)",
    apt_placeholder: "Appartamento, interno, ecc. (facoltativo)",
    city_label: "Città",
    city_placeholder: "Città",
    postal_label: "CAP",
    postal_placeholder: "CAP",
    country_label: "Paese/Regione",
    country_fr: "Francia",
    country_de: "Germania",
    return_to_cart: "Torna al carrello",
  },
  nl: {
    store_name: "Cutekits",
    secure_checkout: "Veilig afrekenen",
    summary_title: "Besteloverzicht",
    summary_items: "1 artikel",
    order_id: "Bestelling: #594039",
    free_shipping: "Gratis verzending",
    subtotal: "Subtotaal",
    total: "Totaal",
    contact_title: "Contact",
    contact_subtitle:
      "We gebruiken deze gegevens om je bestelling te bevestigen.",
    email_label: "E-mail",
    email_placeholder: "E-mail",
    marketing_opt_in: "Stuur mij nieuws en aanbiedingen per e-mail",
    shipping_title: "Verzendadres",
    address_label: "Adres",
    address_placeholder: "Adres",
    apt_label: "Appartement, suite, etc. (optioneel)",
    apt_placeholder: "Appartement, suite, etc. (optioneel)",
    city_label: "Plaats",
    city_placeholder: "Plaats",
    postal_label: "Postcode",
    postal_placeholder: "Postcode",
    country_label: "Land/regio",
    country_fr: "Frankrijk",
    country_de: "Duitsland",
    return_to_cart: "Terug naar winkelwagen",
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

export default function Home() {
  const [config, setConfig] = useState({
    price: "84,00",
  });
  const [email, setEmail] = useState("");
  const [checkoutId, setCheckoutId] = useState(null);
  const [customerId, setCustomerId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cardLoading, setCardLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cardMounted, setCardMounted] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const cardInstanceRef = useRef(null);

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
        setError(null);

        const configRes = await fetch("/api/config", { cache: "no-store" });
        if (configRes.ok) {
          const configData = await configRes.json();
          if (cancelled) return;
          setConfig({
            price: configData?.price || "84,00",
          });
        }
      } catch (e) {
        if (!cancelled) {
          setError(e.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Create tokenization checkout when email is valid
  const createTokenizationCheckout = async () => {
    if (!email || !email.includes("@")) return;

    try {
      setCardLoading(true);
      setError(null);

      // Unmount existing card if any
      if (cardInstanceRef.current) {
        try {
          cardInstanceRef.current.unmount();
        } catch (e) {
          console.log("Failed to unmount previous card:", e);
        }
        cardInstanceRef.current = null;
        setCardMounted(false);
      }

      const amount = parseFloat(config.price.replace(",", ".")) || 84.0;

      // Create tokenization checkout (creates customer + checkout with mandate)
      const res = await fetch("/api/checkout/tokenize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name: "",
          amount,
          currency: "EUR",
          description: "Subscription payment",
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to create checkout");
      }

      const data = await res.json();
      setCheckoutId(data.checkoutId);
      setCustomerId(data.customerId);
    } catch (e) {
      setError(e.message);
    } finally {
      setCardLoading(false);
    }
  };

  // Mount SumUp Card when checkout ID is available
  useEffect(() => {
    if (!checkoutId || cardMounted) return;

    const mountCard = async () => {
      // Load SumUp Card SDK if not already loaded
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

      // Wait a bit for SDK to initialize
      await new Promise((resolve) => setTimeout(resolve, 100));

      if (window.SumUpCard) {
        try {
          const card = window.SumUpCard.mount({
            id: "sumup-card",
            checkoutId: checkoutId,
            onResponse: async function (type, body) {
              console.log("SumUp response:", type, body);
              if (type === "success") {
                // Complete tokenization - save card and create subscription
                try {
                  const amount = parseFloat(config.price.replace(",", ".")) || 84.0;
                  const completeRes = await fetch("/api/checkout/complete-tokenization", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      checkoutId,
                      customerId,
                      amount,
                      interval: "monthly",
                      intervalCount: 1,
                    }),
                  });

                  const completeData = await completeRes.json();
                  console.log("Tokenization complete:", completeData);
                } catch (e) {
                  console.error("Failed to complete tokenization:", e);
                }

                setPaymentSuccess(true);
                if (typeof window !== "undefined" && window.Swal) {
                  window.Swal.fire({
                    icon: "success",
                    title: "Payment successful!",
                    text: "Thank you for your purchase. Your subscription is now active.",
                  });
                }
              } else if (type === "error") {
                if (typeof window !== "undefined" && window.Swal) {
                  window.Swal.fire({
                    icon: "error",
                    title: "Payment failed",
                    text: body?.message || "Please try again.",
                  });
                }
              }
            },
          });
          cardInstanceRef.current = card;
          setCardMounted(true);
        } catch (e) {
          console.error("Failed to mount SumUp Card:", e);
          setError("Failed to load payment form");
        }
      }
    };

    mountCard();
  }, [checkoutId, cardMounted, customerId, config.price]);

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
                <div className="store-name" data-i18n="store_name">
                  Cutekits
                </div>
              </div>
            </div>
            <div className="header-right">
              <div className="header-right-inner">
                <div className="secure-badge" data-i18n="secure_checkout">
                  Secure checkout
                </div>
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
                    <div style={{ fontWeight: 650 }} data-i18n="summary_title">
                      Récapitulatif
                    </div>
                    <div
                      style={{
                        color: "var(--muted)",
                        fontSize: 13,
                        marginTop: 2,
                      }}
                      data-i18n="summary_items"
                    >
                      1 article
                    </div>
                  </div>
                  <span className="pill">EUR</span>
                </div>

                <div className="product">
                  <img
                    className="product-img"
                    src="https://cdn-icons-png.flaticon.com/512/8832/8832119.png"
                    alt="Produit"
                  />
                  <div style={{ minWidth: 0 }}>
                    <div className="product-title" data-i18n="order_id">
                      Order ID: #594039
                    </div>
                    <div className="product-variant" data-i18n="free_shipping">
                      Livraison Gratuit
                    </div>
                  </div>
                  <div style={{ marginLeft: "auto", fontWeight: 650 }}>
                    {displayPrice}
                  </div>
                </div>

                <div className="summary-row">
                  <span style={{ color: "var(--muted)" }} data-i18n="subtotal">
                    Sous-totale
                  </span>
                  <span>{displayPrice}</span>
                </div>
                <div className="summary-row">
                  <span className="total" data-i18n="total">
                    Totale
                  </span>
                  <span className="total">{displayPrice}</span>
                </div>
              </div>

              <div className="panel" style={{ padding: 0 }}>
                <h2 className="section-title" data-i18n="contact_title">
                  Coordonnées
                </h2>
                <p className="section-subtitle" data-i18n="contact_subtitle">
                  Nous utiliserons ces informations pour confirmer votre commande.
                </p>

                <div className="form">
                  <div>
                    <label htmlFor="email" data-i18n="email_label">
                      E-mail
                    </label>
                    <input
                      id="email"
                      className="field"
                      type="email"
                      placeholder="E-mail"
                      data-i18n-placeholder="email_placeholder"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={createTokenizationCheckout}
                    />
                  </div>

                  <div className="checkbox">
                    <input id="updates" type="checkbox" defaultChecked />
                    <label
                      htmlFor="updates"
                      style={{ margin: 0, color: "var(--text)", fontSize: 13 }}
                      data-i18n="marketing_opt_in"
                    >
                      M'envoyer des offres et des actualités par e-mail
                    </label>
                  </div>
                </div>
              </div>

              <div
                className="panel"
                style={{
                  borderTop: "1px solid var(--border-soft)",
                  paddingLeft: 0,
                  paddingRight: 0,
                }}
              >
                <h2 className="section-title" data-i18n="shipping_title">
                  Adresse de livraison
                </h2>

                <div>
                  <label htmlFor="address" data-i18n="address_label">
                    Adresse
                  </label>
                  <input
                    id="address"
                    className="field"
                    type="text"
                    placeholder="Adresse"
                    data-i18n-placeholder="address_placeholder"
                    autoComplete="street-address"
                  />
                </div>

                <div>
                  <label htmlFor="apt" data-i18n="apt_label">
                    Appartement, suite, etc. (facultatif)
                  </label>
                  <input
                    id="apt"
                    className="field"
                    type="text"
                    placeholder="Appartement, suite, etc. (facultatif)"
                    data-i18n-placeholder="apt_placeholder"
                    autoComplete="address-line2"
                  />
                </div>

                <div className="row">
                  <div>
                    <label htmlFor="city" data-i18n="city_label">
                      Ville
                    </label>
                    <input
                      id="city"
                      className="field"
                      type="text"
                      placeholder="Ville"
                      data-i18n-placeholder="city_placeholder"
                      autoComplete="address-level2"
                    />
                  </div>
                  <div>
                    <label htmlFor="postal" data-i18n="postal_label">
                      Code postal
                    </label>
                    <input
                      id="postal"
                      className="field"
                      type="text"
                      placeholder="Code postal"
                      data-i18n-placeholder="postal_placeholder"
                      autoComplete="postal-code"
                    />
                  </div>
                </div>

                <div className="row">
                  <div>
                    <label htmlFor="country" data-i18n="country_label">
                      Pays/Région
                    </label>
                    <select
                      id="country"
                      className="field"
                      autoComplete="country-name"
                      defaultValue="FR"
                    >
                      <option value="FR" data-i18n="country_fr">
                        France
                      </option>
                      <option value="DE" data-i18n="country_de">
                        Allemagne
                      </option>
                    </select>
                  </div>
                </div>

                <div className="actions">
                  <a
                    className="link"
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    data-i18n="return_to_cart"
                  >
                    Retour au panier
                  </a>
                </div>
              </div>
            </div>
          </section>

          <aside className="right">
            <div className="right-inner">
              <div className="if">
                {loading ? (
                  <div style={{ padding: 40, textAlign: "center", color: "#6d7175" }}>
                    Loading...
                  </div>
                ) : error ? (
                  <div style={{ padding: 40, textAlign: "center", color: "#b42318" }}>
                    {error}
                  </div>
                ) : !email || !email.includes("@") ? (
                  <div style={{ padding: 40, textAlign: "center", color: "#6d7175" }}>
                    Please enter your email to proceed with payment.
                  </div>
                ) : cardLoading ? (
                  <div style={{ padding: 40, textAlign: "center", color: "#6d7175" }}>
                    Loading payment form...
                  </div>
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
