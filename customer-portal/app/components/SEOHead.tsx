'use client';

import { usePathname } from 'next/navigation';
import Breadcrumb from './Breadcrumb';
import { createBreadcrumbSchema, createArticleSchema, createFAQPageSchema } from '../lib/schema';

interface SEOHeadProps {
  type?: 'page' | 'article' | 'faq';
  title?: string;
  description?: string;
  publishedDate?: string;
  showBreadcrumb?: boolean;
  faqItems?: Array<{ question: string; answer: string }>;
}

export default function SEOHead({ 
  type = 'page', 
  title, 
  description,
  publishedDate,
  showBreadcrumb = true,
  faqItems = [],
}: SEOHeadProps) {
  const pathname = usePathname();
  const url = `https://nebulacomponents.shop${pathname}`;
  
  // Generate schema based on type
  const schemas: object[] = [];
  
  // Always add breadcrumb schema
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbItems = [
    { name: 'Home', url: '/' },
    ...segments.map((seg, i) => ({
      name: seg.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      url: '/' + segments.slice(0, i + 1).join('/'),
    })),
  ];
  schemas.push(createBreadcrumbSchema(breadcrumbItems));
  
  // Add article schema for article type
  if (type === 'article' && title) {
    schemas.push(createArticleSchema({
      headline: title,
      description: description || '',
      url,
      publishedDate: publishedDate || new Date().toISOString().split('T')[0],
      modifiedDate: new Date().toISOString().split('T')[0],
      authorName: 'Mike H',
      authorUrl: 'https://nebulacomponents.shop/about/team',
    }));
  }
  
  // Add FAQ schema if provided
  if (type === 'faq' && faqItems.length > 0) {
    schemas.push(createFAQPageSchema(faqItems));
  }
  
  return (
    <>
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      {showBreadcrumb && pathname !== '/' && <Breadcrumb />}
    </>
  );
}
