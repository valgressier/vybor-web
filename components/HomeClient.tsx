'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/context/auth';

export function HomeClient() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace('/feed');
  }, [user, loading, router]);

  // Show nothing while checking auth (avoids flash of landing page)
  if (loading || user) return null;

  return (
    <main className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-black/10 bg-white/90 backdrop-blur sticky top-0 z-10">
        <span
          className="text-2xl font-extrabold tracking-tight"
          style={{
            background: 'linear-gradient(135deg, #FF4D6A, #8B5CF6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Vybor
        </span>
        <div className="flex items-center gap-3">
          <a
            href="/login"
            className="px-4 py-2 rounded-xl text-sm font-semibold text-[#1a1a2e] border border-[#d1d5db] hover:border-[#9ca3af] transition-colors"
          >
            Se connecter
          </a>
          <a
            href="/register"
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
            style={{ background: 'linear-gradient(135deg, #FF4D6A, #8B5CF6)' }}
          >
            S&apos;inscrire
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center flex-1 overflow-hidden px-6 py-24 text-center">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(255,77,106,0.25) 0%, rgba(139,92,246,0.15) 50%, transparent 100%)',
          }}
        />

        {/* Logo */}
        <div className="relative mb-8 flex items-center justify-center">
          <div
            className="absolute inset-0 rounded-3xl blur-2xl opacity-60"
            style={{ background: 'linear-gradient(135deg, #FF4D6A, #8B5CF6)' }}
          />
          <div className="relative rounded-3xl overflow-hidden shadow-2xl w-28 h-28 border border-white/10">
            <Image src="/icon.png" alt="Vybor logo" fill className="object-cover" priority />
          </div>
        </div>

        <h1
          className="text-6xl sm:text-7xl font-extrabold tracking-tight mb-4"
          style={{
            background: 'linear-gradient(135deg, #FF4D6A 0%, #8B5CF6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Vybor
        </h1>

        <p className="text-xl sm:text-2xl font-medium text-white/90 mb-4 max-w-lg">
          Partagez vos opinions, découvrez celles des autres.
        </p>
        <p className="text-base text-[#8B8BAD] max-w-md mb-12 leading-relaxed">
          Créez des sondages, votez sur des questions de société, d&apos;amour,
          de tech et bien plus encore — et connectez-vous avec une communauté
          qui pense comme vous.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <a
            href="https://play.google.com/store/apps/details?id=app.vybor"
            className="group relative flex items-center gap-3 px-7 py-4 rounded-2xl font-semibold text-white transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
            style={{ background: 'linear-gradient(135deg, #FF4D6A 0%, #8B5CF6 100%)' }}
          >
            <svg viewBox="0 0 24 24" className="w-6 h-6 flex-shrink-0" fill="currentColor" aria-hidden>
              <path d="M3.18 23.76c.31.17.67.19 1 .07l11.51-6.65-2.43-2.43-10.08 9.01zm-1.18-20.9v18.28c0 .55.3 1.03.76 1.3l.06.03 10.23-10.23v-.24L2.82 1.53l-.06.04C2.3 1.83 2 2.31 2 2.86zm17.56 9.1-2.6-1.5-2.73 2.73 2.73 2.73 2.62-1.52c.75-.43.75-1.51-.02-1.94zM4.18.18l11.51 6.65-2.43 2.43L3.18.24C3.49.07 3.87.05 4.18.18z" />
            </svg>
            <span>Télécharger sur Android</span>
          </a>

          <div className="flex items-center gap-3 px-7 py-4 rounded-2xl font-semibold text-[#8B8BAD] border border-[#252538] bg-[#16161F] cursor-not-allowed select-none">
            <svg viewBox="0 0 24 24" className="w-6 h-6 flex-shrink-0" fill="currentColor" aria-hidden>
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
            </svg>
            <span>Bientôt sur iOS</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20 max-w-5xl mx-auto w-full">
        <h2 className="text-3xl sm:text-4xl font-bold text-center text-white mb-4">
          Pourquoi Vybor ?
        </h2>
        <p className="text-center text-[#8B8BAD] mb-14 max-w-xl mx-auto">
          Une app pensée pour l&apos;expression libre et la découverte d&apos;opinions authentiques.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-[#252538] bg-[#16161F] p-6 hover:border-[#FF4D6A]/40 transition-colors duration-200"
            >
              <div
                className="text-3xl mb-4 w-12 h-12 flex items-center justify-center rounded-xl"
                style={{ background: `${f.color}22` }}
              >
                <span>{f.emoji}</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-[#8B8BAD] leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="px-6 py-16 max-w-5xl mx-auto w-full">
        <h2 className="text-2xl font-bold text-center text-white mb-10">
          Des sujets pour tous les goûts
        </h2>
        <div className="flex flex-wrap justify-center gap-3">
          {categories.map((c) => (
            <span
              key={c.label}
              className="px-5 py-2.5 rounded-full text-sm font-medium"
              style={{
                background: `${c.color}1A`,
                color: c.color,
                border: `1px solid ${c.color}40`,
              }}
            >
              {c.emoji} {c.label}
            </span>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative px-6 py-24 text-center overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 70% 60% at 50% 100%, rgba(139,92,246,0.2) 0%, transparent 70%)',
          }}
        />
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 relative">
          Rejoignez la communauté Vybor
        </h2>
        <p className="text-[#8B8BAD] mb-10 max-w-md mx-auto relative">
          Disponible gratuitement sur Android. iOS arrive bientôt.
        </p>
        <a
          href="https://play.google.com/store/apps/details?id=app.vybor"
          className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-semibold text-white text-lg transition-all duration-200 hover:scale-105 active:scale-95 shadow-xl relative"
          style={{ background: 'linear-gradient(135deg, #FF4D6A 0%, #8B5CF6 100%)' }}
        >
          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor" aria-hidden>
            <path d="M3.18 23.76c.31.17.67.19 1 .07l11.51-6.65-2.43-2.43-10.08 9.01zm-1.18-20.9v18.28c0 .55.3 1.03.76 1.3l.06.03 10.23-10.23v-.24L2.82 1.53l-.06.04C2.3 1.83 2 2.31 2 2.86zm17.56 9.1-2.6-1.5-2.73 2.73 2.73 2.73 2.62-1.52c.75-.43.75-1.51-.02-1.94zM4.18.18l11.51 6.65-2.43 2.43L3.18.24C3.49.07 3.87.05 4.18.18z" />
          </svg>
          Télécharger gratuitement
        </a>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#252538] px-6 py-8 text-center text-sm text-[#555575]">
        <div className="flex flex-wrap justify-center gap-5 mb-3">
          <a href="/cgu" className="hover:text-white transition-colors">Conditions d&apos;utilisation</a>
          <a href="/privacy" className="hover:text-white transition-colors">Politique de confidentialité</a>
          <a href="mailto:admin@vybor.app" className="hover:text-white transition-colors">Contact</a>
        </div>
        <p>© {new Date().getFullYear()} Vybor — Valentin Gressier</p>
      </footer>
    </main>
  );
}

const features = [
  { emoji: '🗳️', title: 'Sondages express', description: "Créez des questions Oui/Non, à choix multiples ou sur une échelle en quelques secondes.", color: '#FF4D6A' },
  { emoji: '🔒', title: 'Confidentialité flexible', description: 'Partagez publiquement, avec vos abonnés ou dans des groupes privés.', color: '#7B61FF' },
  { emoji: '💬', title: 'Discussions riches', description: "Commentez, débattez et échangez en messages privés avec d'autres utilisateurs.", color: '#3ECFA8' },
  { emoji: '🔔', title: 'Notifications en temps réel', description: 'Suivez vos votes, nouveaux abonnés et réponses instantanément.', color: '#FFB84D' },
  { emoji: '👥', title: 'Groupes thématiques', description: "Rejoignez ou créez des groupes pour partager des opinions avec une communauté ciblée.", color: '#3E9EFF' },
  { emoji: '📊', title: 'Résultats en direct', description: 'Visualisez les tendances et statistiques de vos sondages en temps réel.', color: '#8B5CF6' },
];

const categories = [
  { emoji: '🏛️', label: 'Société', color: '#7B61FF' },
  { emoji: '❤️', label: 'Amour', color: '#FF4D6A' },
  { emoji: '💻', label: 'Tech', color: '#3E9EFF' },
  { emoji: '⚽', label: 'Sport', color: '#3ECFA8' },
  { emoji: '🎬', label: 'Divertissement', color: '#FFB84D' },
  { emoji: '✨', label: 'Autre', color: '#8B8BAD' },
];
