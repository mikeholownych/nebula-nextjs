import type { Meta, StoryObj } from '@storybook/nextjs'
import AggregateProof from '@/app/components/AggregateProof'

const meta = { title: 'Tier 1/AggregateProof', component: AggregateProof, tags: ['autodocs'], parameters: { docs: { description: { component: 'Verified-sample audit volume only. The component intentionally has no numeric avg_score prop or rendering path; the story mocks completed_audits only.' } } } } satisfies Meta<typeof AggregateProof>
export default meta
type Story = StoryObj<typeof meta>
export const VerifiedSample: Story = { render: () => { globalThis.fetch = async () => new Response(JSON.stringify({ completed_audits: 131 }), { status: 200 }); return <AggregateProof /> } }
