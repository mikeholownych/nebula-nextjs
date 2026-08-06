import type { Meta, StoryObj } from '@storybook/nextjs'
import CookieConsent from '@/app/components/CookieConsent'
import { Surface, StateNote } from './WorkbenchSurface'

const meta = { title: 'Tier 1/CookieConsent', component: CookieConsent, tags: ['autodocs'], parameters: { docs: { description: { component: 'Consent dialog with modal semantics, initial focus, focus return, Escape-to-dismiss, and token-compliant dark/light palette. Keyboard: Tab is trapped; Escape selects essential-only.' } } } } satisfies Meta<typeof CookieConsent>
export default meta
type Story = StoryObj<typeof meta>
export const Closed: Story = { render: () => <Surface><StateNote>Closed state is represented by the post-consent hidden banner. Reload this story after choosing a consent action.</StateNote><div className="text-sm text-fg-muted">Consent already recorded</div></Surface> }
export const OpenKeyboardTriggered: Story = { args: { country: 'DE' } }
export const EscapeToDismiss: Story = { args: { country: 'DE' }, parameters: { docs: { description: { story: 'Press Escape: the runtime chooses essential-only, hides the dialog, and returns focus.' } } } }
export const FocusReturnDemonstration: Story = { args: { country: 'DE' }, render: (args) => <Surface><button className="mb-4 rounded border border-border px-3 py-2">Open consent context</button><CookieConsent {...args} /></Surface> }
export const DarkAndLight: Story = { args: { country: 'DE' }, parameters: { docs: { description: { story: 'Switch the global toolbar between light and dark; no per-story theme prop is required.' } } } }
