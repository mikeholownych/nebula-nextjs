import type { Meta, StoryObj } from '@storybook/nextjs'
import LinkButton from '@/components/ui/LinkButton'
const meta = { title: 'Tier 3/LinkButton', component: LinkButton, tags: ['autodocs'], parameters: { docs: { description: { component: 'Anchor styled as an action with primary, secondary, outline, ghost, and sm/md/lg variants; keyboard focus uses the shared ring.' } } } } satisfies Meta<typeof LinkButton>
export default meta
type Story = StoryObj<typeof meta>
export const Primary: Story = { args: { href: '/audit', children: 'Start audit' } }
export const OutlineLarge: Story = { args: { href: '/pricing', variant: 'outline', size: 'lg', children: 'View pricing' } }
