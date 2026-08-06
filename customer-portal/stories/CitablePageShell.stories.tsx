import type { Meta, StoryObj } from '@storybook/nextjs'
import { CitablePageShell } from '@/components/citable/CitablePageShell'
import { citableRoutes } from '@/app/resources/citable/content'
const meta = { title: 'Tier 3/CitablePageShell', component: CitablePageShell, tags: ['autodocs'], parameters: { docs: { description: { component: 'Citable layout shell with breadcrumb schema, bounded route answer, optional related navigation, and caller-provided content.' } } } } satisfies Meta<typeof CitablePageShell>
export default meta
type Story = StoryObj<typeof meta>
export const RelatedNavigation: Story = { args: { route: citableRoutes[0], children: <p className="text-fg-muted">Citable page content</p> } }
export const RelatedNavigationHidden: Story = { args: { route: citableRoutes[0], showRelatedNavigation: false, children: <p className="text-fg-muted">Focused content</p> } }
