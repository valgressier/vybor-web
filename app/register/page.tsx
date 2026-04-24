'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth';

const CURRENT_YEAR = new Date().getFullYear();
const BIRTH_YEARS = Array.from({ length: 80 }, (_, i) => CURRENT_YEAR - 13 - i);

export default function RegisterPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [gender, setGender] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  useEffect(() => {
    if (!authLoading && user) router.push('/feed');
  }, [user, authLoading, router]);

  const handleUsernameChange = (val: string) => {
    const clean = val.replace(/[^a-z0-9_]/gi, '').toLowerCase().slice(0, 30);
    setUsername(clean);
    setUsernameAvailable(null);
    if (clean.length >= 3) {
      checkUsernameAvailability(clean);
    }
  };

  const checkUsernameAvailability = async (uname: string) => {
    setCheckingUsername(true);
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', uname)
      .maybeSingle();
    setUsernameAvailable(!data);
    setCheckingUsername(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!acceptTerms) {
      setError("Veuillez accepter les conditions d'utilisation.");
      return;
    }
    if (!usernameAvailable) {
      setError("Ce nom d'utilisateur est déjà pris.");
      return;
    }
    if (username.length < 3) {
      setError("Le nom d'utilisateur doit faire au moins 3 caractères.");
      return;
    }
    if (password.length < 6) {
      setError('Le mot de passe doit faire au moins 6 caractères.');
      return;
    }

    setLoading(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { username },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      // Create profile
      await supabase.from('profiles').upsert({
        id: data.user.id,
        username,
        birth_year: birthYear ? parseInt(birthYear) : null,
        gender: gender || null,
        onboarding_completed: false,
      });
    }

    setSuccess(true);
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

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#0D0D14]">
        <div className="w-full max-w-sm text-center">
          <div className="text-6xl mb-6">🎉</div>
          <h2 className="text-white font-bold text-2xl mb-3">Vérifiez votre email</h2>
          <p className="text-[#8B8BAD] text-sm mb-6 leading-relaxed">
            Un email de confirmation a été envoyé à <strong className="text-white">{email}</strong>.
            Cliquez sur le lien pour activer votre compte.
          </p>
          <Link
            href="/login"
            className="inline-block px-6 py-3 rounded-xl font-semibold text-sm text-white hover:opacity-90 transition-all"
            style={{ background: 'linear-gradient(135deg, #FF4D6A, #8B5CF6)' }}
          >
            Retour à la connexion
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0D0D14]">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
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
          <p className="text-[#555575] text-sm mt-2">Créez votre compte</p>
        </div>

        <div className="bg-[#16161F] border border-[#252538] rounded-2xl p-6">
          {error && (
            <div className="mb-4 p-3 bg-[#FF4D6A]/10 border border-[#FF4D6A]/30 rounded-xl text-sm text-[#FF4D6A]">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#8B8BAD] mb-1.5 uppercase tracking-wider">
                Nom d'utilisateur
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  placeholder="mon_pseudo"
                  required
                  autoComplete="username"
                  className="w-full bg-[#1E1E2D] border border-[#252538] rounded-xl px-4 py-3 pr-10 text-sm text-white placeholder-[#555575] focus:outline-none focus:border-[#FF4D6A]/50 transition-colors"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm">
                  {checkingUsername && <span className="text-[#555575]">...</span>}
                  {!checkingUsername && usernameAvailable === true && (
                    <span className="text-[#3ECFA8]">✓</span>
                  )}
                  {!checkingUsername && usernameAvailable === false && (
                    <span className="text-[#FF4D6A]">✗</span>
                  )}
                </span>
              </div>
              {usernameAvailable === false && (
                <p className="mt-1 text-xs text-[#FF4D6A]">Ce nom d'utilisateur est déjà pris</p>
              )}
              {usernameAvailable === true && (
                <p className="mt-1 text-xs text-[#3ECFA8]">Disponible !</p>
              )}
            </div>

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
                  placeholder="Min. 6 caractères"
                  required
                  autoComplete="new-password"
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
            </div>

            {/* Optional fields */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#8B8BAD] mb-1.5 uppercase tracking-wider">
                  Naissance
                </label>
                <select
                  value={birthYear}
                  onChange={(e) => setBirthYear(e.target.value)}
                  className="w-full bg-[#1E1E2D] border border-[#252538] rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-[#FF4D6A]/50 transition-colors appearance-none"
                >
                  <option value="">Année</option>
                  {BIRTH_YEARS.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8B8BAD] mb-1.5 uppercase tracking-wider">
                  Genre
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full bg-[#1E1E2D] border border-[#252538] rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-[#FF4D6A]/50 transition-colors appearance-none"
                >
                  <option value="">Optionnel</option>
                  <option value="homme">Homme</option>
                  <option value="femme">Femme</option>
                  <option value="autre">Autre</option>
                </select>
              </div>
            </div>

            {/* Terms */}
            <label className="flex items-start gap-3 cursor-pointer">
              <div className="flex-shrink-0 mt-0.5">
                <div
                  onClick={() => setAcceptTerms((v) => !v)}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors cursor-pointer ${
                    acceptTerms
                      ? 'border-[#FF4D6A] bg-[#FF4D6A]'
                      : 'border-[#252538] bg-[#1E1E2D]'
                  }`}
                >
                  {acceptTerms && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-xs text-[#8B8BAD] leading-relaxed">
                J'accepte les{' '}
                <a href="#" className="text-[#FF4D6A] hover:underline">
                  conditions d'utilisation
                </a>{' '}
                et la{' '}
                <a href="#" className="text-[#FF4D6A] hover:underline">
                  politique de confidentialité
                </a>
              </span>
            </label>

            <button
              type="submit"
              disabled={loading || !acceptTerms}
              className="w-full py-3 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-50 hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #FF4D6A, #8B5CF6)' }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Inscription...
                </span>
              ) : (
                'Créer mon compte'
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
          Déjà un compte ?{' '}
          <Link href="/login" className="text-[#FF4D6A] hover:underline font-medium">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
