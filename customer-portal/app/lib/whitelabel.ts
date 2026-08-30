/**
 * Whitelabel/Agency Edition service
 * Per-client white-label, custom branding, API-only access, billing aggregation
 */


import { auditPool } from '@/app/lib/audit-db'

/**
 * Create client white-label configuration
 */
export async function createClientBrand(
  data: {
    clientId: string
    brandName: string
    brandColor: string
    logoUrl?: string
    fontFamily?: string
    customDomain?: string
    theme: 'light' | 'dark' | 'auto'
    enabled: boolean
  }
): Promise<{
  brandId: string
  clientId: string
  brandName: string
  customDomain?: string
  isEnabled: boolean
}> {
  try {
    const result = await auditPool.query(`
      INSERT INTO client_brands (
        client_id, brand_name, brand_color, logo_url, font_family, custom_domain, theme, is_enabled, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING id, client_id, brand_name, custom_domain, is_enabled
    `, [
      data.clientId,
      data.brandName,
      data.brandColor,
      data.logoUrl || '',
      data.fontFamily || 'Inter',
      data.customDomain || '',
      data.theme,
      data.enabled,
    ])

    return {
      brandId: result.rows[0].id,
      clientId: result.rows[0].client_id,
      brandName: result.rows[0].brand_name,
      customDomain: result.rows[0].custom_domain || undefined,
      isEnabled: result.rows[0].is_enabled,
    }
  } catch (error: unknown) {
    console.error('[Whitelabel] Error createClientBrand:', error)
    throw error
  }
}

/**
 * Update client white-label configuration
 */
export async function updateClientBrand(
  brandId: string,
  data: Partial<{
    brandName: string
    brandColor: string
    logoUrl: string
    fontFamily: string
    customDomain: string
    theme: 'light' | 'dark' | 'auto'
    isEnabled: boolean
  }>
): Promise<{
  brandId: string
  clientId: string
  brandName: string
  customDomain?: string
  isEnabled: boolean
}> {
  try {
    // Build dynamic update query
    const updates: string[] = []
    const values: (string | number)[] = [brandId]

    if (data.brandName !== undefined) {
      updates.push('brand_name = $' + (values.length + 1))
      values.push(data.brandName)
    }
    if (data.brandColor !== undefined) {
      updates.push('brand_color = $' + (values.length + 1))
      values.push(data.brandColor)
    }
    if (data.logoUrl !== undefined) {
      updates.push('logo_url = $' + (values.length + 1))
      values.push(data.logoUrl)
    }
    if (data.fontFamily !== undefined) {
      updates.push('font_family = $' + (values.length + 1))
      values.push(data.fontFamily)
    }
    if (data.customDomain !== undefined) {
      updates.push('custom_domain = $' + (values.length + 1))
      values.push(data.customDomain)
    }
    if (data.theme !== undefined) {
      updates.push('theme = $' + (values.length + 1))
      values.push(data.theme)
    }
    if (data.isEnabled !== undefined) {
      updates.push('is_enabled = $' + (values.length + 1))
      values.push(data.isEnabled ? 'true' : 'false')
    }

    if (updates.length === 0) {
      throw new Error('No update fields provided')
    }

    values.push('NOW()') // updated_at
    updates.push('updated_at = $' + values.length)

    const result = await auditPool.query(`
      UPDATE client_brands SET
        ${updates.join(', ')}
      WHERE id = $1
      RETURNING id, client_id, brand_name, custom_domain, is_enabled
    `, values)

    return {
      brandId: result.rows[0].id,
      clientId: result.rows[0].client_id,
      brandName: result.rows[0].brand_name,
      customDomain: result.rows[0].custom_domain || undefined,
      isEnabled: result.rows[0].is_enabled,
    }
  } catch (error: unknown) {
    console.error('[Whitelabel] Error updateClientBrand:', error)
    throw error
  }
}

/**
 * Get client white-label configuration
 */
export async function getClientBrand(clientId: string): Promise<{
  brandId: string
  clientId: string
  brandName: string
  brandColor: string
  logoUrl?: string
  fontFamily: string
  customDomain?: string
  theme: 'light' | 'dark' | 'auto'
  isEnabled: boolean
}> {
  try {
    const result = await auditPool.query(`
      SELECT id, client_id, brand_name, brand_color, logo_url, font_family, custom_domain, theme, is_enabled
      FROM client_brands
      WHERE client_id = $1
    `, [clientId])

    if (result.rows.length === 0) {
      throw new Error(`No white-label config found for client: ${clientId}`)
    }

    const brand = result.rows[0]
    return {
      brandId: brand.id,
      clientId: brand.client_id,
      brandName: brand.brand_name,
      brandColor: brand.brand_color,
      logoUrl: brand.logo_url || undefined,
      fontFamily: brand.font_family,
      customDomain: brand.custom_domain || undefined,
      theme: brand.theme,
      isEnabled: brand.is_enabled,
    }
  } catch (error: unknown) {
    console.error('[Whitelabel] Error getClientBrand:', error)
    throw error
  }
}

/**
 * Generate white-labeled audit URL
 */
export function getBrandedAuditUrl(
  auditId: string,
  customDomain?: string
): string {
  if (customDomain) {
    return `https://${customDomain}/audit/${auditId}`
  }
  return `/audit/${auditId}`
}

/**
 * Get all client brands (agency view)
 */
export async function getAgencyClients(): Promise<{
  clients: Array<{
    clientId: string
    brandName: string
    customDomain?: string
    isEnabled: boolean
    totalAudits: number
    lastAuditDate?: string
  }>
}> {
  try {
    const result = await auditPool.query(`
      SELECT 
        cb.id as brand_id,
        cb.client_id,
        cb.brand_name,
        cb.custom_domain,
        cb.is_enabled,
        COUNT(a.id) as total_audits,
        MAX(a.completed_at) as last_audit_date
      FROM client_brands cb
      LEFT JOIN audits a ON cb.client_id = a.customer_id
      GROUP BY cb.id, cb.client_id, cb.brand_name, cb.custom_domain, cb.is_enabled
      ORDER BY cb.created_at DESC
    `)

    const clients = result.rows.map((row: { client_id: string; brand_name: string; custom_domain: string | null; is_enabled: boolean; total_audits: string; last_audit_date: string | null }) => ({
      clientId: row.client_id,
      brandName: row.brand_name,
      customDomain: row.custom_domain || undefined,
      isEnabled: row.is_enabled,
      totalAudits: parseInt(row.total_audits),
      lastAuditDate: row.last_audit_date,
    }))

    return { clients }
  } catch (error: unknown) {
    console.error('[Whitelabel] Error getAgencyClients:', error)
    throw error
  }
}

// Initialize tables on load
await auditPool.query(`
  CREATE TABLE IF NOT EXISTS client_brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    brand_name VARCHAR(255) NOT NULL,
    brand_color VARCHAR(7) DEFAULT '#c7ff2f',
    logo_url TEXT,
    font_family VARCHAR(100) DEFAULT 'Inter',
    custom_domain TEXT,
    theme VARCHAR(10) DEFAULT 'auto',
    is_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  )
`)
await auditPool.query(`
  CREATE UNIQUE INDEX IF NOT EXISTS idx_client_brands_client ON client_brands(client_id)
`)
