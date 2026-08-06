import type { Meta, StoryObj } from '@storybook/nextjs'
import WebMCP from '@/components/WebMCP'
import { Surface } from './WorkbenchSurface'

function Result({ status, detail }: { status: string; detail: string }) { return <div role="status" className="rounded-xl border border-border p-4 text-sm text-fg"><strong>{status}</strong><p className="mt-1 text-fg-muted">{detail}</p></div> }
const meta = { title: 'Tier 1/WebMCP', component: WebMCP, tags: ['autodocs'], parameters: { docs: { description: { component: 'Browser WebMCP registration with canonical seven-signal pricing copy and typed submitted/error results. The result panels are a local contract harness because the runtime registers tools rather than rendering UI.' } } } } satisfies Meta<typeof WebMCP>
export default meta
type Story = StoryObj<typeof meta>
export const SuccessResult: Story = { render: () => <Surface><WebMCP /><Result status="submitted" detail="audit_id: demo-verified-receipt; url: https://example.com" /></Surface> }
export const ErrorResult: Story = { render: () => <Surface><WebMCP /><Result status="error" detail="INVALID_URL: Provide a public HTTP or HTTPS URL." /></Surface> }
export const PendingLoadingResult: Story = { render: () => <Surface><WebMCP /><Result status="pending" detail="The audit submission is being accepted by the typed POST contract." /></Surface> }
