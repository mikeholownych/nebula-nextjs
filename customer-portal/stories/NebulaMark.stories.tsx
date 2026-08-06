import type { Meta, StoryObj } from '@storybook/nextjs'
import { NebulaMark } from '@/components/NebulaMark'

const meta = { title: 'Tier 1/NebulaMark', component: NebulaMark, tags: ['autodocs'], parameters: { docs: { description: { component: 'Semantic-neutral 3x3 brand glyph. The story uses only neutral, pass, and fail states; it does not encode a deprecated signal taxonomy or score.' } } } } satisfies Meta<typeof NebulaMark>
export default meta
type Story = StoryObj<typeof meta>
export const CurrentRegistryNeutral: Story = { args: { size: 48 } }
export const CurrentRegistryStates: Story = { args: { size: 48, states: ['pass','pass','neutral','pass','fail','neutral','neutral','neutral','pass'] } }
