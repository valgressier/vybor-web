import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#0D0D14]">
      <div className="text-center max-w-sm">
        {/* Logo */}
        <h1
          className="text-5xl font-extrabold tracking-tight mb-8"
          style={{
            background: 'linear-gradient(135deg, #FF4D6A, #8B5CF6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Vybor
        </h1>

        {/* 404 */}
        <p
          className="text-8xl font-extrabold mb-4 leading-none"
          style={{
            background: 'linear-gradient(135deg, #FF4D6A, #8B5CF6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          404
        </p>

        <p className="text-white font-semibold text-xl mb-2">
          Cette page n&apos;existe pas
        </p>
        <p className="text-[#555575] text-sm mb-10">
          Le lien est peut-être incorrect ou la page a été supprimée.
        </p>

        <Link
          href="/feed"
          className="inline-flex items-center gap-2 px-7 py-3 rounded-2xl font-semibold text-sm text-white transition-all hover:opacity-90 hover:scale-105 active:scale-95"
          style={{ background: 'linear-gradient(135deg, #FF4D6A, #8B5CF6)' }}
        >
          Retour au feed
        </Link>
      </div>
    </div>
  );
}
