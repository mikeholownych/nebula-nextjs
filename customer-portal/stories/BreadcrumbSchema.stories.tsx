import type { Meta, StoryObj } from '@storybook/nextjs'
import BreadcrumbSchema from '@/app/components/BreadcrumbSchema'
const meta = { title: 'Tier 2/BreadcrumbSchema', component: BreadcrumbSchema, tags: ['autodocs'], parameters: { nextjs: { navigation: { pathname: '/resources/citable' } }, docs: { description: { component: 'Invisible BreadcrumbList JSON-LD emitter for layouts that already own visible breadcrumb markup.' } } } } satisfies Meta<typeof BreadcrumbSchema>
export default meta
type Story = StoryObj<typeof meta>
export const ResourcePath: Story = {}
export const HomepageNoop: Story = { parameters: { nextjs: { navigation: { pathname: '/' } } } }
