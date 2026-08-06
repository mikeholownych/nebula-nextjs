import type { Meta, StoryObj } from '@storybook/nextjs'
import Footer from '@/components/Footer'
const meta = { title: 'Tier 3/Footer', component: Footer, tags: ['autodocs'], parameters: { layout: 'fullscreen', docs: { description: { component: 'Site footer with product, learning, comparison, legal, badge, and social navigation groups.' } } } } satisfies Meta<typeof Footer>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
