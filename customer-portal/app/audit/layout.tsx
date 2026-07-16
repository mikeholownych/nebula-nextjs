'use client';

import Breadcrumb from '@/app/components/Breadcrumb';

export default function AuditLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Breadcrumb />
      {children}
    </>
  );
}
