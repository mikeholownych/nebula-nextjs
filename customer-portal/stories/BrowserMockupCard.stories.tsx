import type { Meta, StoryObj } from '@storybook/nextjs'
import { BrowserMockupCard } from '@/components/mockups/BrowserMockupCard'

const meta = { title: 'Tier 1/BrowserMockupCard', component: BrowserMockupCard, tags: ['autodocs'], parameters: { docs: { description: { component: 'Decorative browser chrome wrapper with readable text-xs URL hierarchy and light, dark, and transparent themes.' } } } } satisfies Meta<typeof BrowserMockupCard>
export default meta
type Story = StoryObj<typeof meta>
export const DefaultChrome: Story = { args: { url: 'https://nebulacomponents.com/audit', children: <div className="min-h-40 p-6 text-fg">Audit preview</div> } }
export const CompactVariant: Story = { args: { className: 'max-w-sm', url: 'https://example.com', children: <div className="min-h-24 p-4 text-sm text-fg">Compact readable chrome</div> } }
export const LightTheme: Story = { args: { theme: 'light', children: <div className="min-h-32 p-6 text-neutral-900">Light content</div> } }
