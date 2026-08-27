import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tender Intelligence",
  description: "AI Tender Intelligence & Bid Management Platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav className="topbar">
          <Link href="/tenders" className="brand">
            Tender<span>IQ</span>
          </Link>
          <Link href="/tenders">Tenders</Link>
        </nav>
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
