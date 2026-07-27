'use client';

import { usePathname } from 'next/navigation';
import { createBreadcrumbSchema } from '../lib/schema';

const ROUTE_LABELS: Record<string, string> = {
  'learning-centre': 'Learning Centre',
  'playbooks': 'Playbooks',
  'resources': 'Resources',
  'citable': 'Citable',
  'about': 'About',
  'team': 'Team',
};

function slugToLabel(slug: string): string {
  return ROUTE_LABELS[slug] || slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Emits only the BreadcrumbList JSON-LD for the current path — no visible
// <nav>. Used in shared layouts (e.g. /learning-centre, /resources/citable)
// where several individual pages already render their own visual breadcrumb
// markup; rendering a second one there would duplicate the UI. Schema
// presence alone is enough for the BreadcrumbList rich-result eligibility.
export default function BreadcrumbSchema() {
  const pathname = usePathname();
  if (!pathname || pathname === '/') return null;

  const segments = pathname.split('/').filter(Boolean);
  let currentPath = '';
  const items = [
    { name: 'Home', url: 'https://nebulacomponents.shop/' },
    ...segments.map((segment) => {
      currentPath += `/${segment}`;
      return { name: slugToLabel(segment), url: `https://nebulacomponents.shop${currentPath}` };
    }),
  ];

  const schema = createBreadcrumbSchema(items);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
