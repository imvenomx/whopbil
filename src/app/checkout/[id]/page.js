"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

// Internationalization strings
const I18N = {
  en: {
    contact: "Contact",
    contact_subtitle: "We'll use this to send your order confirmation.",
    email_placeholder: "Email",
    marketing_opt_in: "Email me with news and offers",
    delivery: "Delivery",
    country_placeholder: "Country/Region",
    first_name_placeholder: "First name",
    last_name_placeholder: "Last name",
    address_placeholder: "Address",
    apt_placeholder: "Apartment, suite, etc. (optional)",
    city_placeholder: "City",
    province_placeholder: "Province",
    postal_placeholder: "Postal code",
    payment: "Payment",
    payment_subtitle: "All transactions are secure and encrypted.",
    credit_card: "Credit card",
    card_number_placeholder: "Card number",
    expiry_placeholder: "Expiration date (MM / YY)",
    cvv_placeholder: "Security code",
    name_on_card_placeholder: "Name on card",
    billing_same: "Use shipping address as billing address",
    pay_now: "Pay now",
    order_summary: "Order summary",
    discount_placeholder: "Discount code",
    apply: "Apply",
    subtotal: "Subtotal",
    shipping: "Shipping",
    shipping_placeholder: "Enter shipping address",
    total: "Total",
    free: "Free",
    processing: "Processing...",
    secure_payment: "Your payment is secured with SSL encryption",
  },
  it: {
    contact: "Contatti",
    contact_subtitle: "Useremo queste informazioni per inviarti la conferma dell'ordine.",
    email_placeholder: "E-mail",
    marketing_opt_in: "Inviami novità e offerte via email",
    delivery: "Consegna",
    country_placeholder: "Paese/Regione",
    first_name_placeholder: "Nome",
    last_name_placeholder: "Cognome",
    address_placeholder: "Indirizzo",
    apt_placeholder: "Appartamento, suite, ecc. (facoltativo)",
    city_placeholder: "Città",
    province_placeholder: "Provincia",
    postal_placeholder: "CAP",
    payment: "Pagamento",
    payment_subtitle: "Tutte le transazioni sono sicure e crittografate.",
    credit_card: "Carta di credito",
    card_number_placeholder: "Numero carta",
    expiry_placeholder: "Data di scadenza (MM / AA)",
    cvv_placeholder: "Codice di sicurezza",
    name_on_card_placeholder: "Nome sulla carta",
    billing_same: "Usa l'indirizzo di spedizione come indirizzo di fatturazione",
    pay_now: "Paga ora",
    order_summary: "Riepilogo ordine",
    discount_placeholder: "Codice sconto",
    apply: "Applica",
    subtotal: "Subtotale",
    shipping: "Spedizione",
    shipping_placeholder: "Inserisci l'indirizzo di spedizione",
    total: "Totale",
    free: "Gratis",
    processing: "Elaborazione...",
    secure_payment: "Il tuo pagamento è protetto con crittografia SSL",
  },
  fr: {
    contact: "Coordonnées",
    contact_subtitle: "Nous utiliserons ces informations pour vous envoyer la confirmation de commande.",
    email_placeholder: "E-mail",
    marketing_opt_in: "M'envoyer des offres et des actualités par e-mail",
    delivery: "Livraison",
    country_placeholder: "Pays/Région",
    first_name_placeholder: "Prénom",
    last_name_placeholder: "Nom",
    address_placeholder: "Adresse",
    apt_placeholder: "Appartement, suite, etc. (facultatif)",
    city_placeholder: "Ville",
    province_placeholder: "Province",
    postal_placeholder: "Code postal",
    payment: "Paiement",
    payment_subtitle: "Toutes les transactions sont sécurisées et cryptées.",
    credit_card: "Carte de crédit",
    card_number_placeholder: "Numéro de carte",
    expiry_placeholder: "Date d'expiration (MM / AA)",
    cvv_placeholder: "Code de sécurité",
    name_on_card_placeholder: "Nom sur la carte",
    billing_same: "Utiliser l'adresse de livraison comme adresse de facturation",
    pay_now: "Payer maintenant",
    order_summary: "Récapitulatif",
    discount_placeholder: "Code de réduction",
    apply: "Appliquer",
    subtotal: "Sous-total",
    shipping: "Livraison",
    shipping_placeholder: "Entrez l'adresse de livraison",
    total: "Total",
    free: "Gratuit",
    processing: "Traitement...",
    secure_payment: "Votre paiement est sécurisé par cryptage SSL",
  },
  de: {
    contact: "Kontakt",
    contact_subtitle: "Wir verwenden diese Informationen, um Ihnen die Bestellbestätigung zu senden.",
    email_placeholder: "E-Mail",
    marketing_opt_in: "E-Mails mit Neuigkeiten und Angeboten erhalten",
    delivery: "Lieferung",
    country_placeholder: "Land/Region",
    first_name_placeholder: "Vorname",
    last_name_placeholder: "Nachname",
    address_placeholder: "Adresse",
    apt_placeholder: "Wohnung, Suite usw. (optional)",
    city_placeholder: "Stadt",
    province_placeholder: "Bundesland",
    postal_placeholder: "Postleitzahl",
    payment: "Zahlung",
    payment_subtitle: "Alle Transaktionen sind sicher und verschlüsselt.",
    credit_card: "Kreditkarte",
    card_number_placeholder: "Kartennummer",
    expiry_placeholder: "Ablaufdatum (MM / JJ)",
    cvv_placeholder: "Sicherheitscode",
    name_on_card_placeholder: "Name auf der Karte",
    billing_same: "Lieferadresse als Rechnungsadresse verwenden",
    pay_now: "Jetzt bezahlen",
    order_summary: "Bestellübersicht",
    discount_placeholder: "Rabattcode",
    apply: "Anwenden",
    subtotal: "Zwischensumme",
    shipping: "Versand",
    shipping_placeholder: "Lieferadresse eingeben",
    total: "Gesamt",
    free: "Kostenlos",
    processing: "Verarbeitung...",
    secure_payment: "Ihre Zahlung ist durch SSL-Verschlüsselung geschützt",
  },
};

