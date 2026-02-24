"use client";

import { useEffect, useState, useRef } from "react";

const I18N = {
  en: {
    store_name: "Cutekits",
    secure_checkout: "Secure checkout",
    summary_title: "Subscription summary",
    summary_items: "Recurring payment",
    order_id: "Order ID: #594039",
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
    order_id: "Commande : #594039",
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
    order_id: "Bestellnr.: #594039",
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
  es: {
    store_name: "Cutekits",
    secure_checkout: "Pago seguro",
    summary_title: "Resumen de suscripción",
    summary_items: "Pago recurrente",
    order_id: "Pedido: #594039",
    free_shipping: "Envío gratis",
    subtotal: "Subtotal",
    total: "Total",
    per_interval: "por",
    contact_title: "Contacto",
    contact_subtitle: "Usaremos esta información para gestionar tu suscripción.",
    email_label: "Correo electrónico",
    email_placeholder: "Correo electrónico",
    email_required: "El correo electrónico es necesario para la suscripción",
    name_label: "Nombre",
    name_placeholder: "Tu nombre",
    subscription_title: "Suscripción",
    interval_label: "Intervalo de facturación",
    interval_daily: "Diario",
    interval_weekly: "Semanal",
    interval_monthly: "Mensual",
    interval_yearly: "Anual",
    start_subscription: "Iniciar suscripción",
    processing: "Procesando...",
    subscription_success: "¡Suscripción activada!",
    subscription_success_text: "Tu tarjeta ha sido guardada y se te cobrará automáticamente.",
    payment_failed: "Pago fallido",
    return_to_cart: "Volver al carrito",
  },
  it: {
    store_name: "Cutekits",
    secure_checkout: "Pagamento sicuro",
    summary_title: "Riepilogo abbonamento",
    summary_items: "Pagamento ricorrente",
    order_id: "Ordine: #594039",
    free_shipping: "Spedizione gratuita",
    subtotal: "Subtotale",
    total: "Totale",
    per_interval: "al",
    contact_title: "Contatto",
    contact_subtitle: "Useremo queste informazioni per gestire il tuo abbonamento.",
    email_label: "Email",
    email_placeholder: "Email",
    email_required: "L'email è necessaria per l'abbonamento",
    name_label: "Nome",
    name_placeholder: "Il tuo nome",
    subscription_title: "Abbonamento",
    interval_label: "Intervallo di fatturazione",
    interval_daily: "Giornaliero",
    interval_weekly: "Settimanale",
    interval_monthly: "Mensile",
    interval_yearly: "Annuale",
    start_subscription: "Avvia abbonamento",
    processing: "Elaborazione...",
    subscription_success: "Abbonamento attivato!",
    subscription_success_text: "La tua carta è stata salvata e verrai addebitato automaticamente.",
    payment_failed: "Pagamento fallito",
    return_to_cart: "Torna al carrello",
  },
  nl: {
    store_name: "Cutekits",
    secure_checkout: "Veilig afrekenen",
    summary_title: "Abonnementsoverzicht",
    summary_items: "Terugkerende betaling",
    order_id: "Bestelling: #594039",
    free_shipping: "Gratis verzending",
    subtotal: "Subtotaal",
    total: "Totaal",
    per_interval: "per",
    contact_title: "Contact",
    contact_subtitle: "We gebruiken deze gegevens om je abonnement te beheren.",
    email_label: "E-mail",
    email_placeholder: "E-mail",
    email_required: "E-mail is vereist voor abonnement",
    name_label: "Naam",
    name_placeholder: "Je naam",
    subscription_title: "Abonnement",
    interval_label: "Factureringsinterval",
    interval_daily: "Dagelijks",
    interval_weekly: "Wekelijks",
    interval_monthly: "Maandelijks",
    interval_yearly: "Jaarlijks",
    start_subscription: "Start abonnement",
    processing: "Verwerken...",
    subscription_success: "Abonnement geactiveerd!",
    subscription_success_text: "Je kaart is opgeslagen en je wordt automatisch gefactureerd.",
    payment_failed: "Betaling mislukt",
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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

  const displayPrice = `${config.price} €`;
  const dict = I18N[lang] || I18N.en;

  useEffect(() => {
    let cancelled = false;

    (async function initI18n() {
      const ipLang = await detectLangByIP();
      const browserLang = normalizeLang(navigator.language || navigator.userLanguage);
      const detectedLang = ipLang || browserLang || "en";
      if (cancelled) return;
      setLang(detectedLang);
      translatePage(detectedLang);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Load config
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

  // Handle starting subscription
  const handleStartSubscription = async () => {
    if (!email || !email.includes("@")) {
      setEmailError(dict.email_required);
      return;
    }
    setEmailError("");
    setProcessing(true);

    try {
      const amount = parseFloat(config.price.replace(",", ".")) || 84.00;

      const tokenizeRes = await fetch("/api/checkout/tokenize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name,
          amount,
          currency: "EUR",
          description: "Subscription",
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
                try {
                  const amount = parseFloat(config.price.replace(",", ".")) || 84.00;

                  const completeRes = await fetch("/api/checkout/complete-tokenization", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      checkoutId,
                      customerId,
                      amount,
                      interval: "monthly",
                      intervalCount: 1,
                      checkoutPageId: null,
                      metadata: {
                        productName: "Subscription",
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
          console.error("Failed to mount SumUp Card:", e);
          setError("Failed to load payment form");
        }
      }
    };

    mountCard();
  }, [checkoutId, showPayment, cardMounted, customerId, config, email, name, dict]);

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
                      Subscription summary
                    </div>
                    <div
                      style={{
                        color: "var(--muted)",
                        fontSize: 13,
                        marginTop: 2,
                      }}
                      data-i18n="summary_items"
                    >
                      Recurring payment
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
                    <div className="product-variant">
                      {displayPrice} / month
                    </div>
                  </div>
                  <div style={{ marginLeft: "auto", fontWeight: 650 }}>
                    {displayPrice}
                  </div>
                </div>

                <div className="summary-row">
                  <span style={{ color: "var(--muted)" }} data-i18n="subtotal">
                    Subtotal
                  </span>
                  <span>{displayPrice}</span>
                </div>
                <div className="summary-row">
                  <span className="total" data-i18n="total">
                    Total
                  </span>
                  <span className="total">{displayPrice} / month</span>
                </div>
              </div>

              <div className="panel" style={{ padding: 0 }}>
                <h2 className="section-title" data-i18n="contact_title">
                  Contact
                </h2>
                <p className="section-subtitle" data-i18n="contact_subtitle">
                  We'll use this to manage your subscription.
                </p>

                <div className="form">
                  <div>
                    <label htmlFor="email" data-i18n="email_label">
                      Email
                    </label>
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
                    <label htmlFor="name" data-i18n="name_label">
                      Name
                    </label>
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
                <div
                  className="panel"
                  style={{
                    borderTop: "1px solid var(--border-soft)",
                    paddingLeft: 0,
                    paddingRight: 0,
                  }}
                >
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
                  <a
                    className="link"
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    data-i18n="return_to_cart"
                  >
                    Return to cart
                  </a>
                </div>
              )}
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
