"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { WhopCheckoutEmbed, useCheckoutEmbedControls } from "@whop/checkout/react";

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

// Phone country codes
const PHONE_COUNTRIES = [
  { code: "GB", dial: "+44", flag: "\u{1F1EC}\u{1F1E7}" },
  { code: "DE", dial: "+49", flag: "\u{1F1E9}\u{1F1EA}" },
];

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

// Truck icon for delivery trust badge
const TruckIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1773b0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13"/>
    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
    <circle cx="5.5" cy="18.5" r="2.5"/>
    <circle cx="18.5" cy="18.5" r="2.5"/>
  </svg>
);

// Shield icon for guarantee trust badge
const ShieldIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1773b0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <polyline points="9 12 11 14 15 10" stroke="#1773b0" strokeWidth="2"/>
  </svg>
);

// Star icon for reviews
const StarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="#facc15" stroke="#facc15" strokeWidth="1">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

// Review data
const REVIEWS = [
  {
    title: "Absolutely love it!",
    body: "The quality exceeded my expectations. Delivery was fast and packaging was great. Highly recommend to anyone considering this.",
    name: "Sarah M.",
    avatar: "https://i.pravatar.cc/80?img=1",
    time: "2 days ago",
  },
  {
    title: "Best purchase this year",
    body: "I've been looking for something like this for months. It works perfectly and the customer support was incredibly helpful.",
    name: "James T.",
    avatar: "https://i.pravatar.cc/80?img=3",
    time: "2 days ago",
  },
  {
    title: "Worth every penny",
    body: "Fast shipping, great product, and easy to use. Already recommended it to all my friends. Will definitely buy again!",
    name: "Emily R.",
    avatar: "https://i.pravatar.cc/80?img=5",
    time: "2 days ago",
  },
];

// Floating label input component
const FloatingInput = ({ label, value, onChange, type = "text", autoComplete, required, error }) => (
  <>
    <div className="float-label">
      <input
        type={type}
        className={`form-input${error ? " input-error" : ""}`}
        placeholder=" "
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        required={required}
      />
      <label className="float-label-text">{label}</label>
    </div>
    {error && <span className="field-error">{error}</span>}
  </>
);

// Chevron icon
const ChevronIcon = ({ down }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: down ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
    <polyline points="18 15 12 9 6 15"/>
  </svg>
);