const COUNTRY_TO_LANG = { FR: "fr", DE: "de", IT: "it", ES: "es", NL: "nl" };

function normalizeLang(lang) {
  if (!lang) return "en";
  const base = String(lang).toLowerCase().split("-")[0];
  return I18N[base] ? base : "en";
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

function formatExpiry(value) {
  const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
  if (v.length >= 2) {
    return v.substring(0, 2) + (v.length > 2 ? " / " + v.substring(2, 4) : "");
  }
  return v;
}

// Card icons as inline SVGs for reliability
const CardIcons = {
  visa: (
    <svg viewBox="0 0 38 24" width="38" height="24" aria-label="Visa">
      <rect width="38" height="24" rx="3" fill="#1434CB"/>
      <path d="M15.56 8.14l-2.37 7.72h-1.9l-1.17-6.16c-.07-.28-.13-.38-.35-.5-.35-.2-.93-.38-1.44-.5l.03-.56h3.06c.39 0 .74.26.83.71l.76 4.03 1.87-4.74h1.88zm7.37 5.2c.01-2.04-2.82-2.15-2.8-3.06.01-.28.27-.57.85-.65.29-.04 1.08-.07 1.98.35l.35-1.64a5.4 5.4 0 00-1.88-.35c-1.98 0-3.37 1.05-3.38 2.56-.01 1.11 1 1.73 1.76 2.1.78.38 1.04.63 1.04 .97-.01.52-.62.75-1.2.76-.99.02-1.57-.27-2.03-.48l-.36 1.68c.46.21 1.32.4 2.2.41 2.1 0 3.48-1.04 3.49-2.65h-.02zm5.22 2.52h1.66l-1.45-7.72h-1.53c-.35 0-.64.2-.77.51l-2.72 7.21h1.9l.38-1.04h2.32l.21 1.04zm-2.02-2.48l.95-2.63.55 2.63h-1.5zm-7.6-5.24l-1.5 7.72h-1.8l1.5-7.72h1.8z" fill="#fff"/>
    </svg>
  ),
  mastercard: (
    <svg viewBox="0 0 38 24" width="38" height="24" aria-label="Mastercard">
      <rect width="38" height="24" rx="3" fill="#000"/>
      <circle cx="15" cy="12" r="7" fill="#EB001B"/>
      <circle cx="23" cy="12" r="7" fill="#F79E1B"/>
      <path d="M19 6.5a7 7 0 000 11 7 7 0 000-11z" fill="#FF5F00"/>
    </svg>
  ),
  amex: (
    <svg viewBox="0 0 38 24" width="38" height="24" aria-label="American Express">
      <rect width="38" height="24" rx="3" fill="#006FCF"/>
      <path d="M10 12h18M10 9h18M10 15h18" stroke="#fff" strokeWidth="1.5"/>
      <text x="19" y="14" textAnchor="middle" fill="#fff" fontSize="6" fontWeight="bold">AMEX</text>
    </svg>
  ),
};

// Lock icon for card number field
const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0110 0v4"/>
  </svg>
);

