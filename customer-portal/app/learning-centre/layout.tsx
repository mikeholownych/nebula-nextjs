'use client';

import Breadcrumb from '@/app/components/Breadcrumb';

export default function LearningCentreLayout({
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