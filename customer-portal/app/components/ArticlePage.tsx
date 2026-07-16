'use client';

import { usePathname } from 'next/navigation';
import Breadcrumb from './Breadcrumb';
import { createArticleSchema } from '@/app/lib/schema';

interface ArticlePageProps {
  title: string;
  description: string;
  publishedDate?: string;
  children: React.ReactNode;
}

export default function ArticlePage({
  title,
  description,
  publishedDate,
  children,
}: ArticlePageProps) {
  const pathname = usePathname();
  const url = `https://nebulacomponents.shop${pathname}`;

  const articleSchema = createArticleSchema({
    headline: title,
    description,
    url,
    publishedDate: publishedDate || new Date().toISOString(),
    authorName: 'Mike H',
    authorUrl: 'https://nebulacomponents.shop/about/team',
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <Breadcrumb />
      <article>
        {children}
      </article>
    </>
  );
}
