import type { Meta, StoryObj } from '@storybook/nextjs'
import AnalyticsRuntime from '@/app/components/AnalyticsRuntime'
const meta = { title: 'Tier 2/AnalyticsRuntime', component: AnalyticsRuntime, tags: ['autodocs'], parameters: { nextjs: { navigation: { pathname: '/audit', query: { source: 'storybook' } } }, docs: { description: { component: 'Consent-gated analytics runtime. It records page views only after analytics consent and listens for consent/runtime-ready events.' } } } } satisfies Meta<typeof AnalyticsRuntime>
export default meta
type Story = StoryObj<typeof meta>
export const ConsentGated: Story = {}
