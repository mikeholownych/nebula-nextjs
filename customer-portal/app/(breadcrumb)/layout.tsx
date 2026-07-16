'use client';

import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';

const Breadcrumb = dynamic(() => import('@/app/components/Breadcrumb'), { ssr: false });

export default function BreadcrumbLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Breadcrumb renders via section layouts (learning-centre, audit)
  // This wrapper is for catch-all routes
  return <>{children}</>;
}
