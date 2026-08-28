import Link from 'next/link'

/**
 * Shown at the top of Payload's admin navigation.
 *
 * The admin panel and the product run on the same host, so it is easy to land
 * here by accident and mistake the back office for the product. This makes the
 * distinction obvious and offers one click back.
 */
export function BackToProduct() {
  return (
    <div
      style={{
        margin: '0 0 1rem',
        padding: '0.75rem',
        border: '1px solid var(--theme-elevation-150)',
        borderRadius: '6px',
        background: 'var(--theme-elevation-50)',
      }}
    >
      <div style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '0.35rem' }}>
        Internal back office — not the customer product
      </div>
      <Link href="/" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
        ← Open TenderIQ
      </Link>
    </div>
  )
}
