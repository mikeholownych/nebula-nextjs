import type { Meta, StoryObj } from '@storybook/nextjs'
import Card from '@/components/ui/Card'
const meta = { title: 'Tier 3/Card', component: Card, tags: ['autodocs'], parameters: { docs: { description: { component: 'Surface primitive with default, elevated, bordered variants and none/sm/md/lg padding.' } } } } satisfies Meta<typeof Card>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = { args: { children: <p>Default card content</p> } }
export const Elevated: Story = { args: { variant: 'elevated', children: <p>Elevated card content</p> } }
export const BorderedNoPadding: Story = { args: { variant: 'bordered', padding: 'none', children: <p className="p-4">Bordered card content</p> } }
