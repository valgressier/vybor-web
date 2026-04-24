'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function ResetPasswordPage() {
  const router = useRouter();

  // Step 1: send email  |  Step 2: update password (recovery session active)
  const [step, setStep] = useState<'request' | 'update'>('request');

  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  // Supabase fires PASSWORD_RECOVERY when the user arrives via the reset link
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setStep('update');
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  /* ── Step 1: request reset email ───────────────────────────── */
  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setError('');
    setLoading(true);

    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: 'https://vybor.app/reset-password',
    });

    setLoading(false);
    if (err) {
      setError(err.message);
    } else {
      setEmailSent(true);
    }
  };

  /* ── Step 2: set new password ───────────────────────────────── */
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Le mot de passe doit faire au moins 6 caractères.');
      return;
    }
    setError('');
    setLoading(true);

    const { error: err } = await supabase.auth.updateUser({ password: newPassword });

    setLoading(false);
    if (err) {
      setError(err.message);
    } else {
      // Sign out so the user logs back in cleanly
      await supabase.auth.signOut();
      router.push('/login?message=password-updated');
    }
  };

  /* ── Email sent confirmation ────────────────────────────────── */
  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#0D0D14]">
        <div className="w-full max-w-sm text-center">
          <div className="text-6xl mb-6">📧</div>
          <h2 className="text-white font-bold text-2xl mb-3">Email envoyé !</h2>
          <p className="text-[#8B8BAD] text-sm mb-2 leading-relaxed">
            Un lien de réinitialisation a été envoyé à{' '}
            <strong className="text-white">{email}</strong>.
          </p>
          <p className="text-[#555575] text-xs mb-8">
            Vérifiez également votre dossier spam.
          </p>
          <Link
            href="/login"
            className="inline-block px-6 py-3 rounded-xl font-semibold text-sm text-[#FF4D6A] border border-[#FF4D6A]/30 hover:bg-[#FF4D6A]/10 transition-colors"
          >
            Retour à la connexion
          </Link>
        </div>
      </div>
    );
  }

  /* ── Step 2: update password form ──────────────────────────── */
  if (step === 'update') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#0D0D14]">
        <div className="w-full max-w-sm">
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
          </div>

          <div className="bg-[#16161F] border border-[#252538] rounded-2xl p-6">
            <div className="text-3xl mb-4">🔐</div>
            <h2 className="text-white font-bold text-xl mb-2">Nouveau mot de passe</h2>
            <p className="text-[#555575] text-sm mb-6">
              Choisissez un nouveau mot de passe sécurisé.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-[#FF4D6A]/10 border border-[#FF4D6A]/30 rounded-xl text-sm text-[#FF4D6A]">
                {error}
              </div>
            )}

            <form onSubmit={handleUpdate} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#8B8BAD] mb-1.5 uppercase tracking-wider">
                  Nouveau mot de passe
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 6 caractères"
                  required
                  autoFocus
                  className="w-full bg-[#1E1E2D] border border-[#252538] rounded-xl px-4 py-3 text-sm text-white placeholder-[#555575] focus:outline-none focus:border-[#FF4D6A]/50 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8B8BAD] mb-1.5 uppercase tracking-wider">
                  Confirmer le mot de passe
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Répétez le mot de passe"
                  required
                  className="w-full bg-[#1E1E2D] border border-[#252538] rounded-xl px-4 py-3 text-sm text-white placeholder-[#555575] focus:outline-none focus:border-[#FF4D6A]/50 transition-colors"
                />
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
                    Mise à jour...
                  </span>
                ) : (
                  'Mettre à jour le mot de passe'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  /* ── Step 1: request form ───────────────────────────────────── */
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0D0D14]">
      <div className="w-full max-w-sm">
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
          <p className="text-[#555575] text-sm mt-2">Partagez vos opinions</p>
        </div>

        <div className="bg-[#16161F] border border-[#252538] rounded-2xl p-6">
          <div className="text-3xl mb-4">🔑</div>
          <h2 className="text-white font-bold text-xl mb-2">Mot de passe oublié ?</h2>
          <p className="text-[#555575] text-sm mb-6 leading-relaxed">
            Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-[#FF4D6A]/10 border border-[#FF4D6A]/30 rounded-xl text-sm text-[#FF4D6A]">
              {error}
            </div>
          )}

          <form onSubmit={handleRequest} className="flex flex-col gap-4">
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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-50 hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #FF4D6A, #8B5CF6)' }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Envoi...
                </span>
              ) : (
                'Envoyer le lien'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-[#555575] mt-6">
          <Link href="/login" className="text-[#FF4D6A] hover:underline font-medium">
            ← Retour à la connexion
          </Link>
        </p>
      </div>
    </div>
  );
}
