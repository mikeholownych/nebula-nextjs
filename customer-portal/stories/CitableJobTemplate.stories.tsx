import type { Meta, StoryObj } from '@storybook/nextjs'
import { CitableJobTemplate } from '@/components/citable/CitableJobTemplate'
import { citableJobRoutes } from '@/app/resources/citable/content'
const meta = { title: 'Tier 3/CitableJobTemplate', component: CitableJobTemplate, tags: ['autodocs'], parameters: { docs: { description: { component: 'Reusable citable job template that renders observes, artifacts, limits, next step, and the proof-boundary panel from a typed job route.' } } } } satisfies Meta<typeof CitableJobTemplate>
export default meta
type Story = StoryObj<typeof meta>
export const TechnicalRetrieval: Story = { args: { job: citableJobRoutes[0] } }
export const ClaimGovernance: Story = { args: { job: citableJobRoutes[1] } }
