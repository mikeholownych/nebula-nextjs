import type { Meta, StoryObj } from '@storybook/nextjs'
import ArticlePage from '@/app/components/ArticlePage'
const meta = { title: 'Tier 2/ArticlePage', component: ArticlePage, tags: ['autodocs'], parameters: { nextjs: { navigation: { pathname: '/learning-centre/example' } }, docs: { description: { component: 'Article layout that emits article JSON-LD and shared breadcrumbs around caller-provided article content.' } } } } satisfies Meta<typeof ArticlePage>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = { args: { title: 'Evidence-led landing pages', description: 'A bounded article description.', publishedDate: '2026-08-06', children: <div className="prose prose-invert"><p>Article body content belongs to the route.</p></div> } }
