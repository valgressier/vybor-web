'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth';
import { useTheme } from '@/context/theme';
import { Avatar } from '@/components/Avatar';
import { Profile } from '@/types';

const COUNTRIES = [
  'France', 'Belgique', 'Suisse', 'Canada', 'Maroc', 'Algérie', 'Tunisie',
  'Sénégal', 'Côte d\'Ivoire', 'Congo', 'Cameroun', 'Autre',
];

const CURRENT_YEAR = new Date().getFullYear();
const BIRTH_YEARS = Array.from({ length: 80 }, (_, i) => CURRENT_YEAR - 13 - i);

type Section = 'profile' | 'privacy' | 'notifications' | 'account';

type EditField = 'username' | 'country' | 'gender' | 'birth_year';

export default function SettingsPage() {
  const { user, profile, refreshProfile, signOut, loading: authLoading } = useAuth();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [section, setSection] = useState<Section>('profile');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [passwordResetSent, setPasswordResetSent] = useState(false);
  const [editModal, setEditModal] = useState<EditField | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const [form, setForm] = useState<Partial<Profile>>({});

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (profile) {
      setForm({
        username: profile.username,
        bio: profile.bio ?? '',
        website_url: profile.website_url ?? '',
        country: profile.country ?? '',
        birth_year: profile.birth_year ?? null,
        gender: profile.gender ?? null,
        avatar_url: profile.avatar_url ?? '',
        is_private: profile.is_private ?? false,
        privacy_answers: profile.privacy_answers ?? 'public',
        privacy_questions: profile.privacy_questions ?? 'public',
        privacy_follows: profile.privacy_follows ?? false,
        privacy_groups: profile.privacy_groups ?? false,
        notifications_enabled: profile.notifications_enabled ?? true,
        notif_new_follower: profile.notif_new_follower ?? true,
        notif_question_answers: profile.notif_question_answers ?? true,
        notif_new_question: profile.notif_new_question ?? true,
        notif_comments: profile.notif_comments ?? true,
        notif_messages: profile.notif_messages ?? true,
        notif_follow_requests: profile.notif_follow_requests ?? true,
        notif_mentions: profile.notif_mentions ?? true,
      });
    }
  }, [profile]);

  const isUsernameLocked = () => {
    if (!profile?.username_changed_at) return false;
    const changedAt = new Date(profile.username_changed_at);
    const diff = Date.now() - changedAt.getTime();
    return diff < 30 * 24 * 60 * 60 * 1000;
  };

  const getDaysUntilUsernameChange = () => {
    if (!profile?.username_changed_at) return 0;
    const changedAt = new Date(profile.username_changed_at);
    const unlockDate = new Date(changedAt.getTime() + 30 * 24 * 60 * 60 * 1000);
    return Math.ceil((unlockDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
  };

  const checkUsername = async (username: string) => {
    if (username === profile?.username) {
      setUsernameAvailable(null);
      return;
    }
    if (username.length < 3) return;
    setCheckingUsername(true);
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .maybeSingle();
    setUsernameAvailable(!data);
    setCheckingUsername(false);
  };

  const handleUsernameChange = (val: string) => {
    const clean = val.replace(/[^a-z0-9_]/gi, '').toLowerCase().slice(0, 30);
    setForm((f) => ({ ...f, username: clean }));
    if (clean.length >= 3) checkUsername(clean);
    else setUsernameAvailable(null);
  };

  const updateField = <K extends keyof Profile>(key: K, value: Profile[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const saveProfile = async () => {
    if (!user || saving) return;
    setError('');
    setSaving(true);

    const updates: Partial<Profile> = { ...form };

    // Check if username changed
    if (form.username !== profile?.username) {
      if (!usernameAvailable) {
        setError("Ce nom d'utilisateur est déjà pris.");
        setSaving(false);
        return;
      }
      if (!/^[a-z0-9_]{3,30}$/i.test(form.username ?? '')) {
        setError("Le nom d'utilisateur doit contenir entre 3 et 30 caractères alphanumériques.");
        setSaving(false);
        return;
      }
      if (isUsernameLocked()) {
        setError(`Vous ne pouvez pas changer votre nom d'utilisateur avant ${getDaysUntilUsernameChange()} jours.`);
        setSaving(false);
        return;
      }
      updates.username_changed_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (updateError) {
      setError(updateError.message);
    } else {
      await refreshProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  };

  const openEdit = (field: EditField) => {
    const valueMap: Record<EditField, string> = {
      username: form.username ?? '',
      country: form.country ?? '',
      gender: form.gender ?? '',
      birth_year: form.birth_year?.toString() ?? '',
    };
    setEditValue(valueMap[field]);
    setUsernameAvailable(null);
    setEditModal(field);
  };

  const saveModalField = async () => {
    if (!user || saving) return;
    setError('');
    setSaving(true);

    let updates: Partial<Profile> = {};

    if (editModal === 'username') {
      const clean = editValue.replace(/[^a-z0-9_]/gi, '').toLowerCase().slice(0, 30);
      if (clean !== profile?.username) {
        if (!usernameAvailable) { setError("Ce nom d'utilisateur est déjà pris."); setSaving(false); return; }
        if (!/^[a-z0-9_]{3,30}$/i.test(clean)) { setError("Entre 3 et 30 caractères alphanumériques."); setSaving(false); return; }
        if (isUsernameLocked()) { setError(`Changement possible dans ${getDaysUntilUsernameChange()} jours.`); setSaving(false); return; }
        updates = { username: clean, username_changed_at: new Date().toISOString() };
      }
    } else if (editModal === 'country') {
      updates = { country: editValue };
    } else if (editModal === 'gender') {
      updates = { gender: (editValue as Profile['gender']) || null };
    } else if (editModal === 'birth_year') {
      updates = { birth_year: editValue ? parseInt(editValue) : null };
    }

    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase.from('profiles').update(updates).eq('id', user.id);
      if (updateError) { setError(updateError.message); setSaving(false); return; }
      setForm((f) => ({ ...f, ...updates }));
      await refreshProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }

    setSaving(false);
    setEditModal(null);
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (!error) setPasswordResetSent(true);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-[#FF4D6A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || !profile) return null;

  const sections: { key: Section; label: string; icon: string }[] = [
    { key: 'profile', label: 'Profil', icon: '👤' },
    { key: 'privacy', label: 'Confidentialité', icon: '🔒' },
    { key: 'notifications', label: 'Notifications', icon: '🔔' },
    { key: 'account', label: 'Compte', icon: '⚙️' },
  ];

  const GENDER_LABELS: Record<string, string> = { homme: 'Homme', femme: 'Femme', autre: 'Autre', '': 'Non précisé' };

  return (
    <div>
      {/* Edit modal */}
      {editModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-[#16161F] border border-[#252538] rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-bold text-lg">
                Modifier {editModal === 'username' ? 'le nom d\'utilisateur' : editModal === 'country' ? 'le pays' : editModal === 'gender' ? 'le genre' : 'l\'année de naissance'}
              </h2>
              <button onClick={() => setEditModal(null)} className="text-[#8B8BAD] hover:text-white text-xl leading-none">✕</button>
            </div>

            {editModal === 'username' && (
              <div className="mb-4">
                <div className="relative">
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/[^a-z0-9_]/gi, '').toLowerCase().slice(0, 30);
                      setEditValue(clean);
                      if (clean.length >= 3) checkUsername(clean);
                      else setUsernameAvailable(null);
                    }}
                    disabled={isUsernameLocked()}
                    placeholder="username"
                    className="w-full bg-[#1E1E2D] border border-[#252538] rounded-xl px-4 py-3 text-sm text-white placeholder-[#555575] focus:outline-none focus:border-[#FF4D6A]/50 transition-colors disabled:opacity-50"
                  />
                  {checkingUsername && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#555575]">...</span>}
                  {!checkingUsername && usernameAvailable === true && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#3ECFA8]">✓</span>}
                  {!checkingUsername && usernameAvailable === false && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#FF4D6A]">✗</span>}
                </div>
                {isUsernameLocked() && <p className="mt-1 text-xs text-[#FFB84D]">🔒 Changement possible dans {getDaysUntilUsernameChange()} jours</p>}
              </div>
            )}

            {editModal === 'country' && (
              <select
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-full bg-[#1E1E2D] border border-[#252538] rounded-xl px-4 py-3 text-sm text-white mb-4 focus:outline-none focus:border-[#FF4D6A]/50 transition-colors appearance-none"
              >
                <option value="">Sélectionner</option>
                {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            )}

            {editModal === 'gender' && (
              <select
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-full bg-[#1E1E2D] border border-[#252538] rounded-xl px-4 py-3 text-sm text-white mb-4 focus:outline-none focus:border-[#FF4D6A]/50 transition-colors appearance-none"
              >
                <option value="">Non précisé</option>
                <option value="homme">Homme</option>
                <option value="femme">Femme</option>
                <option value="autre">Autre</option>
              </select>
            )}

            {editModal === 'birth_year' && (
              <select
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-full bg-[#1E1E2D] border border-[#252538] rounded-xl px-4 py-3 text-sm text-white mb-4 focus:outline-none focus:border-[#FF4D6A]/50 transition-colors appearance-none"
              >
                <option value="">Non précisée</option>
                {BIRTH_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            )}

            {error && <p className="text-xs text-[#FF4D6A] mb-3">{error}</p>}

            <div className="flex gap-3 mt-2">
              <button
                onClick={() => setEditModal(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-[#8B8BAD] border border-[#252538] hover:border-[#8B8BAD] transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={saveModalField}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #FF4D6A, #8B5CF6)' }}
              >
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      <h1 className="text-2xl font-extrabold text-white mb-6">Paramètres</h1>

      {/* Section tabs */}
      <div className="flex gap-1 mb-6 bg-[#16161F] p-1 rounded-xl border border-[#252538] overflow-x-auto">
        {sections.map((s) => (
          <button
            key={s.key}
            onClick={() => setSection(s.key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
              section === s.key
                ? 'bg-[#FF4D6A] text-white'
                : 'text-[#8B8BAD] hover:text-white'
            }`}
          >
            <span>{s.icon}</span>
            {s.label}
          </button>
        ))}
      </div>

      {/* Save feedback */}
      {saved && (
        <div className="mb-4 p-3 bg-[#3ECFA8]/10 border border-[#3ECFA8]/30 rounded-xl text-sm text-[#3ECFA8] font-medium">
          ✓ Modifications enregistrées
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 bg-[#FF4D6A]/10 border border-[#FF4D6A]/30 rounded-xl text-sm text-[#FF4D6A]">
          {error}
        </div>
      )}

      {/* Profile section */}
      {section === 'profile' && (
        <div className="flex flex-col gap-4">
          {/* Avatar preview */}
          <div className="flex items-center gap-4 p-4 bg-[#16161F] border border-[#252538] rounded-2xl">
            <Avatar uri={form.avatar_url} username={form.username ?? profile.username} size={64} />
            <div className="flex-1">
              <p className="text-white font-semibold text-sm mb-1">Photo de profil</p>
              <p className="text-xs text-[#555575]">Entrez l'URL d'une image</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#8B8BAD] mb-1.5 uppercase tracking-wider">
              URL de l'avatar
            </label>
            <input
              type="url"
              value={form.avatar_url ?? ''}
              onChange={(e) => updateField('avatar_url', e.target.value)}
              placeholder="https://..."
              className="w-full bg-[#16161F] border border-[#252538] rounded-xl px-4 py-3 text-sm text-white placeholder-[#555575] focus:outline-none focus:border-[#FF4D6A]/50 transition-colors"
            />
          </div>

          <ReadOnlyField
            label="Nom d'utilisateur"
            value={`@${form.username ?? profile.username}`}
            onEdit={() => openEdit('username')}
            locked={isUsernameLocked()}
            lockNote={isUsernameLocked() ? `🔒 Changement possible dans ${getDaysUntilUsernameChange()} jours` : undefined}
          />

          <div>
            <label className="block text-xs font-semibold text-[#8B8BAD] mb-1.5 uppercase tracking-wider">
              Bio
            </label>
            <textarea
              value={form.bio ?? ''}
              onChange={(e) => updateField('bio', e.target.value)}
              placeholder="Parlez de vous..."
              rows={3}
              maxLength={200}
              className="w-full bg-[#16161F] border border-[#252538] rounded-xl px-4 py-3 text-sm text-white placeholder-[#555575] resize-none focus:outline-none focus:border-[#FF4D6A]/50 transition-colors"
            />
            <p className="text-xs text-[#555575] text-right mt-1">{(form.bio ?? '').length}/200</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#8B8BAD] mb-1.5 uppercase tracking-wider">
              Site web
            </label>
            <input
              type="url"
              value={form.website_url ?? ''}
              onChange={(e) => updateField('website_url', e.target.value)}
              placeholder="https://..."
              className="w-full bg-[#16161F] border border-[#252538] rounded-xl px-4 py-3 text-sm text-white placeholder-[#555575] focus:outline-none focus:border-[#FF4D6A]/50 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <ReadOnlyField
              label="Pays"
              value={form.country || 'Non précisé'}
              onEdit={() => openEdit('country')}
            />
            <ReadOnlyField
              label="Genre"
              value={GENDER_LABELS[form.gender ?? ''] ?? 'Non précisé'}
              onEdit={() => openEdit('gender')}
            />
          </div>

          <ReadOnlyField
            label="Année de naissance"
            value={form.birth_year?.toString() || 'Non précisée'}
            onEdit={() => openEdit('birth_year')}
          />

          <button
            onClick={saveProfile}
            disabled={saving}
            className="w-full py-3 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-50 hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #FF4D6A, #8B5CF6)' }}
          >
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      )}

      {/* Privacy section */}
      {section === 'privacy' && (
        <div className="flex flex-col gap-4">
          <ToggleRow
            label="Compte privé"
            description="Seuls vos abonnés approuvés peuvent voir vos questions"
            value={form.is_private ?? false}
            onChange={(v) => updateField('is_private', v)}
          />

          <div>
            <label className="block text-xs font-semibold text-[#8B8BAD] mb-2 uppercase tracking-wider">
              Qui peut voir mes réponses ?
            </label>
            <div className="flex flex-col gap-2">
              {(['public', 'followers', 'none'] as const).map((opt) => (
                <button
                  key={opt}
                  onClick={() => updateField('privacy_answers', opt)}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-sm text-left transition-all ${
                    form.privacy_answers === opt
                      ? 'border-[#7B61FF] bg-[#7B61FF]/10 text-white'
                      : 'border-[#252538] text-[#8B8BAD] hover:border-[#7B61FF]/30'
                  }`}
                >
                  <span className="text-lg">
                    {opt === 'public' ? '🌍' : opt === 'followers' ? '👥' : '🔒'}
                  </span>
                  <span>
                    {opt === 'public' ? 'Tout le monde' : opt === 'followers' ? 'Mes abonnés' : 'Personne'}
                  </span>
                  {form.privacy_answers === opt && (
                    <span className="ml-auto text-[#7B61FF]">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#8B8BAD] mb-2 uppercase tracking-wider">
              Qui peut voir mes questions ?
            </label>
            <div className="flex flex-col gap-2">
              {(['public', 'followers'] as const).map((opt) => (
                <button
                  key={opt}
                  onClick={() => updateField('privacy_questions', opt)}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-sm text-left transition-all ${
                    form.privacy_questions === opt
                      ? 'border-[#7B61FF] bg-[#7B61FF]/10 text-white'
                      : 'border-[#252538] text-[#8B8BAD] hover:border-[#7B61FF]/30'
                  }`}
                >
                  <span className="text-lg">{opt === 'public' ? '🌍' : '👥'}</span>
                  <span>{opt === 'public' ? 'Tout le monde' : 'Mes abonnés'}</span>
                  {form.privacy_questions === opt && (
                    <span className="ml-auto text-[#7B61FF]">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <ToggleRow
            label="Masquer mes abonnements"
            description="Les autres ne pourront pas voir qui vous suivez"
            value={form.privacy_follows ?? false}
            onChange={(v) => updateField('privacy_follows', v)}
          />

          <button
            onClick={saveProfile}
            disabled={saving}
            className="w-full py-3 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-50 hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #FF4D6A, #8B5CF6)' }}
          >
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      )}

      {/* Notifications section */}
      {section === 'notifications' && (
        <div className="flex flex-col gap-3">
          <ToggleRow
            label="Activer les notifications"
            description="Activer ou désactiver toutes les notifications"
            value={form.notifications_enabled ?? true}
            onChange={(v) => updateField('notifications_enabled', v)}
            accent
          />

          <div className="h-px bg-[#252538] my-1" />

          <ToggleRow
            label="Nouveaux abonnés"
            value={form.notif_new_follower ?? true}
            onChange={(v) => updateField('notif_new_follower', v)}
            disabled={!form.notifications_enabled}
          />
          <ToggleRow
            label="Réponses à mes questions"
            value={form.notif_question_answers ?? true}
            onChange={(v) => updateField('notif_question_answers', v)}
            disabled={!form.notifications_enabled}
          />
          <ToggleRow
            label="Commentaires"
            value={form.notif_comments ?? true}
            onChange={(v) => updateField('notif_comments', v)}
            disabled={!form.notifications_enabled}
          />
          <ToggleRow
            label="Nouvelles questions des abonnements"
            value={form.notif_new_question ?? true}
            onChange={(v) => updateField('notif_new_question', v)}
            disabled={!form.notifications_enabled}
          />
          <ToggleRow
            label="Messages"
            value={form.notif_messages ?? true}
            onChange={(v) => updateField('notif_messages', v)}
            disabled={!form.notifications_enabled}
          />
          <ToggleRow
            label="Demandes d'abonnement"
            value={form.notif_follow_requests ?? true}
            onChange={(v) => updateField('notif_follow_requests', v)}
            disabled={!form.notifications_enabled}
          />
          <ToggleRow
            label="Mentions"
            value={form.notif_mentions ?? true}
            onChange={(v) => updateField('notif_mentions', v)}
            disabled={!form.notifications_enabled}
          />

          <button
            onClick={saveProfile}
            disabled={saving}
            className="w-full py-3 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-50 hover:opacity-90 mt-2"
            style={{ background: 'linear-gradient(135deg, #FF4D6A, #8B5CF6)' }}
          >
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      )}

      {/* Account section */}
      {section === 'account' && (
        <div className="flex flex-col gap-4">
          <ToggleRow
            label="Mode sombre"
            description="Activer le thème sombre"
            value={theme === 'dark'}
            onChange={() => toggleTheme()}
            accent
          />

          <div className="p-4 bg-[#16161F] border border-[#252538] rounded-2xl">
            <p className="text-xs text-[#555575] mb-1">Compte connecté</p>
            <p className="text-white font-medium text-sm">{user.email}</p>
          </div>

          <div className="p-4 bg-[#16161F] border border-[#252538] rounded-2xl">
            <p className="text-sm font-semibold text-white mb-1">Réinitialiser le mot de passe</p>
            <p className="text-xs text-[#555575] mb-3">
              Un email de réinitialisation sera envoyé à {user.email}
            </p>
            {passwordResetSent ? (
              <p className="text-sm text-[#3ECFA8] font-medium">✓ Email envoyé ! Vérifiez votre boîte de réception.</p>
            ) : (
              <button
                onClick={handlePasswordReset}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-[#7B61FF] border border-[#7B61FF]/30 hover:bg-[#7B61FF]/10 transition-colors"
              >
                Envoyer l'email
              </button>
            )}
          </div>

          <div className="p-4 bg-[#16161F] border border-[#252538] rounded-2xl">
            <p className="text-sm font-semibold text-white mb-1">À propos</p>
            <p className="text-xs text-[#555575]">Vybor Web v1.0</p>
            <a
              href="https://vybor.app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#7B61FF] hover:underline block mt-1"
            >
              vybor.app
            </a>
          </div>

          <button
            onClick={handleSignOut}
            className="w-full py-3 rounded-xl font-semibold text-sm text-[#FF4D6A] border border-[#FF4D6A]/30 hover:bg-[#FF4D6A]/10 transition-colors"
          >
            Se déconnecter
          </button>
        </div>
      )}
    </div>
  );
}

function ReadOnlyField({
  label,
  value,
  onEdit,
  locked = false,
  lockNote,
}: {
  label: string;
  value: string;
  onEdit: () => void;
  locked?: boolean;
  lockNote?: string;
}) {
  return (
    <div className="p-4 bg-[#16161F] border border-[#252538] rounded-xl">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-[#8B8BAD] uppercase tracking-wider mb-0.5">{label}</p>
          <p className="text-sm text-white font-medium truncate">{value}</p>
        </div>
        <button
          onClick={onEdit}
          disabled={locked}
          className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#7B61FF] border border-[#7B61FF]/30 hover:bg-[#7B61FF]/10 transition-colors disabled:opacity-40"
        >
          Modifier
        </button>
      </div>
      {lockNote && <p className="mt-1.5 text-xs text-[#FFB84D]">{lockNote}</p>}
    </div>
  );
}

function ToggleRow({
  label,
  description,
  value,
  onChange,
  disabled = false,
  accent = false,
}: {
  label: string;
  description?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  accent?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 p-4 bg-[#16161F] border border-[#252538] rounded-xl transition-opacity ${
        disabled ? 'opacity-50' : ''
      }`}
    >
      <div className="flex-1">
        <p className={`text-sm font-medium ${accent ? 'text-white' : 'text-[#8B8BAD]'}`}>
          {label}
        </p>
        {description && (
          <p className="text-xs text-[#555575] mt-0.5">{description}</p>
        )}
      </div>
      <button
        onClick={() => !disabled && onChange(!value)}
        disabled={disabled}
        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
          value ? 'bg-[#FF4D6A]' : 'bg-[#252538]'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
            value ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}
