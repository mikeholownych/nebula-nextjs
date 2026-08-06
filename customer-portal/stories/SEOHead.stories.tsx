import type { Meta, StoryObj } from '@storybook/nextjs'
import SEOHead from '@/app/components/SEOHead'
const meta = { title: 'Tier 2/SEOHead', component: SEOHead, tags: ['autodocs'], parameters: { nextjs: { navigation: { pathname: '/about' } }, docs: { description: { component: 'Schema-producing SEO boundary with page, article, FAQ, breadcrumb, and optional visible breadcrumb variants.' } } } } satisfies Meta<typeof SEOHead>
export default meta
type Story = StoryObj<typeof meta>
export const Page: Story = { args: { title: 'About Nebula', description: 'Evidence-backed landing page audits.' } }
export const Article: Story = { args: { type: 'article', title: 'Article title', description: 'Article description.', publishedDate: '2026-08-06' } }
export const FAQ: Story = { args: { type: 'faq', faqItems: [{ question: 'What is measured?', answer: 'Only bounded checks with published evidence.' }] } }
