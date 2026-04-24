import type { Metadata } from 'next';
import { HomeClient } from '@/components/HomeClient';

export const metadata: Metadata = {
  title: 'Vybor - Donnez votre avis en un tap',
  description: "Créez des sondages, votez sur des questions de société, d'amour, de tech et plus encore.",
};

export default function Home() {
  return <HomeClient />;
}
