'use client';

export default function RootBreadcrumbLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Breadcrumb renders via section layouts (learning-centre, audit)
  // This wrapper is for catch-all routes
  return <>{children}</>;
}
