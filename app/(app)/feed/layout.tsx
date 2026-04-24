import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Vybor - Découvrez les opinions',
};

export default function FeedLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
