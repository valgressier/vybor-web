'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth';
import { Avatar } from '@/components/Avatar';
import Link from 'next/link';
import { Profile } from '@/types';

type Tab = 'people' | 'questions' | 'groups';

interface GroupResult {
  id: string;
  name: string;
  photo_url?: string | null;
  member_count?: number;
}

interface QuestionResult {
  id: string;
  text: string;
  author?: { id: string; username: string; avatar_url?: string } | null;
  created_at: string;
  yes_count: number;
  no_count: number;
  format: string;
}

export default function SearchPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState<Tab>('people');
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  const [people, setPeople] = useState<Profile[]>([]);
  const [questions, setQuestions] = useState<QuestionResult[]>([]);
  const [groups, setGroups] = useState<GroupResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  const searchPeople = useCallback(async (q: string) => {
    if (!q.trim()) { setPeople([]); return; }
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, bio, is_private')
      .ilike('username', `%${q}%`)
      .limit(30);
    setPeople((data as Profile[]) ?? []);
    setLoading(false);
  }, []);

  const searchQuestions = useCallback(async (q: string) => {
    if (!q.trim()) { setQuestions([]); return; }
    setLoading(true);
    const { data } = await supabase
      .from('questions')
      .select('id, text, author:profiles!author_id(id, username, avatar_url), created_at, yes_count, no_count, format')
      .eq('privacy', 'public')
      .is('group_id', null)
      .ilike('text', `%${q}%`)
      .order('created_at', { ascending: false })
      .limit(30);
    const mapped: QuestionResult[] = (data ?? []).map((row: any) => ({
      ...row,
      author: Array.isArray(row.author) ? (row.author[0] ?? null) : (row.author ?? null),
    }));
    setQuestions(mapped);
    setLoading(false);
  }, []);

  const searchGroups = useCallback(async (q: string) => {
    if (!q.trim()) { setGroups([]); return; }
    setLoading(true);
    const { data } = await supabase
      .from('groups')
      .select('id, name, photo_url')
      .ilike('name', `%${q}%`)
      .limit(30);
    setGroups((data as GroupResult[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (tab === 'people') searchPeople(debouncedQuery);
    else if (tab === 'questions') searchQuestions(debouncedQuery);
    else if (tab === 'groups') searchGroups(debouncedQuery);
  }, [debouncedQuery, tab, searchPeople, searchQuestions, searchGroups]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-[#FF4D6A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const TABS: { key: Tab; label: string }[] = [
    { key: 'people', label: 'Personnes' },
    { key: 'questions', label: 'Questions' },
    { key: 'groups', label: 'Groupes' },
  ];

  const placeholder =
    tab === 'people' ? 'Rechercher un pseudo…' :
    tab === 'questions' ? 'Rechercher une question…' :
    'Rechercher un groupe…';

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-white mb-5">Recherche</h1>

      {/* Search input */}
      <div className="relative mb-4">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555575] w-4 h-4" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-[#16161F] border border-[#252538] rounded-xl pl-9 pr-4 py-3 text-sm text-white placeholder-[#555575] focus:outline-none focus:border-[#FF4D6A]/50 transition-colors"
        />
        {query.length > 0 && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555575] hover:text-white transition-colors text-lg leading-none"
          >
            ✕
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-[#16161F] p-1 rounded-xl border border-[#252538]">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === key
                ? 'bg-[#FF4D6A] text-white shadow-md shadow-[#FF4D6A]/30'
                : 'text-[#8B8BAD] hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-7 h-7 border-2 border-[#FF4D6A] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !debouncedQuery.trim() ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <SearchIcon className="w-12 h-12 text-[#252538] mb-4" />
          <p className="text-[#555575] text-sm">{placeholder}</p>
        </div>
      ) : tab === 'people' ? (
        people.length === 0 ? (
          <EmptyState label="Aucun utilisateur trouvé" />
        ) : (
          <div className="flex flex-col gap-2">
            {people.map((p) => (
              <Link
                key={p.id}
                href={`/profile/${p.id}`}
                className="flex items-center gap-3 bg-[#16161F] border border-[#252538] rounded-xl px-4 py-3 hover:border-[#FF4D6A]/30 transition-colors"
              >
                <Avatar uri={p.avatar_url} username={p.username} size={42} />
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-semibold text-white truncate">@{p.username}</p>
                  {p.bio && (
                    <p className="text-xs text-[#555575] truncate mt-0.5">{p.bio}</p>
                  )}
                </div>
                {p.is_private && (
                  <span className="text-[#555575] text-xs shrink-0">🔒</span>
                )}
              </Link>
            ))}
          </div>
        )
      ) : tab === 'questions' ? (
        questions.length === 0 ? (
          <EmptyState label="Aucune question trouvée" />
        ) : (
          <div className="flex flex-col gap-2">
            {questions.map((q) => (
              <Link
                key={q.id}
                href={`/question/${q.id}`}
                className="bg-[#16161F] border border-[#252538] rounded-xl px-4 py-3 hover:border-[#FF4D6A]/30 transition-colors block"
              >
                <p className="text-sm font-semibold text-white leading-snug mb-2">{q.text}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {q.author && (
                      <>
                        <Avatar uri={q.author.avatar_url} username={q.author.username} size={20} />
                        <span className="text-xs text-[#555575]">@{q.author.username}</span>
                      </>
                    )}
                  </div>
                  <span className="text-xs text-[#555575]">
                    {(q.yes_count ?? 0) + (q.no_count ?? 0)} votes
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )
      ) : (
        groups.length === 0 ? (
          <EmptyState label="Aucun groupe trouvé" />
        ) : (
          <div className="flex flex-col gap-2">
            {groups.map((g) => (
              <div
                key={g.id}
                className="flex items-center gap-3 bg-[#16161F] border border-[#252538] rounded-xl px-4 py-3"
              >
                {g.photo_url ? (
                  <img
                    src={g.photo_url}
                    alt={g.name}
                    className="w-10 h-10 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#252538] flex items-center justify-center shrink-0">
                    <span className="text-[#555575] text-lg">👥</span>
                  </div>
                )}
                <p className="text-sm font-semibold text-white truncate">{g.name}</p>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="text-4xl mb-3">🔍</p>
      <p className="text-[#555575] text-sm">{label}</p>
    </div>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