// Checkmark icon for success
const CheckIcon = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

// Shopping cart icon for summary toggle (mobile)
const CartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1"/>
    <circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
  </svg>
);

// Chevron icon
const ChevronIcon = ({ down }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: down ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
    <polyline points="18 15 12 9 6 15"/>
  </svg>
);

export default function CheckoutPage() {
  const params = useParams();
  const pageId = params.id;

  // Page state
  const [pageConfig, setPageConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // 3DS state
  const [show3DS, setShow3DS] = useState(false);
  const [threeDSUrl, setThreeDSUrl] = useState(null);
  const [pendingCheckout, setPendingCheckout] = useState(null);
  const [pollStatus, setPollStatus] = useState(null);

  // Language
  const [lang, setLang] = useState("en");
  const t = I18N[lang] || I18N.en;

  // Mobile summary toggle
  const [summaryOpen, setSummaryOpen] = useState(false);

  // Form fields - Contact
  const [email, setEmail] = useState("");
  const [marketingOptIn, setMarketingOptIn] = useState(true);

  // Form fields - Delivery
  const [country, setCountry] = useState("IT");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [address, setAddress] = useState("");
  const [apartment, setApartment] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [postalCode, setPostalCode] = useState("");

  // Form fields - Payment
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [useSameAddress, setUseSameAddress] = useState(true);

  // Discount code
  const [discountCode, setDiscountCode] = useState("");

  // Computed values
  const displayPrice = pageConfig ? `€${pageConfig.price}` : "...";
  const hasShippingAddress = address.trim() !== "";

  // Load language
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ipLang = await detectLangByIP();
      const browserLang = normalizeLang(navigator.language);
      if (!cancelled) {
        const finalLang = ipLang || browserLang || "en";
        setLang(finalLang);
        document.documentElement.lang = finalLang;
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

  // Check payment status after 3DS
  const checkPaymentStatus = async (checkout) => {
    const checkoutData = checkout || pendingCheckout;
    if (!checkoutData) return { done: false };

    try {
      const res = await fetch("/api/checkout/check-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checkoutId: checkoutData.checkoutId,
          customerId: checkoutData.customerId,
        }),
      });

      const data = await res.json();
      console.log("[3DS] Check status response:", data);
      const mandateInfo = data._debug?.mandate?.status || data.details?.mandate?.status || "unknown";
      const tokenInfo = data._debug?.payment_instrument?.token ? "yes" : "no";
      setPollStatus(`${data.status || "checking..."} | mandate: ${mandateInfo} | token: ${tokenInfo}`);

      if (data.pending) {
        console.log("[3DS] Status is pending, continuing to poll...");
        return { done: false, status: data.status || "pending" };
      }

      if (data.success) {
        const amount = parseFloat(pageConfig?.price?.replace(",", ".")) || 84.0;
        try {
          await fetch("/api/checkout/complete-tokenization", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              checkoutId: checkoutData.checkoutId,
              customerId: checkoutData.customerId,
              amount,
              interval: pageConfig?.interval || "monthly",
              intervalCount: pageConfig?.intervalCount || 1,
              checkoutPageId: pageId,
              email,
            }),
          });
        } catch (subErr) {
          console.error("[3DS] Subscription error:", subErr);
        }
        return { done: true, success: true };
      } else {
        console.log("[3DS] Payment failed with status:", data.status, "error:", data.error);
        console.log("[3DS] Full failure data:", JSON.stringify(data, null, 2));

        // Build detailed error message
        let errorDetails = [];
        errorDetails.push(`Status: ${data.status || "unknown"}`);
        if (data.error) errorDetails.push(`Error: ${data.error}`);
        if (data.details?.transaction_code) errorDetails.push(`Transaction: ${data.details.transaction_code}`);
        if (data.details?.payment_instrument?.token) errorDetails.push(`Token: ${data.details.payment_instrument.token.substring(0, 8)}...`);
        if (data.details?.mandate?.status) errorDetails.push(`Mandate: ${data.details.mandate.status}`);
        if (data.details?.transactions?.[0]?.status) errorDetails.push(`Txn Status: ${data.details.transactions[0].status}`);
        if (data.details?.transactions?.[0]?.entry_mode) errorDetails.push(`Entry Mode: ${data.details.transactions[0].entry_mode}`);

        const fullError = errorDetails.join("\n");
        return { done: true, success: false, error: fullError };
      }
    } catch (err) {
      console.error("[3DS] Check status error:", err);
      return { done: false, error: err.message };
    }
  };

  // Listen for 3DS completion message from iframe
  useEffect(() => {
    const handleMessage = async (event) => {
      if (event.data?.type === '3DS_COMPLETE' && pendingCheckout) {
        console.log("[3DS] Received completion message:", event.data);
        setPollStatus("3DS complete, checking...");

        // Immediately check status
        const result = await checkPaymentStatus(pendingCheckout);
        console.log("[3DS] Status after completion:", result);

        if (result.done) {
          setShow3DS(false);
          setProcessing(false);
          if (result.success) {
            setPaymentSuccess(true);
          } else {
            setError(result.error || "Payment failed after 3DS");
          }
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [pendingCheckout]);

  // 3DS polling (backup)
  useEffect(() => {
    if (show3DS && threeDSUrl && pendingCheckout) {
      let attempts = 0;
      const maxAttempts = 90;
      let pollInterval;
      let stopped = false;

      const poll = async () => {
        if (stopped) return;

        const result = await checkPaymentStatus(pendingCheckout);

        if (result.done) {
          clearInterval(pollInterval);
          stopped = true;
          setShow3DS(false);
          setProcessing(false);

          if (result.success) {
            setPaymentSuccess(true);
          } else {
            setError(result.error || "Payment failed after 3DS");
          }
          return;
        }

        attempts++;

        if (attempts >= maxAttempts) {
          clearInterval(pollInterval);
          stopped = true;
          setShow3DS(false);
          setError("3DS verification timed out. Please try again.");
          setProcessing(false);
        }
      };

      // Wait 4 seconds before first poll to give 3DS time to load
      setTimeout(() => {
        if (!stopped) {
          poll();
          pollInterval = setInterval(poll, 3000); // Poll every 3 seconds
        }
      }, 4000);

      return () => {
        stopped = true;
        clearInterval(pollInterval);
      };
    }
  }, [show3DS, threeDSUrl, pendingCheckout?.checkoutId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
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
      setError("Please enter a valid security code");
      return;
    }
    if (!cardName.trim()) {
      setError("Please enter the name on card");
      return;
    }

    setProcessing(true);

    try {
      const amount = parseFloat(pageConfig.price.replace(",", ".")) || 84.0;

      let expiryMonth, expiryYear;
      if (cardExpiry.includes("/")) {
        [expiryMonth, expiryYear] = cardExpiry.split("/").map(s => s.trim());
      } else {
        expiryMonth = cardExpiry.substring(0, 2);
        expiryYear = cardExpiry.substring(2, 4);
      }

      const requestBody = {
        email: email.trim(),
        name: cardName.trim(),
        amount,
        currency: "EUR",
        description: pageConfig.productName || "Subscription payment",
        card: {
          number: cardNumber.replace(/\s/g, ""),
          expiry_month: expiryMonth,
          expiry_year: expiryYear,
          cvv: cardCvv.trim(),
          name: cardName.trim(),
        },
      };

      const res = await fetch("/api/checkout/process-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const responseText = await res.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseErr) {
        setError(`Server error: ${responseText.substring(0, 500)}`);
        return;
      }

      // Check if 3DS is required
      if (data.requires3DS && data.nextStep) {
        setPendingCheckout({
          checkoutId: data.checkoutId,
          customerId: data.customerId,
        });
        setThreeDSUrl(data.nextStep.url);
        setShow3DS(true);
        setProcessing(false);
        return;
      }

      if (!res.ok || !data.success) {
        setError(data.error || "Payment failed");
        return;
      }

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
            interval: pageConfig.interval || "monthly",
            intervalCount: pageConfig.intervalCount || 1,
            checkoutPageId: pageId,
            email,
            metadata: {
              productName: pageConfig.productName,
            },
          }),
        });
      } catch (subErr) {}
    } catch (err) {
      setError(`Error: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  // Not Found page
  if (notFound) {
    return (
      <main className="not-found-page">
        <h1 className="not-found-title">Checkout Not Found</h1>
        <p className="not-found-message">The checkout page you're looking for doesn't exist.</p>
      </main>
    );
  }

  // 3DS iframe
  if (show3DS && threeDSUrl) {
    return (
      <main className="threeds-container">
        <div className="threeds-header">
          <h2 className="threeds-title">Complete 3D Secure Verification</h2>
          <p className="threeds-subtitle">Please complete the verification below. The page will update automatically when done.</p>
        </div>
        <div className="threeds-iframe-wrapper">
          <iframe
            src={threeDSUrl}
            className="threeds-iframe"
            title="3D Secure Verification"
          />
        </div>
        <p className="threeds-status">
          Checking payment status... {pollStatus && `(Status: ${pollStatus})`}
        </p>
        <button
          onClick={async () => {
            try {
              const res = await fetch("/api/checkout/check-status", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  checkoutId: pendingCheckout.checkoutId,
                  customerId: pendingCheckout.customerId,
                }),
              });
              const data = await res.json();
              alert(`Full response:\n${JSON.stringify(data, null, 2)}`);
            } catch (err) {
              alert(`Error: ${err.message}`);
            }
          }}
          className="btn btn-secondary"
          style={{ width: "100%", marginBottom: "10px" }}
        >
          Check Status Now
        </button>
        <button
          onClick={() => { setShow3DS(false); setError("3DS verification cancelled"); }}
          className="btn btn-secondary"
          style={{ width: "100%" }}
        >
          Cancel
        </button>
      </main>
    );
  }

  // Success page
  if (paymentSuccess) {
    return (
      <main className="success-page">
        <div className="success-icon">
          <CheckIcon />
        </div>
        <h1 className="success-title">Payment Successful!</h1>
        <p className="success-message">
          Thank you for your subscription. Your card has been saved for future billing.
          You will receive a confirmation email at <strong>{email}</strong>
        </p>
      </main>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="loading-container">
        Loading checkout...
      </div>
    );
  }

  // Main checkout page
  return (
    <div className="checkout-container">
      {/* Left Column - Form */}
      <main className="checkout-main">
        <div className="checkout-main-inner">
          {/* Logo / Breadcrumbs */}
          <header className="checkout-header">
            <span className="checkout-logo">Checkout</span>
            <nav className="checkout-breadcrumbs">
              <a href="#">Cart</a>
              <span className="separator">&gt;</span>
              <span className="current">Information</span>
              <span className="separator">&gt;</span>
              <span>Shipping</span>
              <span className="separator">&gt;</span>
              <span>Payment</span>
            </nav>
          </header>

          <form onSubmit={handleSubmit}>
            {/* Error message */}
            {error && (
              <div className="error-message" style={{ whiteSpace: "pre-wrap", fontFamily: "monospace", fontSize: "12px" }}>
                {error}
              </div>
            )}

            {/* Contact Section */}
            <section className="checkout-section">
              <div className="section-header">
                <h2 className="section-title">{t.contact}</h2>
              </div>

              <div className="form-row">
                <input
                  type="email"
                  className="form-input"
                  placeholder={t.email_placeholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="form-row">
                <label className="form-checkbox">
                  <input
                    type="checkbox"
                    checked={marketingOptIn}
                    onChange={(e) => setMarketingOptIn(e.target.checked)}
                  />
                  <span className="form-checkbox-label">{t.marketing_opt_in}</span>
                </label>
              </div>
            </section>

            <div className="divider" />

            {/* Delivery Section */}
            <section className="checkout-section">
              <h2 className="section-title" style={{ marginBottom: 16 }}>{t.delivery}</h2>

              <div className="form-row">
                <select
                  className="form-select"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  autoComplete="country"
                >
                  <option value="IT">Italy</option>
                  <option value="FR">France</option>
                  <option value="DE">Germany</option>
                  <option value="ES">Spain</option>
                  <option value="NL">Netherlands</option>
                  <option value="AT">Austria</option>
                  <option value="BE">Belgium</option>
                  <option value="PT">Portugal</option>
                  <option value="CH">Switzerland</option>
                  <option value="GB">United Kingdom</option>
                </select>
              </div>

              <div className="form-row form-row-inline">
                <div className="form-group">
                  <input
                    type="text"
                    className="form-input"
                    placeholder={t.first_name_placeholder}
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    autoComplete="given-name"
                  />
                </div>
                <div className="form-group">
                  <input
                    type="text"
                    className="form-input"
                    placeholder={t.last_name_placeholder}
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    autoComplete="family-name"
                  />
                </div>
              </div>

              <div className="form-row">
                <input
                  type="text"
                  className="form-input"
                  placeholder={t.address_placeholder}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  autoComplete="street-address"
                />
              </div>

              <div className="form-row">
                <input
                  type="text"
                  className="form-input"
                  placeholder={t.apt_placeholder}
                  value={apartment}
                  onChange={(e) => setApartment(e.target.value)}
                  autoComplete="address-line2"
                />
              </div>

              <div className="form-row form-row-three">
                <div className="form-group">
                  <input
                    type="text"
                    className="form-input"
                    placeholder={t.city_placeholder}
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    autoComplete="address-level2"
                  />
                </div>
                <div className="form-group">
                  <input
                    type="text"
                    className="form-input"
                    placeholder={t.province_placeholder}
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    autoComplete="address-level1"
                  />
                </div>
                <div className="form-group">
                  <input
                    type="text"
                    className="form-input"
                    placeholder={t.postal_placeholder}
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    autoComplete="postal-code"
                  />
                </div>
              </div>
            </section>

            <div className="divider" />

            {/* Payment Section */}
            <section className="checkout-section">
              <h2 className="section-title">{t.payment}</h2>
              <p className="text-muted text-small" style={{ marginBottom: 16 }}>{t.payment_subtitle}</p>

              <div className="payment-methods">
                {/* Credit Card Method - Always selected */}
                <div className="payment-method selected">
                  <input
                    type="radio"
                    name="payment-method"
                    className="payment-method-radio"
                    checked
                    readOnly
                  />
                  <div className="payment-method-content">
                    <span className="payment-method-label">{t.credit_card}</span>
                    <div className="payment-method-icons">
                      {CardIcons.visa}
                      {CardIcons.mastercard}
                      {CardIcons.amex}
                    </div>
                  </div>
                </div>

                {/* Card Fields */}
                <div className="payment-card-fields">
                  <div className="form-row">
                    <div className="card-number-wrapper">
                      <input
                        type="text"
                        className="form-input"
                        placeholder={t.card_number_placeholder}
                        value={cardNumber}
                        onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                        maxLength={19}
                        autoComplete="cc-number"
                        style={{ fontVariantNumeric: "tabular-nums" }}
                      />
                      <div className="card-input-icon">
                        <LockIcon />
                      </div>
                    </div>
                  </div>

                  <div className="form-row form-row-inline">
                    <div className="form-group">
                      <input
                        type="text"
                        className="form-input"
                        placeholder={t.expiry_placeholder}
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                        maxLength={7}
                        autoComplete="cc-exp"
                      />
                    </div>
                    <div className="form-group">
                      <input
                        type="text"
                        className="form-input"
                        placeholder={t.cvv_placeholder}
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                        maxLength={4}
                        autoComplete="cc-csc"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <input
                      type="text"
                      className="form-input"
                      placeholder={t.name_on_card_placeholder}
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      autoComplete="cc-name"
                    />
                  </div>

                  <div className="form-row" style={{ marginTop: 4 }}>
                    <label className="form-checkbox">
                      <input
                        type="checkbox"
                        checked={useSameAddress}
                        onChange={(e) => setUseSameAddress(e.target.checked)}
                      />
                      <span className="form-checkbox-label">{t.billing_same}</span>
                    </label>
                  </div>
                </div>
              </div>
            </section>

            <div className="divider" />

            {/* Pay Button */}
            <button
              type="submit"
              className="btn btn-primary"
              disabled={processing}
            >
              {processing ? t.processing : t.pay_now}
            </button>

            <p className="secure-notice">
              <LockIcon />
              {t.secure_payment}
            </p>

            {/* Footer Links */}
            <footer className="checkout-footer">
              <div className="footer-links">
                <a href="#" className="footer-link">Terms & conditions</a>
                <a href="#" className="footer-link">Privacy policy</a>
                <a href="#" className="footer-link">Return/Shipping policy</a>
              </div>
            </footer>
          </form>
        </div>
      </main>

      {/* Right Column - Order Summary */}
      <aside className="checkout-sidebar">
        <div className="checkout-sidebar-inner">
          {/* Mobile toggle */}
          <div
            className="summary-toggle"
            onClick={() => setSummaryOpen(!summaryOpen)}
          >
            <div className="summary-toggle-left">
              <CartIcon />
              <span className="summary-toggle-text">
                {summaryOpen ? "Hide order summary" : "Show order summary"}
              </span>
              <ChevronIcon down={summaryOpen} />
            </div>
            <span className="summary-toggle-price">{displayPrice}</span>
          </div>

          <div className={`summary-content ${summaryOpen ? "" : "collapsed"}`}>
            {/* Product */}
            <div className="summary-product">
              <div className="product-thumbnail">
                <img
                  src={pageConfig?.productImage || "https://cdn-icons-png.flaticon.com/512/8832/8832119.png"}
                  alt={pageConfig?.productName || "Product"}
                />
                <span className="product-quantity-badge">1</span>
              </div>
              <div className="product-details">
                <p className="product-name">{pageConfig?.productName || "Product"}</p>
                <p className="product-variant">Monthly subscription</p>
              </div>
              <span className="product-price">{displayPrice}</span>
            </div>

            {/* Discount Code */}
            <div className="discount-row">
              <div className="discount-input">
                <input
                  type="text"
                  className="form-input"
                  placeholder={t.discount_placeholder}
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                />
              </div>
              <button
                type="button"
                className="discount-button"
                disabled={!discountCode.trim()}
              >
                {t.apply}
              </button>
            </div>

            {/* Totals */}
            <div className="summary-totals">
              <div className="summary-line">
                <span className="summary-line-label">{t.subtotal}</span>
                <span className="summary-line-value">{displayPrice}</span>
              </div>
              <div className="summary-line">
                <span className="summary-line-label">{t.shipping}</span>
                {hasShippingAddress ? (
                  <span className="summary-line-value">{t.free}</span>
                ) : (
                  <span className="summary-line-placeholder">{t.shipping_placeholder}</span>
                )}
              </div>
            </div>

            <div className="summary-total">
              <span className="summary-total-label">{t.total}</span>
              <div className="summary-total-value">
                <span className="summary-total-currency">EUR</span>
                <span className="summary-total-amount">{displayPrice}</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