export default function CheckoutPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const pageId = params.id;
  const checkoutRef = useCheckoutEmbedControls();

  // Page state
  const [pageConfig, setPageConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [checkoutState, setCheckoutState] = useState("loading"); // "loading" | "ready" | "disabled"

  // Check for return status from Whop redirect
  useEffect(() => {
    const status = searchParams.get("status");
    if (status === "success") {
      setPaymentSuccess(true);
    } else if (status === "error") {
      setError("Payment failed. Please try again.");
    }
  }, [searchParams]);

  // Language
  const [lang, setLang] = useState("en");
  const t = I18N[lang] || I18N.en;

  // Mobile summary toggle
  const [summaryOpen, setSummaryOpen] = useState(false);

  // Form fields - Contact
  const [email, setEmail] = useState("");
  const [phoneCountry, setPhoneCountry] = useState("GB");
  const [phone, setPhone] = useState("");
  const [phoneDropdownOpen, setPhoneDropdownOpen] = useState(false);
  const phoneRef = useRef(null);
  const [marketingOptIn, setMarketingOptIn] = useState(true);

  // Countdown timer (10 minutes)
  const [timeLeft, setTimeLeft] = useState(10 * 60);
  useEffect(() => {
    if (timeLeft <= 0) return;
    const id = setInterval(() => setTimeLeft(t => t > 0 ? t - 1 : 0), 1000);
    return () => clearInterval(id);
  }, [timeLeft > 0]);

  // Close phone dropdown on click outside
  useEffect(() => {
    if (!phoneDropdownOpen) return;
    const handleClick = (e) => {
      if (phoneRef.current && !phoneRef.current.contains(e.target)) {
        setPhoneDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [phoneDropdownOpen]);

  // Form fields - Delivery
  const [country, setCountry] = useState("IT");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [address, setAddress] = useState("");
  const [apartment, setApartment] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [postalCode, setPostalCode] = useState("");

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

  // Handle payment complete
  const handleComplete = (planId, receiptId) => {
    console.log("[Whop] Payment complete:", { planId, receiptId });
    setPaymentSuccess(true);
  };

  // Handle Complete Order - programmatic submit per Whop docs
  const handleSubmitOrder = async () => {
    if (!checkoutRef.current || checkoutState !== "ready") return;
    try {
      if (email) await checkoutRef.current.setEmail(email);
    } catch (e) {
      console.warn("[Whop] setEmail:", e.message);
    }
    try {
      await checkoutRef.current.setAddress({
        name: `${firstName} ${lastName}`.trim() || undefined,
        line1: address || undefined,
        line2: apartment || undefined,
        city: city || undefined,
        state: province || undefined,
        postalCode: postalCode || undefined,
        country: country || undefined,
      });
    } catch (e) {
      console.warn("[Whop] setAddress:", e.message);
    }
    checkoutRef.current.submit();
  };

  // Get return URL for redirects (needed for 3DS and external payment providers)
  const getReturnUrl = () => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/checkout/${pageId}?status=success`;
    }
    return `/checkout/${pageId}?status=success`;
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

  // Check if Whop Plan ID is configured
  if (!pageConfig?.whopPlanId) {
    return (
      <main className="not-found-page">
        <h1 className="not-found-title">Checkout Not Configured</h1>
        <p className="not-found-message">
          This checkout page needs a Whop Plan ID to be configured.
        </p>
      </main>
    );
  }

  // Main checkout page
  return (
    <div className="checkout-container">
      {/* Mobile-only Checkout title above gray summary */}
      <div className="mobile-checkout-title mobile-only">
        <span className="checkout-logo">Checkout</span>
      </div>

      {/* Left Column - Form */}
      <main className="checkout-main">
        <div className="checkout-main-inner">
          {/* Logo / Breadcrumbs */}
          <header className="checkout-header">
            <span className="checkout-logo">Checkout</span>
          </header>

          {/* Countdown alert */}
          <div className="countdown-alert">
            <svg className="countdown-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            <span className="countdown-text">
              {String(Math.floor(timeLeft / 60)).padStart(2, "0")}:{String(timeLeft % 60).padStart(2, "0")} until your order expires
            </span>
          </div>

          <div>
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
                <FloatingInput
                  label={t.email_placeholder}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required

                />
              </div>

              <div className="form-row">
                <div className="phone-input-wrapper" ref={phoneRef}>
                  <button
                    type="button"
                    className="phone-country-select"
                    onClick={() => setPhoneDropdownOpen(!phoneDropdownOpen)}
                  >
                    <span className="phone-flag">{PHONE_COUNTRIES.find(c => c.code === phoneCountry)?.flag}</span>
                    <span className="phone-dial">{PHONE_COUNTRIES.find(c => c.code === phoneCountry)?.dial}</span>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="phone-chevron">
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </button>
                  {phoneDropdownOpen && (
                    <div className="phone-dropdown">
                      {PHONE_COUNTRIES.map(c => (
                        <button
                          type="button"
                          key={c.code}
                          className={`phone-dropdown-item ${phoneCountry === c.code ? "active" : ""}`}
                          onClick={() => { setPhoneCountry(c.code); setPhoneDropdownOpen(false); }}
                        >
                          <span className="phone-flag">{c.flag}</span>
                          <span>{c.dial}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="phone-number-field">
                    <input
                      type="tel"
                      className="form-input phone-input"
                      placeholder=" "
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      autoComplete="tel-national"
                    />
                    <label className="float-label-text">Phone number</label>
                  </div>
                </div>
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
                <div className="float-label">
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
                  <label className="float-label-text float-label-text--active">{t.country_placeholder}</label>
                </div>
              </div>

              <div className="form-row form-row-inline">
                <div className="form-group">
                  <FloatingInput
                    label={t.first_name_placeholder}
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    autoComplete="given-name"

                  />
                </div>
                <div className="form-group">
                  <FloatingInput
                    label={t.last_name_placeholder}
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    autoComplete="family-name"

                  />
                </div>
              </div>

              <div className="form-row">
                <FloatingInput
                  label={t.address_placeholder}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  autoComplete="street-address"

                />
              </div>

              <div className="form-row">
                <FloatingInput
                  label={t.apt_placeholder}
                  value={apartment}
                  onChange={(e) => setApartment(e.target.value)}
                  autoComplete="address-line2"
                />
              </div>

              <div className="form-row form-row-three">
                <div className="form-group">
                  <FloatingInput
                    label={t.city_placeholder}
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    autoComplete="address-level2"

                  />
                </div>
                <div className="form-group">
                  <FloatingInput
                    label={t.province_placeholder}
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    autoComplete="address-level1"
                  />
                </div>
                <div className="form-group">
                  <FloatingInput
                    label={t.postal_placeholder}
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    autoComplete="postal-code"

                  />
                </div>
              </div>
            </section>

            <div className="divider" />

            {/* Shipping Method Section */}
            <section className="checkout-section">
              <h2 className="section-title" style={{ marginBottom: 16 }}>Shipping method</h2>
              <div className="shipping-method-card selected">
                <div className="shipping-method-radio">
                  <input type="radio" name="shipping-method" checked readOnly />
                </div>
                <div className="shipping-method-info">
                  <span className="shipping-method-title">Royal Mail Tracked</span>
                  <span className="shipping-method-desc">Delivery 1-3 Days</span>
                </div>
                <span className="shipping-method-price">FREE</span>
              </div>
            </section>

            <div className="divider" />

            {/* Payment Section */}
            <section className="checkout-section">
              <h2 className="section-title">{t.payment}</h2>
              <p className="text-muted text-small" style={{ marginBottom: 16 }}>{t.payment_subtitle}</p>

              <div className="whop-embed-container">
                <WhopCheckoutEmbed
                  ref={checkoutRef}
                  planId={pageConfig.whopPlanId}
                  returnUrl={getReturnUrl()}
                  hideEmail
                  hidePrice
                  hideSubmitButton
                  theme="light"
                  onComplete={handleComplete}
                  onStateChange={(state) => {
                    console.log("[Whop] state:", state);
                    setCheckoutState(state);
                  }}
                  prefill={{
                    email: email || undefined,
                  }}
                  styles={{
                    container: {
                      paddingLeft: 0,
                      paddingRight: 0,
                      paddingTop: 0,
                      paddingBottom: 0,
                    },
                  }}
                  fallback={
                    <div style={{ padding: "20px", textAlign: "center", color: "#737373" }}>
                      Loading payment form...
                    </div>
                  }
                />
              </div>
            </section>

            {/* Complete Order Button */}
            <button
              type="button"
              className="btn btn-complete-order"
              disabled={checkoutState !== "ready"}
              onClick={handleSubmitOrder}
            >
              <LockIcon />
              {checkoutState === "disabled" ? t.processing : "Complete order"}
            </button>

            <p className="secure-notice">
              <LockIcon />
              {t.secure_payment}
            </p>

            <div className="checkout-bottom-section">
              <img className="payment-badges" src="https://lassodata.s3.eu-north-1.amazonaws.com/users/6994a4bf984dfe408eb12079/payment-pages/6994a9e9984dfe408eb12397_payment_methods_6984d2e19d9687f9923ba944-payment-methods-upcart-trust-badge-1768853478727-cbdadadd-3fa09df1.png" alt="Payment methods" />
              <div className="footer-links-grid">
                <a href="#" className="footer-link">Terms & conditions</a>
                <a href="#" className="footer-link">Privacy policy</a>
                <a href="#" className="footer-link">Return/Shipping policy</a>
              </div>
            </div>
          </div>
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
            {/* Order Summary Title */}
            <h2 className="summary-title">{t.order_summary}</h2>

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

            {/* Shipping Protection */}
            <div className="summary-product">
              <div className="product-thumbnail">
                <img
                  src="https://cdn.shopify.com/s/files/1/0718/8483/3026/files/default_71870f99-405f-4b04-9583-d81a1f91b5e7.png"
                  alt="Shipping Protection"
                />
              </div>
              <div className="product-details">
                <p className="product-name">Shipping Protection</p>
                <p className="product-variant">Against loss, theft & damage</p>
              </div>
              <span className="product-price">{t.free}</span>
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

            {/* Trust Badges - desktop only (inside sidebar) */}
            <div className="desktop-only">
              <div className="trust-badges">
                <div className="trust-badge-card">
                  <div className="trust-badge-icon"><TruckIcon /></div>
                  <div className="trust-badge-text">
                    <span className="trust-badge-title">Tracked Delivery Guaranteed</span>
                    <span className="trust-badge-desc">Delivered to your home with Royal Mail using Tracked Delivery Guaranteed</span>
                  </div>
                </div>
                <div className="trust-badge-card">
                  <div className="trust-badge-icon"><ShieldIcon /></div>
                  <div className="trust-badge-text">
                    <span className="trust-badge-title">30 Days Money Back Guarantee</span>
                    <span className="trust-badge-desc">Change of mind? Exchange or return easily within the first 30 days</span>
                  </div>
                </div>
              </div>
              <div className="customer-reviews">
                <h3 className="reviews-title">Customer Reviews</h3>
                {REVIEWS.map((review, i) => (
                  <div className="review-card" key={i}>
                    <div className="review-stars">
                      {[...Array(5)].map((_, j) => <StarIcon key={j} />)}
                    </div>
                    <h4 className="review-card-title">{review.title}</h4>
                    <p className="review-card-body">{review.body}</p>
                    <div className="review-author">
                      <img className="review-avatar" src={review.avatar} alt={review.name} />
                      <div className="review-author-info">
                        <span className="review-author-name">{review.name}</span>
                        <span className="review-author-time">{review.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile only - Trust badges & Reviews at the bottom */}
      <section className="checkout-social-proof mobile-only">
        <div className="checkout-social-proof-inner">
          <div className="trust-badges">
            <div className="trust-badge-card">
              <div className="trust-badge-icon"><TruckIcon /></div>
              <div className="trust-badge-text">
                <span className="trust-badge-title">Tracked Delivery Guaranteed</span>
                <span className="trust-badge-desc">Delivered to your home with Royal Mail using Tracked Delivery Guaranteed</span>
              </div>
            </div>
            <div className="trust-badge-card">
              <div className="trust-badge-icon"><ShieldIcon /></div>
              <div className="trust-badge-text">
                <span className="trust-badge-title">30 Days Money Back Guarantee</span>
                <span className="trust-badge-desc">Change of mind? Exchange or return easily within the first 30 days</span>
              </div>
            </div>
          </div>
          <div className="customer-reviews">
            <h3 className="reviews-title">Customer Reviews</h3>
            {REVIEWS.map((review, i) => (
              <div className="review-card" key={i}>
                <div className="review-stars">
                  {[...Array(5)].map((_, j) => <StarIcon key={j} />)}
                </div>
                <h4 className="review-card-title">{review.title}</h4>
                <p className="review-card-body">{review.body}</p>
                <div className="review-author">
                  <img className="review-avatar" src={review.avatar} alt={review.name} />
                  <div className="review-author-info">
                    <span className="review-author-name">{review.name}</span>
                    <span className="review-author-time">{review.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
