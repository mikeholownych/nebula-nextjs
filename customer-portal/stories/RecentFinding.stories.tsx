import type { Meta, StoryObj } from '@storybook/nextjs'
import RecentFinding from '@/app/components/RecentFinding'

const meta = { title: 'Tier 1/RecentFinding', component: RecentFinding, tags: ['autodocs'], parameters: { docs: { description: { component: 'Live recent finding renderer that fails closed for deprecated keys and labels. The story fixture demonstrates a valid current finding only.' } } } } satisfies Meta<typeof RecentFinding>
export default meta
type Story = StoryObj<typeof meta>
export const DefaultWithSuppression: Story = { render: () => { globalThis.fetch = async () => new Response(JSON.stringify({ key: 'cta_clarity', label: 'CTA clarity', issue: 'The primary action does not state the outcome.', impact: 6, quadrant: 'conversion', overall_score: null, grade: null, completed_at: 'recently' }), { status: 200 }); return <RecentFinding /> } }
