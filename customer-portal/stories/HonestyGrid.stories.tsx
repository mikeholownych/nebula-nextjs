import type { Meta, StoryObj } from '@storybook/nextjs'
import HonestyGrid from '@/app/components/HonestyGrid'

const meta = {
  title: 'Features/HonestyGrid',
  component: HonestyGrid,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Clinical transparency grid outlining explicit audit scope boundaries and expectations.',
      },
    },
  },
} satisfies Meta<typeof HonestyGrid>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
