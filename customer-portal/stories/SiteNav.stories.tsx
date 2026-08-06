import type { Meta, StoryObj } from '@storybook/nextjs'
import SiteNav from '@/components/SiteNav'
import { Surface, StateNote } from './WorkbenchSurface'

const meta = { title: 'Tier 1/SiteNav', component: SiteNav, tags: ['autodocs'], parameters: { layout: 'fullscreen', docs: { description: { component: 'Responsive primary navigation with a documented 44px mobile summary target. Keyboard: Tab reaches the trigger and Enter/Space opens the native details menu; Escape behavior follows the browser details contract.' } } } } satisfies Meta<typeof SiteNav>
export default meta
type Story = StoryObj<typeof meta>
export const Desktop: Story = { render: () => <div className="min-h-40"><SiteNav /></div> }
export const MobileTrigger44px: Story = { render: () => <div className="min-h-40"><SiteNav /></div>, parameters: { viewport: { defaultViewport: 'mobile1' } } }
export const OpenMobileMenu: Story = { render: () => <Surface><StateNote>Resize to mobile, focus the 44px summary, and press Enter/Space.</StateNote><SiteNav /></Surface>, parameters: { viewport: { defaultViewport: 'mobile1' } } }
export const ClosedMobileMenu: Story = { render: () => <Surface><SiteNav /></Surface>, parameters: { viewport: { defaultViewport: 'mobile1' } } }
export const KeyboardOpenClose: Story = { render: () => <Surface><StateNote>Keyboard contract: Tab → trigger → Enter/Space opens; focus remains inside native details navigation.</StateNote><SiteNav /></Surface>, parameters: { viewport: { defaultViewport: 'mobile1' } } }
