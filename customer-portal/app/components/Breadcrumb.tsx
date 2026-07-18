'use client';

import Link from 'next/link';
import { createBreadcrumbSchema } from '../lib/schema';
import { usePathname } from 'next/navigation';

interface BreadcrumbItem {
  name: string;
  url: string;
  isUuid?: boolean;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
  className?: string;
}

const ROUTE_LABELS: Record<string, string> = {
  'learning-centre': 'Learning Centre',
  'about': 'About',
  'pricing': 'Pricing',
  'audit': 'Audit',
  'terms': 'Terms',
  'privacy-policy': 'Privacy Policy',
  'thank-you': 'Thank You',
  'unsubscribe': 'Unsubscribe',
};

function slugToLabel(slug: string): string {
  // If it looks like a UUID, truncate it for display
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug)) {
    return slug.split('-')[0].toUpperCase();
  }
  return ROUTE_LABELS[slug] || slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function isUuid(slug: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
}

export default function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  const pathname = usePathname();
  
  // Auto-generate breadcrumbs from path if not provided
  let breadcrumbItems: BreadcrumbItem[] = items || [];
  
  if (!items && pathname !== '/') {
    const segments = pathname.split('/').filter(Boolean);
    let currentPath = '';
    
    breadcrumbItems = segments.map((segment, _index) => {
      currentPath += `/${segment}`;
      return {
        name: slugToLabel(segment),
        url: currentPath,
        isUuid: isUuid(segment),
      };
    });
  }
  
  // Always prepend Home
  breadcrumbItems = [{ name: 'Home', url: '/' }, ...breadcrumbItems];
  
  const schema = createBreadcrumbSchema(breadcrumbItems);
  
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <nav aria-label="Breadcrumb" className={`text-sm py-3 ${className}`}>
        <ol className="flex items-center flex-wrap gap-1.5 text-[#9aa7bd]">
          {breadcrumbItems.map((item, index) => {
            const isLast = index === breadcrumbItems.length - 1;
            return (
              <li key={item.url} className="flex items-center">
                {index > 0 && (
                  <span className="mx-2 text-[#374151]" aria-hidden="true">/</span>
                )}
                {isLast || item.isUuid ? (
                  <span className="text-[#f5f7fb] font-medium" aria-current={isLast ? 'page' : undefined}>
                    {item.name}
                  </span>
                ) : (
                  <Link
                    href={item.url}
                    className="hover:text-[#79f2c0] transition-colors duration-150"
                  >
                    {item.name}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
