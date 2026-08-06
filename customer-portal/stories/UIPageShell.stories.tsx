import type { Meta, StoryObj } from '@storybook/nextjs'
import PageShell from '@/components/ui/PageShell'
const meta = { title: 'Tier 3/UIPageShell', component: PageShell, tags: ['autodocs'], parameters: { layout: 'fullscreen', docs: { description: { component: 'UI layout shell that provides the main landmark, optional title, description, background, and top spacing.' } } } } satisfies Meta<typeof PageShell>
export default meta
type Story = StoryObj<typeof meta>
export const WithTitle: Story = { args: { title: 'Component workbench', description: 'A documented UI page shell.', children: <div className="px-6 pb-12 text-fg">Page content</div> } }
export const ContentOnly: Story = { args: { children: <div className="p-6 text-fg">Content without heading</div> } }
