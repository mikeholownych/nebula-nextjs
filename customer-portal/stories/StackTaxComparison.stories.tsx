import type { Meta, StoryObj } from '@storybook/nextjs'
import StackTaxComparison from '@/app/components/StackTaxComparison'

const meta = {
  title: 'Features/StackTaxComparison',
  component: StackTaxComparison,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Unfair Advantage matrix comparing traditional CRO agencies, DIY SaaS tool stacks, and Nebula Autonomous Engine.',
      },
    },
  },
} satisfies Meta<typeof StackTaxComparison>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
