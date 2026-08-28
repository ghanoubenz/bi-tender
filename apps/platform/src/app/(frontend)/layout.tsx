import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './styles.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })

export const metadata: Metadata = {
  title: 'TenderIQ — Tender Intelligence',
  description: 'AI Tender Intelligence & Bid Management',
}

export default function FrontendLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  )
}
