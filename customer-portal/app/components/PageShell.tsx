'use client';

import { usePathname } from 'next/navigation';
import Breadcrumb from './Breadcrumb';

export default function PageShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Don't show breadcrumb on homepage
  if (pathname === '/') {
    return <>{children}</>;
  }

  return (
    <>
      <Breadcrumb />
      {children}
    </>
  );
}
