import type { Meta, StoryObj } from '@storybook/nextjs'
import EmailGate from '@/components/EmailGate'
const meta = { title: 'Tier 3/EmailGate', component: EmailGate, tags: ['autodocs'], parameters: { docs: { description: { component: 'Client email unlock overlay. Keyboard: native form input and submit button are reachable by Tab; invalid submission exposes the Input error state.' } } } } satisfies Meta<typeof EmailGate>
export default meta
type Story = StoryObj<typeof meta>
export const ReadyToUnlock: Story = { args: { auditId: 'storybook-audit', onUnlock: () => undefined } }
