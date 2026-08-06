import type { Meta, StoryObj } from '@storybook/nextjs'
import PageShell from '@/app/components/PageShell'
const meta = { title: 'Tier 3/AppPageShell', component: PageShell, tags: ['autodocs'], parameters: { nextjs: { navigation: { pathname: '/about' } }, docs: { description: { component: 'App route shell that adds the shared breadcrumb outside the homepage while preserving route-provided page content.' } } } } satisfies Meta<typeof PageShell>
export default meta
type Story = StoryObj<typeof meta>
export const InteriorRoute: Story = { args: { children: <main className="min-h-40 bg-bg p-6 text-fg">Interior route content</main> } }
export const Homepage: Story = { args: { children: <main className="min-h-40 bg-bg p-6 text-fg">Homepage content</main> }, parameters: { nextjs: { navigation: { pathname: '/' } } } }
