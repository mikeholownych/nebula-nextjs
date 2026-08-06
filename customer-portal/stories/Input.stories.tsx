import type { Meta, StoryObj } from '@storybook/nextjs'
import Input from '@/components/ui/Input'
import { Surface, StateNote } from './WorkbenchSurface'

const meta = { title: 'Tier 1/Input', component: Input, tags: ['autodocs'], parameters: { docs: { description: { component: 'Labeled form input with deterministic useId fallback, helper/error relationships, and aria-errormessage. Keyboard: Tab enters the field and standard text editing keys remain native.' } } } } satisfies Meta<typeof Input>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = { args: { label: 'Landing page URL', placeholder: 'https://example.com' } }
export const Filled: Story = { args: { label: 'Email', value: 'founder@example.com', readOnly: true } }
export const Focus: Story = { args: { label: 'Focus target', placeholder: 'Tab into this field' }, play: async ({ canvas, userEvent }) => { await userEvent.tab(); canvas.getByRole('textbox').focus() } }
export const Error: Story = { args: { label: 'Email', value: 'not-an-email', error: 'Enter a valid email address' } }
export const Disabled: Story = { args: { label: 'Locked field', value: 'Read only for now', disabled: true } }
export const DarkAndLight: Story = { render: () => <Surface><StateNote>Use the global theme toolbar to inspect token contrast.</StateNote><Input label="Theme-aware field" helper="Seven public checks are currently documented." /></Surface> }
