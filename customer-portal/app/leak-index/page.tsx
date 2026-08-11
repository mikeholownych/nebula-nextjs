import { permanentRedirect } from 'next/navigation'

/**
 * Branded alias for the Landing Page Leak Index.
 * Canonical content lives at /benchmarks - this route exists so the
 * "leak index" phrase resolves to the real dataset page instead of a 404.
 * permanentRedirect = HTTP 301 so the alias passes link equity to the
 * canonical page.
 */
export default function LeakIndexRedirect() {
  permanentRedirect('/benchmarks')
}
