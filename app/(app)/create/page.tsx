'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth';

type Format = 'yes_no' | 'multiple_choice' | 'scale';
type Privacy = 'public' | 'followers' | 'group';

interface OptionItem {
  text: string;
  imageFile: File | null;
  imagePreview: string | null;
}

export default function CreatePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [format, setFormat] = useState<Format>('yes_no');
  const [text, setText] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [options, setOptions] = useState<OptionItem[]>([
    { text: '', imageFile: null, imagePreview: null },
    { text: '', imageFile: null, imagePreview: null },
  ]);
  const [privacy, setPrivacy] = useState<Privacy>('public');
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const mainImageRef = useRef<HTMLInputElement>(null);
  const optionImageRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('group_members')
      .select('group:groups!group_id(id, name)')
      .eq('user_id', user.id)
      .then(({ data }) => {
        const gs = (data ?? [])
          .map((r: { group: { id: string; name: string } | null }) => r.group)
          .filter(Boolean) as { id: string; name: string }[];
        setGroups(gs);
      });
  }, [user]);

  const handleMainImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleOptionImage = (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOptions((prev) => {
      const updated = [...prev];
      updated[i] = { ...updated[i], imageFile: file, imagePreview: URL.createObjectURL(file) };
      return updated;
    });
  };

  const addOption = () => {
    if (options.length >= 6) return;
    setOptions((prev) => [...prev, { text: '', imageFile: null, imagePreview: null }]);
  };

  const removeOption = (i: number) => {
    if (options.length <= 2) return;
    setOptions((prev) => prev.filter((_, idx) => idx !== i));
  };

  const updateOptionText = (i: number, value: string) => {
    setOptions((prev) => {
      const updated = [...prev];
      updated[i] = { ...updated[i], text: value };
      return updated;
    });
  };

  const uploadImage = async (file: File, path: string): Promise<string | null> => {
    const { error } = await supabase.storage
      .from('question-images')
      .upload(path, file, { upsert: true, contentType: file.type });
    if (error) return null;
    const { data } = supabase.storage.from('question-images').getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!text.trim()) {
      setError('La question ne peut pas être vide.');
      return;
    }
    if (format === 'multiple_choice') {
      const filled = options.filter((o) => o.text.trim());
      if (filled.length < 2) {
        setError('Ajoutez au moins 2 options.');
        return;
      }
    }

    setSubmitting(true);
    setError('');

    // Upload main image
    let imageUrl: string | null = null;
    if (imageFile) {
      imageUrl = await uploadImage(
        imageFile,
        `${user.id}/${Date.now()}_${imageFile.name}`
      );
    }

    // Build options for multiple_choice
    let finalOptions: string[] | null = null;
    let finalOptionImages: (string | null)[] | null = null;

    if (format === 'multiple_choice') {
      // Keep only filled options, preserving order
      const filledOptions = options.filter((o) => o.text.trim());
      finalOptions = filledOptions.map((o) => o.text.trim());
      finalOptionImages = await Promise.all(
        filledOptions.map(async (opt, i) => {
          if (!opt.imageFile) return null;
          return uploadImage(
            opt.imageFile,
            `${user.id}/${Date.now()}_opt${i}_${opt.imageFile.name}`
          );
        })
      );
    }

    const payload: Record<string, unknown> = {
      author_id: user.id,
      text: text.trim(),
      format,
      privacy: selectedGroupId ? 'group' : privacy,
      image_url: imageUrl,
      group_id: selectedGroupId ?? null,
      category: 'Autre',
    };

    if (format === 'multiple_choice') {
      payload.options = finalOptions;
      payload.option_images = finalOptionImages;
    }

    const { data: newQ, error: insertError } = await supabase
      .from('questions')
      .insert(payload)
      .select('id')
      .single();

    if (insertError || !newQ) {
      setError('Erreur lors de la publication. Réessayez.');
      setSubmitting(false);
      return;
    }

    router.push(`/question/${newQ.id}`);
  };

  if (authLoading || !user) return null;

  const canSubmit =
    text.trim().length > 0 &&
    (format !== 'multiple_choice' ||
      options.filter((o) => o.text.trim()).length >= 2);

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-extrabold text-white mb-6">Poser une question</h1>

      {/* Format */}
      <div className="mb-5">
        <p className="text-xs font-semibold text-[#8B8BAD] uppercase tracking-wider mb-2">Format</p>
        <div className="flex gap-2">
          {(
            [
              { value: 'yes_no', label: '👍 Oui / Non' },
              { value: 'multiple_choice', label: '🗳️ Choix multiple' },
              { value: 'scale', label: '⭐ Étoiles' },
            ] as { value: Format; label: string }[]
          ).map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFormat(value)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all border ${
                format === value
                  ? 'border-[#FF4D6A] text-white bg-[#FF4D6A]/10'
                  : 'border-[#252538] text-[#8B8BAD] hover:border-[#FF4D6A]/40 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Question text */}
      <div className="mb-5">
        <p className="text-xs font-semibold text-[#8B8BAD] uppercase tracking-wider mb-2">Question</p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Posez votre question..."
          rows={3}
          maxLength={280}
          className="w-full bg-[#16161F] border border-[#252538] rounded-xl px-4 py-3 text-sm text-white placeholder-[#555575] resize-none focus:outline-none focus:border-[#FF4D6A]/50 transition-colors"
        />
        <p className="text-right text-xs text-[#555575] mt-1">{text.length}/280</p>
      </div>

      {/* Main image */}
      <div className="mb-5">
        <p className="text-xs font-semibold text-[#8B8BAD] uppercase tracking-wider mb-2">
          Image <span className="normal-case font-normal">(optionnel)</span>
        </p>
        {imagePreview ? (
          <div className="relative rounded-xl overflow-hidden bg-[#16161F]">
            <img
              src={imagePreview}
              alt=""
              className="w-full max-h-48 object-contain"
            />
            <button
              onClick={() => { setImageFile(null); setImagePreview(null); }}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-white text-xs hover:bg-black/80 transition-colors"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            onClick={() => mainImageRef.current?.click()}
            className="w-full py-6 rounded-xl border border-dashed border-[#252538] text-[#555575] text-sm hover:border-[#FF4D6A]/40 hover:text-white transition-colors flex flex-col items-center gap-1"
          >
            <span className="text-2xl">📷</span>
            <span>Ajouter une image</span>
          </button>
        )}
        <input
          ref={mainImageRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleMainImage}
        />
      </div>

      {/* Multiple choice options */}
      {format === 'multiple_choice' && (
        <div className="mb-5">
          <p className="text-xs font-semibold text-[#8B8BAD] uppercase tracking-wider mb-2">Options</p>
          <div className="flex flex-col gap-2">
            {options.map((opt, i) => (
              <div
                key={i}
                className="bg-[#16161F] border border-[#252538] rounded-xl p-3"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-[#555575] font-semibold w-5 shrink-0">
                    {i + 1}.
                  </span>
                  <input
                    value={opt.text}
                    onChange={(e) => updateOptionText(i, e.target.value)}
                    placeholder={`Option ${i + 1}`}
                    maxLength={100}
                    className="flex-1 bg-transparent text-sm text-white placeholder-[#555575] focus:outline-none"
                  />
                  {options.length > 2 && (
                    <button
                      onClick={() => removeOption(i)}
                      className="text-[#555575] hover:text-[#FF4D6A] transition-colors text-xs shrink-0"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {opt.imagePreview ? (
                  <div className="relative rounded-lg overflow-hidden mt-2">
                    <img
                      src={opt.imagePreview}
                      alt=""
                      className="w-full h-24 object-contain bg-[#0D0D14]"
                    />
                    <button
                      onClick={() =>
                        setOptions((prev) => {
                          const updated = [...prev];
                          updated[i] = { ...updated[i], imageFile: null, imagePreview: null };
                          return updated;
                        })
                      }
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center text-white text-[10px] hover:bg-black/80 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => optionImageRefs.current[i]?.click()}
                    className="text-xs text-[#555575] hover:text-[#7B61FF] transition-colors flex items-center gap-1 mt-1"
                  >
                    <span>📷</span> Ajouter une image
                  </button>
                )}
                <input
                  ref={(el) => { optionImageRefs.current[i] = el; }}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleOptionImage(i, e)}
                />
              </div>
            ))}
          </div>
          {options.length < 6 && (
            <button
              onClick={addOption}
              className="mt-2 w-full py-2.5 rounded-xl border border-dashed border-[#252538] text-[#555575] text-sm hover:border-[#7B61FF]/40 hover:text-white transition-colors"
            >
              + Ajouter une option
            </button>
          )}
        </div>
      )}

      {/* Group selector */}
      {groups.length > 0 && (
        <div className="mb-5">
          <p className="text-xs font-semibold text-[#8B8BAD] uppercase tracking-wider mb-2">
            Groupe <span className="normal-case font-normal">(optionnel)</span>
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setSelectedGroupId(null);
                if (privacy === 'group') setPrivacy('public');
              }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                !selectedGroupId
                  ? 'border-[#FF4D6A] text-white bg-[#FF4D6A]/10'
                  : 'border-[#252538] text-[#8B8BAD] hover:border-[#FF4D6A]/40'
              }`}
            >
              Aucun
            </button>
            {groups.map((g) => (
              <button
                key={g.id}
                onClick={() => { setSelectedGroupId(g.id); setPrivacy('group'); }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                  selectedGroupId === g.id
                    ? 'border-[#FF4D6A] text-white bg-[#FF4D6A]/10'
                    : 'border-[#252538] text-[#8B8BAD] hover:border-[#FF4D6A]/40'
                }`}
              >
                {g.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Privacy */}
      <div className="mb-6">
        <p className="text-xs font-semibold text-[#8B8BAD] uppercase tracking-wider mb-2">Visibilité</p>
        <div className="flex gap-2">
          {(
            [
              { value: 'public', label: '🌍 Public' },
              { value: 'followers', label: '👥 Abonnés' },
              ...(selectedGroupId ? [{ value: 'group' as Privacy, label: '🔒 Groupe' }] : []),
            ] as { value: Privacy; label: string }[]
          ).map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setPrivacy(value)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all border ${
                privacy === value
                  ? 'border-[#8B5CF6] text-white bg-[#8B5CF6]/10'
                  : 'border-[#252538] text-[#8B8BAD] hover:border-[#8B5CF6]/40 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && <p className="text-sm text-[#FF4D6A] mb-4">{error}</p>}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={submitting || !canSubmit}
        className="w-full py-3.5 rounded-xl font-bold text-base text-white transition-all disabled:opacity-40 hover:opacity-90 active:scale-[0.98]"
        style={{ background: 'linear-gradient(135deg, #FF4D6A, #8B5CF6)' }}
      >
        {submitting ? 'Publication en cours...' : 'Publier la question'}
      </button>
    </div>
  );
}
