'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth';

function LoginContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const successMessage = searchParams.get('message') === 'password-updated'
    ? 'Mot de passe mis à jour avec succès. Connectez-vous.'
    : null;

  useEffect(() => {
    if (!authLoading && user) router.push('/feed');
  }, [user, authLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setError('');
    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setError(
        signInError.message === 'Invalid login credentials'
          ? 'Email ou mot de passe incorrect.'
          : signInError.message
      );
    } else {
      router.push('/feed');
    }

    setLoading(false);
  };

  const handleGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/feed`,
      },
    });
    if (error) setError(error.message);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-[#FF4D6A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0D0D14]">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1
            className="text-5xl font-extrabold tracking-tight"
            style={{
              background: 'linear-gradient(135deg, #FF4D6A, #8B5CF6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Vybor
          </h1>
          <p className="text-[#555575] text-sm mt-2">Partagez vos opinions</p>
        </div>

        <div className="bg-[#16161F] border border-[#252538] rounded-2xl p-6">
          <h2 className="text-white font-bold text-xl mb-6">Connexion</h2>

          {successMessage && (
            <div className="mb-4 p-3 bg-[#3ECFA8]/10 border border-[#3ECFA8]/30 rounded-xl text-sm text-[#3ECFA8]">
              {successMessage}
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-[#FF4D6A]/10 border border-[#FF4D6A]/30 rounded-xl text-sm text-[#FF4D6A]">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#8B8BAD] mb-1.5 uppercase tracking-wider">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                required
                autoComplete="email"
                className="w-full bg-[#1E1E2D] border border-[#252538] rounded-xl px-4 py-3 text-sm text-white placeholder-[#555575] focus:outline-none focus:border-[#FF4D6A]/50 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#8B8BAD] mb-1.5 uppercase tracking-wider">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full bg-[#1E1E2D] border border-[#252538] rounded-xl px-4 py-3 pr-12 text-sm text-white placeholder-[#555575] focus:outline-none focus:border-[#FF4D6A]/50 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555575] hover:text-white transition-colors text-sm"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              <div className="flex justify-end mt-1">
                <Link
                  href="/reset-password"
                  className="text-xs text-[#7B61FF] hover:underline"
                >
                  Mot de passe oublié ?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-50 hover:opacity-90 mt-1"
              style={{ background: 'linear-gradient(135deg, #FF4D6A, #8B5CF6)' }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Connexion...
                </span>
              ) : (
                'Se connecter'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-[#252538]" />
            <span className="text-xs text-[#555575]">ou</span>
            <div className="flex-1 h-px bg-[#252538]" />
          </div>

          {/* Google OAuth */}
          <button
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-[#252538] text-sm font-medium text-white hover:bg-[#1E1E2D] transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#4285F4" d="M43.6 20.5H24v7h11.1c-1.1 5.1-5.6 8.5-11.1 8.5-6.6 0-12-5.4-12-12s5.4-12 12-12c2.9 0 5.5 1 7.6 2.8l5.2-5.2C33.5 6.5 29 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5c10.1 0 18.9-7.3 18.9-19.5 0-1.2-.1-2.3-.3-3.5z" />
              <path fill="#34A853" d="M6.3 14.7l6.6 4.8C14.5 15.4 19 12 24 12c2.9 0 5.5 1 7.6 2.8l5.2-5.2C33.5 6.5 29 4.5 24 4.5c-7.8 0-14.5 4.5-17.7 10.2z" />
              <path fill="#FBBC05" d="M24 43.5c4.9 0 9.4-1.8 12.8-4.8l-6.1-5c-1.8 1.2-4.1 1.9-6.7 1.9-5.4 0-9.9-3.4-11.1-8.5l-6.6 5C9.5 39 16.3 43.5 24 43.5z" />
              <path fill="#EA4335" d="M43.6 20.5H24v7h11.1c-.5 2.5-2.1 4.7-4.3 6.2l6.1 5c3.5-3.3 5.6-8.1 5.6-13.7 0-1.2-.1-2.3-.3-3.5z" />
            </svg>
            Continuer avec Google
          </button>
        </div>

        <p className="text-center text-sm text-[#555575] mt-6">
          Pas encore de compte ?{' '}
          <Link href="/register" className="text-[#FF4D6A] hover:underline font-medium">
            S&apos;inscrire
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
