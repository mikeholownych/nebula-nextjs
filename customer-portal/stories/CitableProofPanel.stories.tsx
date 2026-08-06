import type { Meta, StoryObj } from '@storybook/nextjs'
import { CitableProofPanel } from '@/components/citable/CitableProofPanel'
const meta = { title: 'Tier 2/CitableProofPanel', component: CitableProofPanel, tags: ['autodocs'], parameters: { docs: { description: { component: 'Proof-boundary panel that distinguishes documented package facts from unknown workflow/deployment state and unpublished outcomes.' } } } } satisfies Meta<typeof CitableProofPanel>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
