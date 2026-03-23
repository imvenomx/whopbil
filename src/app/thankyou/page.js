"use client";

import { useState } from "react";

const CheckIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const CartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1"/>
    <circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
  </svg>
);

const ChevronIcon = ({ down }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: down ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
    <polyline points="18 15 12 9 6 15"/>
  </svg>
);

export default function ThankYouDummy() {
  const [summaryOpen, setSummaryOpen] = useState(false);

  const displayPrice = "€84.00";

  return (
    <div className="checkout-container">
      <main className="checkout-main">
        <div className="checkout-main-inner">
          <header className="checkout-header">
            <span className="checkout-logo">Thank you</span>
          </header>

          <div className="thankyou-confirmation">
            <div className="thankyou-icon">
              <CheckIcon />
            </div>
            <div className="thankyou-confirmation-text">
              <p className="thankyou-subtitle">Order confirmed</p>
              <h1 className="thankyou-title">Thank you for your purchase!</h1>
              <p className="thankyou-desc">A confirmation email has been sent to <strong>majidiabdelmjid@gmail.com</strong></p>
            </div>
          </div>

          <div className="thankyou-section">
            <h3 className="thankyou-section-title">Order details</h3>
            <div className="thankyou-details-grid">
              <div className="thankyou-detail">
                <span className="thankyou-detail-label">Product</span>
                <span className="thankyou-detail-value">Premium Package</span>
              </div>
              <div className="thankyou-detail">
                <span className="thankyou-detail-label">Amount paid</span>
                <span className="thankyou-detail-value">{displayPrice}</span>
              </div>
              <div className="thankyou-detail">
                <span className="thankyou-detail-label">Email</span>
                <span className="thankyou-detail-value">majidiabdelmjid@gmail.com</span>
              </div>
              <div className="thankyou-detail">
                <span className="thankyou-detail-label">Payment method</span>
                <span className="thankyou-detail-value">Credit card</span>
              </div>
            </div>
          </div>

          <div className="thankyou-section">
            <h3 className="thankyou-section-title">Delivery address</h3>
            <div className="thankyou-address">
              <p>Anwar Majidi</p>
              <p>123 Oxford Street, Apt 4B</p>
              <p>London, SW1A 1AA</p>
              <p>United Kingdom</p>
              <p>+44 7911 123456</p>
            </div>
          </div>

          <div className="thankyou-section">
            <h3 className="thankyou-section-title">Shipping method</h3>
            <p className="thankyou-shipping">Royal Mail Tracked - Delivery 1-3 Days</p>
          </div>
        </div>
      </main>

      <aside className="checkout-sidebar">
        <div className="checkout-sidebar-inner">
          <div className="summary-toggle" onClick={() => setSummaryOpen(!summaryOpen)}>
            <div className="summary-toggle-left">
              <CartIcon />
              <span className="summary-toggle-text">{summaryOpen ? "Hide order summary" : "Show order summary"}</span>
              <ChevronIcon down={summaryOpen} />
            </div>
            <span className="summary-toggle-price">{displayPrice}</span>
          </div>
          <div className={`summary-content ${summaryOpen ? "" : "collapsed"}`}>
            <h2 className="summary-title">Order summary</h2>
            <div className="summary-product">
              <div className="product-thumbnail">
                <img src="https://cdn-icons-png.flaticon.com/512/8832/8832119.png" alt="Product" />
                <span className="product-quantity-badge">1</span>
              </div>
              <div className="product-details">
                <p className="product-name">Premium Package</p>
                <p className="product-variant">Monthly subscription</p>
              </div>
              <span className="product-price">{displayPrice}</span>
            </div>
            <div className="summary-product">
              <div className="product-thumbnail">
                <img src="https://cdn.shopify.com/s/files/1/0718/8483/3026/files/default_71870f99-405f-4b04-9583-d81a1f91b5e7.png" alt="Shipping Protection" />
              </div>
              <div className="product-details">
                <p className="product-name">Shipping Protection</p>
                <p className="product-variant">Against loss, theft & damage</p>
              </div>
              <span className="product-price">Free</span>
            </div>
            <div className="summary-totals">
              <div className="summary-line">
                <span className="summary-line-label">Subtotal</span>
                <span className="summary-line-value">{displayPrice}</span>
              </div>
              <div className="summary-line">
                <span className="summary-line-label">Shipping</span>
                <span className="summary-line-value">Free</span>
              </div>
            </div>
            <div className="summary-total">
              <span className="summary-total-label">Total</span>
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
