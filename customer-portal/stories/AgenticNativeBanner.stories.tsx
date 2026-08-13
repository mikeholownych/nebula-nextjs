import type { Meta, StoryObj } from '@storybook/nextjs'
import AgenticNativeBanner from '@/app/components/AgenticNativeBanner'

const meta = {
  title: 'Features/AgenticNativeBanner',
  component: AgenticNativeBanner,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Banner highlighting WebMCP and FastAPI agentic protocol integration for AI developers and tools.',
      },
    },
  },
} satisfies Meta<typeof AgenticNativeBanner>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
