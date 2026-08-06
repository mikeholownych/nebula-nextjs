import type { Meta, StoryObj } from '@storybook/nextjs'
import { FindingCallout, RoughFilters } from '@/components/mockups/FindingCallout'

const meta = { title: 'Tier 1/FindingCallout', component: FindingCallout, tags: ['autodocs'], parameters: { docs: { description: { component: 'Annotation primitive for teardown findings. RoughFilters is rendered once by the page/story shell, demonstrating the hoisted SVG definition rather than per-instance duplication.' } } } } satisfies Meta<typeof FindingCallout>
export default meta
type Story = StoryObj<typeof meta>
export const SingleInstance: Story = { args: { children: 'single finding', variant: 'circle' }, render: () => <div className="p-8 text-2xl text-fg"><RoughFilters />A <FindingCallout variant="circle">single finding</FindingCallout> is marked.</div> }
export const MultipleInstancesOnePage: Story = { args: { children: 'multiple findings' }, render: () => <div className="p-8 text-2xl text-fg"><RoughFilters /><p><FindingCallout variant="highlight">First finding</FindingCallout></p><p><FindingCallout variant="crossOut">Second finding</FindingCallout></p><p><FindingCallout variant="wavy">Third finding</FindingCallout></p></div> }
