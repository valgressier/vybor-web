import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Question sur Vybor',
};

export default function QuestionLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
