import type { Meta, StoryObj } from '@storybook/nextjs'
import Button from '@/components/ui/Button'
import { Surface, StateNote } from './WorkbenchSurface'

const meta = { title: 'Tier 1/Button', component: Button, tags: ['autodocs'], parameters: { docs: { description: { component: 'Primary action primitive with semantic variants, loading state, disabled state, and keyboard focus ring. Keyboard: Tab focuses the button; Enter or Space activates it.' } } } } satisfies Meta<typeof Button>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = { args: { children: 'Run audit' } }
export const Hover: Story = { args: { children: 'Hover me' }, parameters: { pseudo: { hover: true } } }
export const Active: Story = { args: { children: 'Press me' }, parameters: { pseudo: { active: true } } }
export const FocusVisible: Story = { args: { children: 'Tab to focus' }, play: async ({ canvas, userEvent }) => { await userEvent.tab(); canvas.getByRole('button').focus() } }
export const Disabled: Story = { args: { children: 'Unavailable', disabled: true } }
export const Loading: Story = { args: { children: 'Submitting', isLoading: true } }
export const DarkAndLight: Story = { render: () => <Surface><StateNote>Global toolbar switches the shared light/dark theme.</StateNote><div className="flex gap-3"><Button>Light-ready</Button><Button variant="outline">Outline</Button></div></Surface> }
