import type { Metadata, Viewport } from 'next'
import { headers } from 'next/headers'
import './globals.css'

// No AppShell here: the legacy WorkspaceClient renders its own complete
// chrome (sidebar, nav, tier card). Pages that need the shared shell opt in
// via their own route-group layout. A root-level shell would double the
// sidebar on every page that draws its own.

export const metadata: Metadata = {
  title: {
    default: 'Nebula Workspace',
    template: '%s | Nebula Workspace',
  },
  description: 'Your Nebula workspace: audits, findings, monitoring.',
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const requestHeaders = await headers()
  const rawBrand = requestHeaders.get('x-tenant-brand')
  let brand: { display_name?: string; primary_color?: string } | null = null
  try {
    brand = rawBrand ? JSON.parse(rawBrand) : null
  } catch {
    brand = null
  }
  const primaryColor = /^#[0-9a-fA-F]{6}$/.test(brand?.primary_color ?? '')
    ? brand?.primary_color
    : '#c7ff2f'
  return (
    <html lang="en">
      <body
        className="bg-bg text-fg antialiased"
        data-tenant-brand={brand?.display_name ?? 'Nebula Components'}
        style={{ '--brand-primary': primaryColor } as React.CSSProperties}
      >
        {children}
      </body>
    </html>
  )
}
