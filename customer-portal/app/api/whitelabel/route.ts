import { NextResponse } from 'next/server'
import {
  createClientBrand,
  updateClientBrand,
  getClientBrand,
  getBrandedAuditUrl,
  getAgencyClients,
} from '@/app/lib/whitelabel'
import { auditPool } from '@/app/lib/audit-db'

export async function POST(request: Request) {
  const body = await request.json()
  const { action, brandId, clientId, brandData } = body

  try {
    let result

    if (action === 'create') {
      if (!clientId || !brandData) {
        return NextResponse.json(
          { error: 'clientId and brandData required for create action' },
          { status: 400 }
        )
      }
      result = await createClientBrand({ clientId, ...brandData })
    } else if (action === 'update') {
      if (!brandId || !brandData) {
        return NextResponse.json(
          { error: 'brandId and brandData required for update action' },
          { status: 400 }
        )
      }
      result = await updateClientBrand(brandId, brandData)
    } else if (action === 'get') {
      if (!clientId) {
        return NextResponse.json(
          { error: 'clientId required for get action' },
          { status: 400 }
        )
      }
      result = await getClientBrand(clientId)
    } else if (action === 'url') {
      if (!brandId && !clientId) {
        return NextResponse.json(
          { error: 'brandId or clientId required for url action' },
          { status: 400 }
        )
      }
      let customDomain
      if (brandId) {
        const brand = await getClientBrandFromBrandId(brandId)
        customDomain = brand.customDomain
      } else {
        const brand = await getClientBrand(clientId)
        customDomain = brand.customDomain
      }
      result = { urls: brandData?.auditIds?.map((id: string) => getBrandedAuditUrl(id, customDomain)) }
    } else if (action === 'clients') {
      result = await getAgencyClients()
    } else {
      return NextResponse.json(
        { error: 'Action must be "create", "update", "get", "url", or "clients"' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      ...result,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

async function getClientBrandFromBrandId(brandId: string) {
  const result = await auditPool.query(`
    SELECT client_id FROM client_brands WHERE id = $1
  `, [brandId])
  if (result.rows.length === 0) {
    throw new Error(`Brand not found: ${brandId}`)
  }
  return getClientBrand(result.rows[0].client_id)
}
