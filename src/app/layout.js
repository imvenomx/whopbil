import "./globals.css";
import Script from "next/script";

export const metadata = {
  title: "Checkout",
  description: "Checkout",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Script
          src="https://cdn.jsdelivr.net/npm/sweetalert2@11"
          strategy="afterInteractive"
        />
        {children}
      </body>
    </html>
  );
}
