import type { Meta, StoryObj } from '@storybook/nextjs'
import SelfScan from '@/app/components/SelfScan'
const meta = { title: 'Tier 3/SelfScan', component: SelfScan, tags: ['autodocs'], parameters: { docs: { description: { component: 'Viewport-triggered cached self-scan reveal. Source-only checks are omitted until rendered verification is available; this story uses the real component without inventing snapshot data.' } } } } satisfies Meta<typeof SelfScan>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
