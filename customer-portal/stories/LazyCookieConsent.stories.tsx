import type { Meta, StoryObj } from '@storybook/nextjs'
import LazyCookieConsent from '@/app/components/LazyCookieConsent'
const meta = { title: 'Tier 2/LazyCookieConsent', component: LazyCookieConsent, tags: ['autodocs'], parameters: { docs: { description: { component: 'Thin export alias for CookieConsent. This story documents it as a live server-rendered variant, not dead code; keyboard behavior is inherited from CookieConsent.' } } } } satisfies Meta<typeof LazyCookieConsent>
export default meta
type Story = StoryObj<typeof meta>
export const LiveVariant: Story = { args: { country: 'DE' } }
