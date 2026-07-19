/**
 * x402 payment protocol — shared server config
 * https://x402.org | https://docs.x402.org
 *
 * Receiving wallet: 0x03ce3d56E497ECCFE7Fe1a7f666b9e2307541202
 * Facilitator: https://facilitator.payai.network (managed production, no API key)
 *
 * Network: eip155:8453 (Base mainnet)
 * Asset: native Base USDC (resolved by @x402/evm)
 */
import { x402ResourceServer, HTTPFacilitatorClient } from '@x402/core/server'
import { ExactEvmScheme } from '@x402/evm/exact/server'

export const WALLET_ADDRESS = '0x03ce3d56E497ECCFE7Fe1a7f666b9e2307541202' as const
export const FACILITATOR_URL = 'https://facilitator.payai.network'

export const NETWORK = 'eip155:8453'

const facilitatorClient = new HTTPFacilitatorClient({ url: FACILITATOR_URL })

export const x402Server = new x402ResourceServer(facilitatorClient)
x402Server.register(NETWORK, new ExactEvmScheme())
