import type { MetadataRoute } from 'next'
import { brand } from '@/app/lib/brand'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: brand.name,
    short_name: brand.shortName,
    description: 'Evidence-backed landing page conversion diagnosis.',
    start_url: '/',
    display: 'standalone',
    background_color: brand.colors.background,
    theme_color: brand.metadata.themeColor,
    icons: [
      {
        src: brand.assets.pwaIcon192,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: brand.assets.pwaIcon512,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: brand.assets.faviconSvg,
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
  }
}
