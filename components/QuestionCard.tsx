'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Question } from '@/types';
import { Avatar } from './Avatar';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth';

function timeAgo(dateString: string): string {
  const diff = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (diff < 60) return "à l'instant";
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}j`;
}

function getAgeGroup(birthYear: number): string {
  const age = new Date().getFullYear() - birthYear;
  if (age < 15) return '';
  if (age < 20) return '15-20';
  if (age < 25) return '20-25';
  if (age < 30) return '25-30';
  if (age < 35) return '30-35';
  if (age < 40) return '35-40';
  if (age < 45) return '40-45';
  if (age < 50) return '45-50';
  return '50+';
}

interface FollowingVoteItem {
  userId: string;
  username: string;
  avatarUrl?: string;
  answer?: boolean | null;
  answerIndex?: number | null;
}

interface DemoGroup {
  label: string;
  total: number;
  yes: number;
  no: number;
  options: number[];
  scaleSum: number;
}

interface QuestionStats {
  byGender: DemoGroup[];
  byAge: DemoGroup[];
  byCountry: DemoGroup[];
}

interface Props {
  question: Question;
  onVote?: (updated: Question) => void;
  onDelete?: (id: string) => void;
  showLink?: boolean;
  anonymousVotes?: boolean;
  readOnly?: boolean;
}

export function QuestionCard({
  question: initialQ,
  onVote,
  showLink = true,
  readOnly = false,
}: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const [q, setQ] = useState(initialQ);
  const [voting, setVoting] = useState(false);

  // Following accordion
  const [showFollowing, setShowFollowing] = useState(false);
  const [followingVotes, setFollowingVotes] = useState<FollowingVoteItem[]>([]);
  const [followingLoading, setFollowingLoading] = useState(false);
  const [followingLoaded, setFollowingLoaded] = useState(false);

  // Stats modal
  const [showStats, setShowStats] = useState(false);
  const [stats, setStats] = useState<QuestionStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsLoaded, setStatsLoaded] = useState(false);
  const [statsTab, setStatsTab] = useState<'gender' | 'age' | 'country'>('gender');

  const hasVoted =
    q.format === 'yes_no'
      ? q.user_vote !== null && q.user_vote !== undefined
      : q.user_vote_index !== null && q.user_vote_index !== undefined;

  const totalYesNo = (q.yes_count ?? 0) + (q.no_count ?? 0);
  const totalMC = q.option_counts?.reduce((a, b) => a + b, 0) ?? 0;

  const castVote = async (answer: boolean | null, answerIndex: number | null) => {
    if (!user || voting || readOnly) return;
    setVoting(true);

    const payload: Record<string, unknown> = {
      user_id: user.id,
      question_id: q.id,
    };
    if (answer !== null) payload.answer = answer;
    if (answerIndex !== null) payload.answer_index = answerIndex;

    const { error } = await supabase
      .from('votes')
      .upsert(payload, { onConflict: 'user_id,question_id' });

    if (error) { setVoting(false); return; }

    let updated = { ...q };
    if (q.format === 'yes_no') {
      const wasYes = q.user_vote === true;
      const wasNo = q.user_vote === false;
      let yes = q.yes_count ?? 0;
      let no = q.no_count ?? 0;
      if (wasYes) yes--;
      if (wasNo) no--;
      if (answer === true) yes++;
      else no++;
      updated = { ...updated, yes_count: yes, no_count: no, user_vote: answer };
    } else if (q.format === 'multiple_choice') {
      const counts = [...(q.option_counts ?? (q.options ?? []).map(() => 0))];
      if (q.user_vote_index !== null && q.user_vote_index !== undefined) counts[q.user_vote_index]--;
      if (answerIndex !== null) counts[answerIndex]++;
      updated = { ...updated, option_counts: counts, user_vote_index: answerIndex };
    } else {
      const prevVoteIdx = q.user_vote_index ?? null;
      const isFirstVote = prevVoteIdx === null || prevVoteIdx === undefined;
      const prevTotal = q.total_votes ?? 0;
      const newTotal = isFirstVote ? prevTotal + 1 : prevTotal;
      const prevAvg = q.scale_average ?? 0;
      const newAvg = newTotal === 0
        ? answerIndex!
        : isFirstVote
        ? ((prevAvg * prevTotal) + answerIndex!) / newTotal
        : ((prevAvg * prevTotal) - (prevVoteIdx ?? 0) + answerIndex!) / prevTotal;
      updated = { ...updated, user_vote_index: answerIndex, total_votes: newTotal, scale_average: newAvg };
    }

    setQ(updated);
    onVote?.(updated);
    setVoting(false);
  };

  const loadFollowingVotes = async () => {
    if (!user || followingLoaded) return;
    setFollowingLoading(true);

    const { data: followRows } = await supabase
      .from('follows')
      .select('following_id, profile:profiles!following_id(id, username, avatar_url)')
      .eq('follower_id', user.id);

    if (!followRows || followRows.length === 0) {
      setFollowingLoaded(true);
      setFollowingLoading(false);
      return;
    }

    const followingIds = followRows.map((f) => f.following_id as string);
    const profileMap: Record<string, { username: string; avatar_url?: string }> = {};
    followRows.forEach((f) => {
      const p = Array.isArray(f.profile) ? f.profile[0] : f.profile;
      if (p) profileMap[f.following_id] = p as { username: string; avatar_url?: string };
    });

    const { data: votes } = await supabase
      .from('votes')
      .select('user_id, answer, answer_index')
      .eq('question_id', q.id)
      .in('user_id', followingIds);

    setFollowingVotes(
      (votes ?? []).map((v) => ({
        userId: v.user_id,
        username: profileMap[v.user_id]?.username ?? '?',
        avatarUrl: profileMap[v.user_id]?.avatar_url,
        answer: v.answer,
        answerIndex: v.answer_index,
      }))
    );
    setFollowingLoaded(true);
    setFollowingLoading(false);
  };

  const loadStats = async () => {
    if (statsLoaded) return;
    setStatsLoading(true);

    const { data: votes } = await supabase
      .from('votes')
      .select('answer, answer_index, voter:profiles!user_id(gender, birth_year, country)')
      .eq('question_id', q.id);

    if (!votes || votes.length === 0) {
      setStats({ byGender: [], byAge: [], byCountry: [] });
      setStatsLoaded(true);
      setStatsLoading(false);
      return;
    }

    const optLen = q.options?.length ?? 0;
    const initGroup = (): DemoGroup => ({
      label: '',
      total: 0,
      yes: 0,
      no: 0,
      options: Array(optLen).fill(0),
      scaleSum: 0,
    });

    const genderMap: Record<string, DemoGroup> = {};
    const ageMap: Record<string, DemoGroup> = {};
    const countryMap: Record<string, DemoGroup> = {};

    const GENDER_LABELS: Record<string, string> = {
      homme: 'Homme',
      femme: 'Femme',
      autre: 'Autre',
    };

    votes.forEach((v) => {
      const voter = v.voter as { gender?: string; birth_year?: number; country?: string } | null;
      const gender = voter?.gender ? (GENDER_LABELS[voter.gender] ?? voter.gender) : 'Non précisé';
      const ageGroup = voter?.birth_year ? getAgeGroup(voter.birth_year) : '';
      const country = voter?.country ?? '';

      if (!genderMap[gender]) genderMap[gender] = { ...initGroup(), label: gender };
      if (ageGroup && !ageMap[ageGroup]) ageMap[ageGroup] = { ...initGroup(), label: ageGroup };
      if (country && !countryMap[country]) countryMap[country] = { ...initGroup(), label: country };

      const groups: DemoGroup[] = [genderMap[gender]];
      if (ageGroup) groups.push(ageMap[ageGroup]);
      if (country) groups.push(countryMap[country]);

      for (const group of groups) {
        group.total++;
        if (q.format === 'yes_no') {
          if (v.answer === true) group.yes++;
          else if (v.answer === false) group.no++;
        } else if (q.format === 'multiple_choice' && v.answer_index != null) {
          group.options[v.answer_index] = (group.options[v.answer_index] ?? 0) + 1;
        } else if (q.format === 'scale' && v.answer_index != null) {
          group.scaleSum += v.answer_index;
        }
      }
    });

    const AGE_ORDER = ['15-20', '20-25', '25-30', '30-35', '35-40', '40-45', '45-50', '50+'];
    const toArray = (map: Record<string, DemoGroup>, order?: string[]) =>
      Object.values(map).sort((a, b) =>
        order
          ? (order.indexOf(a.label) ?? 99) - (order.indexOf(b.label) ?? 99)
          : b.total - a.total
      );

    setStats({
      byGender: toArray(genderMap),
      byAge: toArray(ageMap, AGE_ORDER),
      byCountry: toArray(countryMap),
    });
    setStatsLoaded(true);
    setStatsLoading(false);
  };

  // ── Vote label helper ──────────────────────────────────────────────────────
  const voteLabel = (answer?: boolean | null, answerIndex?: number | null) => {
    if (q.format === 'yes_no') {
      if (answer === true) return <span className="text-[#3ECFA8] font-semibold text-xs">👍 Oui</span>;
      if (answer === false) return <span className="text-[#FF4D6A] font-semibold text-xs">👎 Non</span>;
    } else if (q.format === 'multiple_choice' && answerIndex != null) {
      return (
        <span className="text-[#7B61FF] font-semibold text-xs">
          {q.options?.[answerIndex] ?? `Option ${answerIndex + 1}`}
        </span>
      );
    } else if (q.format === 'scale' && answerIndex != null) {
      return (
        <span className="text-[#FF4D6A] font-semibold text-xs">
          {'★'.repeat(answerIndex)}{'☆'.repeat(5 - answerIndex)}
        </span>
      );
    }
    return null;
  };

  // ── Stats group row ────────────────────────────────────────────────────────
  const renderStatGroup = (group: DemoGroup) => {
    if (q.format === 'yes_no') {
      const yesPct = group.total > 0 ? Math.round((group.yes / group.total) * 100) : 0;
      const noPct = 100 - yesPct;
      return (
        <div key={group.label} className="mb-3">
          <div className="flex justify-between mb-1">
            <span className="text-xs font-semibold text-white">{group.label}</span>
            <span className="text-xs text-[#555575]">{group.total} vote{group.total !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex rounded-md overflow-hidden h-2">
            <div className="bg-[#3ECFA8] transition-all" style={{ width: `${yesPct}%` }} />
            <div className="bg-[#FF4D6A] flex-1" />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-[#3ECFA8]">👍 {yesPct}%</span>
            <span className="text-[10px] text-[#FF4D6A]">{noPct}% 👎</span>
          </div>
        </div>
      );
    } else if (q.format === 'multiple_choice') {
      const total = group.options.reduce((a, b) => a + b, 0);
      return (
        <div key={group.label} className="mb-3">
          <div className="flex justify-between mb-1.5">
            <span className="text-xs font-semibold text-white">{group.label}</span>
            <span className="text-xs text-[#555575]">{group.total} vote{group.total !== 1 ? 's' : ''}</span>
          </div>
          {(q.options ?? []).map((opt, i) => {
            const pct = total > 0 ? Math.round((group.options[i] / total) * 100) : 0;
            return (
              <div key={i} className="mb-1">
                <div className="flex justify-between mb-0.5">
                  <span className="text-[10px] text-[#8B8BAD] truncate mr-2">{opt}</span>
                  <span className="text-[10px] text-[#8B8BAD] shrink-0">{pct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-[#252538] overflow-hidden">
                  <div
                    className="h-full bg-[#7B61FF] rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      );
    } else {
      const avg = group.total > 0 ? (group.scaleSum / group.total).toFixed(1) : '—';
      return (
        <div key={group.label} className="flex items-center justify-between py-2 border-b border-[#252538] last:border-0">
          <span className="text-xs font-semibold text-white">{group.label}</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#FF4D6A] font-semibold">★ {avg}/5</span>
            <span className="text-xs text-[#555575]">({group.total})</span>
          </div>
        </div>
      );
    }
  };

  // ── Card content ───────────────────────────────────────────────────────────
  const cardContent = (
    <div className="bg-[#16161F] border border-[#252538] rounded-2xl p-4 hover:border-[#FF4D6A]/30 transition-all duration-200">
      {/* Author row */}
      <div className="flex items-center gap-3 mb-3">
        <Link href={`/profile/${q.author_id}`} onClick={(e) => e.stopPropagation()} className="hover:opacity-80 transition-opacity">
          <Avatar uri={q.author?.avatar_url} username={q.author?.username ?? '?'} size={38} />
        </Link>
        <div className="flex-1 min-w-0">
          <Link href={`/profile/${q.author_id}`} onClick={(e) => e.stopPropagation()} className="hover:opacity-80 transition-opacity">
            <p className="text-sm font-semibold text-white">@{q.author?.username}</p>
          </Link>
          <p className="text-xs text-[#555575]">{timeAgo(q.created_at)}</p>
        </div>
      </div>

      {/* Question text */}
      <p className="text-white font-semibold text-base mb-4 leading-snug">{q.text}</p>

      {/* Question image */}
      {q.image_url && (
        <div className="mb-4 rounded-xl overflow-hidden">
          <img src={q.image_url} alt="" className="w-full max-h-64 object-contain" />
        </div>
      )}

      {/* Vote UI — yes_no */}
      {q.format === 'yes_no' && (
        <div>
          <div className="flex gap-2">
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); castVote(true, null); }}
              disabled={voting || !user}
              className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 ${
                q.user_vote === true
                  ? 'bg-[#3ECFA8] text-white shadow-lg shadow-[#3ECFA8]/20'
                  : 'bg-[#3ECFA8]/10 text-[#3ECFA8] border border-[#3ECFA8]/30 hover:bg-[#3ECFA8]/20'
              }`}
            >👍 Oui</button>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); castVote(false, null); }}
              disabled={voting || !user}
              className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 ${
                q.user_vote === false
                  ? 'bg-[#FF4D6A] text-white shadow-lg shadow-[#FF4D6A]/20'
                  : 'bg-[#FF4D6A]/10 text-[#FF4D6A] border border-[#FF4D6A]/30 hover:bg-[#FF4D6A]/20'
              }`}
            >👎 Non</button>
          </div>
          {(hasVoted || readOnly) && totalYesNo > 0 && (() => {
            const yesPct = Math.round(((q.yes_count ?? 0) / totalYesNo) * 100);
            const noPct = 100 - yesPct;
            return (
              <div className="mt-3">
                <div className="flex rounded-lg overflow-hidden h-2.5">
                  <div className="bg-[#3ECFA8] transition-all duration-500 ease-out" style={{ width: `${yesPct}%` }} />
                  <div className="bg-[#FF4D6A] transition-all duration-500 ease-out flex-1" />
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="text-xs font-semibold text-[#3ECFA8]">👍 {yesPct}% · {q.yes_count} vote{(q.yes_count ?? 0) !== 1 ? 's' : ''}</span>
                  <span className="text-xs font-semibold text-[#FF4D6A]">{noPct}% · {q.no_count} vote{(q.no_count ?? 0) !== 1 ? 's' : ''} 👎</span>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Vote UI — multiple_choice */}
      {q.format === 'multiple_choice' && (() => {
        const hasImages = (q.option_images ?? []).some((img) => img);
        if (hasImages) {
          return (
            <div className="grid grid-cols-2 gap-2">
              {(q.options ?? []).map((opt, i) => {
                const count = q.option_counts?.[i] ?? 0;
                const pct = totalMC > 0 ? Math.round((count / totalMC) * 100) : 0;
                const isSelected = q.user_vote_index === i;
                const imgUrl = q.option_images?.[i];
                return (
                  <button
                    key={i}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); castVote(null, i); }}
                    disabled={voting || !user || readOnly}
                    className={`relative flex flex-col rounded-xl overflow-hidden text-sm font-medium text-left transition-all disabled:opacity-50 border ${
                      isSelected ? 'border-[#7B61FF]' : 'border-[#252538] hover:border-[#7B61FF]/40'
                    }`}
                  >
                    {imgUrl && <img src={imgUrl} alt={opt} className="w-full h-28 object-cover" />}
                    <div className="relative px-3 py-2 overflow-hidden">
                      {(hasVoted || readOnly) && (
                        <div className="absolute inset-0 origin-left transition-all duration-500 ease-out"
                          style={{ background: isSelected ? '#7B61FF33' : '#7B61FF11', width: `${pct}%` }} />
                      )}
                      <span className={`relative text-xs font-semibold ${isSelected ? 'text-white' : 'text-[#8B8BAD]'}`}>{opt}</span>
                      {(hasVoted || readOnly) && <span className="relative float-right text-xs text-[#8B8BAD] font-semibold">{pct}%</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          );
        }
        return (
          <div className="flex flex-col gap-2">
            {(q.options ?? []).map((opt, i) => {
              const count = q.option_counts?.[i] ?? 0;
              const pct = totalMC > 0 ? Math.round((count / totalMC) * 100) : 0;
              const isSelected = q.user_vote_index === i;
              return (
                <button
                  key={i}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); castVote(null, i); }}
                  disabled={voting || !user || readOnly}
                  className={`relative flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium text-left transition-all overflow-hidden disabled:opacity-50 border ${
                    isSelected ? 'border-[#7B61FF] text-white' : 'border-[#252538] text-[#8B8BAD] hover:border-[#7B61FF]/40 hover:text-white'
                  }`}
                >
                  {(hasVoted || readOnly) && (
                    <div className="absolute inset-0 origin-left transition-all duration-500 ease-out"
                      style={{ background: isSelected ? '#7B61FF33' : '#7B61FF11', width: `${pct}%` }} />
                  )}
                  <span className="relative">{opt}</span>
                  {(hasVoted || readOnly) && <span className="relative text-xs text-[#8B8BAD] font-semibold">{pct}%</span>}
                </button>
              );
            })}
          </div>
        );
      })()}

      {/* Vote UI — scale */}
      {q.format === 'scale' && (
        <div>
          <div className="flex gap-1 justify-center py-1">
            {Array.from({ length: 5 }, (_, i) => {
              const star = i + 1;
              const filled = (q.user_vote_index ?? 0) >= star;
              return (
                <button
                  key={star}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); castVote(null, star); }}
                  disabled={voting || !user || readOnly}
                  className="text-4xl leading-none transition-transform disabled:opacity-50 hover:scale-110 active:scale-95"
                >
                  <span style={{ color: filled ? '#FF4D6A' : '#555575' }}>★</span>
                </button>
              );
            })}
          </div>
          {(q.total_votes ?? 0) > 0 && (
            <p className="text-xs text-[#8B8BAD] mt-2 text-center">
              Moy. {q.scale_average?.toFixed(1)}/5 · {q.total_votes} vote{(q.total_votes ?? 0) > 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}

      {/* Stats row */}
      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[#252538]">
        <span className="text-xs text-[#555575]">
          {q.format === 'yes_no'
            ? `${totalYesNo} vote${totalYesNo !== 1 ? 's' : ''}`
            : q.format === 'multiple_choice'
            ? `${totalMC} vote${totalMC !== 1 ? 's' : ''}`
            : `${q.total_votes ?? 0} vote${(q.total_votes ?? 0) !== 1 ? 's' : ''}`}
        </span>
        {(q.comment_count ?? 0) > 0 && (
          <span className="text-xs text-[#555575]">💬 {q.comment_count}</span>
        )}
        {!user && !readOnly && (
          <span className="text-xs text-[#555575] ml-auto">
            <Link href="/login" className="text-[#FF4D6A] hover:underline">Connectez-vous</Link>{' '}pour voter
          </span>
        )}
      </div>

      {/* Stats button */}
      {user && hasVoted && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowStats(true);
            loadStats();
          }}
          className="w-full mt-3 py-2 rounded-xl border border-[#3E9EFF]/25 text-xs font-semibold text-[#3E9EFF] hover:bg-[#3E9EFF]/5 transition-colors flex items-center justify-center gap-1.5"
        >
          Stats détaillées <span>📊</span>
        </button>
      )}

      {/* Read-only CTA */}
      {readOnly && (
        <Link
          href="/login"
          onClick={(e) => e.stopPropagation()}
          className="w-full mt-3 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          style={{ background: 'linear-gradient(135deg, #FF4D6A, #8B5CF6)' }}
        >
          🗳️ Voter sur Vybor
        </Link>
      )}
    </div>
  );

  // ── Stats modal ────────────────────────────────────────────────────────────
  const statsModal = showStats ? (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) setShowStats(false); }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowStats(false)} />
      <div className="relative w-full max-w-md bg-[#16161F] border border-[#252538] rounded-2xl overflow-hidden max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#252538] shrink-0">
          <h3 className="text-base font-bold text-white">📊 Stats</h3>
          <button onClick={() => setShowStats(false)} className="text-[#555575] hover:text-white transition-colors text-lg leading-none">✕</button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-5 pt-4 shrink-0">
          {([
            { key: 'gender', label: 'Genre' },
            { key: 'age', label: 'Âge' },
            { key: 'country', label: 'Pays' },
          ] as { key: typeof statsTab; label: string }[]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setStatsTab(key)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statsTab === key
                  ? 'bg-[#FF4D6A]/10 text-[#FF4D6A] border border-[#FF4D6A]/30'
                  : 'text-[#8B8BAD] hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="overflow-y-auto px-5 py-4 flex-1">
          {statsLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-[#FF4D6A] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !stats ? null : (() => {
            const groups =
              statsTab === 'gender' ? stats.byGender
              : statsTab === 'age' ? stats.byAge
              : stats.byCountry;

            const visible = groups.filter((g) => g.total > 0);
            if (visible.length === 0) {
              return <p className="text-xs text-[#555575] text-center py-8">Pas assez de données</p>;
            }
            return <div>{visible.map(renderStatGroup)}</div>;
          })()}
        </div>
      </div>
    </div>
  ) : null;

  // ── Following section (below card) ────────────────────────────────────────
  const followingSection = user && (q.following_vote_count ?? 0) > 0 ? (
    <div className="border border-[#252538] rounded-xl overflow-hidden mt-1">
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setShowFollowing((v) => !v);
          if (!followingLoaded) loadFollowingVotes();
        }}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-[#1A1A28] hover:bg-[#1E1E2D] transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs">👥</span>
          <span className="text-xs font-semibold text-[#7B61FF]">Abonnements</span>
          <span className="text-[10px] text-[#555575]">
            · {q.following_vote_count} vote{(q.following_vote_count ?? 0) > 1 ? 's' : ''}
          </span>
        </div>
        <span className="text-[10px] text-[#555575]">{showFollowing ? '▲' : '▼'}</span>
      </button>

      {showFollowing && (
        <div className="bg-[#16161F] border-t border-[#252538]">
          {followingLoading ? (
            <div className="flex justify-center py-4">
              <div className="w-4 h-4 border-2 border-[#7B61FF] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : followingVotes.length === 0 ? (
            <p className="text-xs text-[#555575] text-center py-4">Aucun abonné n'a voté</p>
          ) : (
            <div className="flex gap-4 overflow-x-auto px-4 py-3 scrollbar-hide">
              {followingVotes.map((fv) => (
                <a
                  key={fv.userId}
                  href={`/profile/${fv.userId}`}
                  onClick={(e) => e.stopPropagation()}
                  className="flex flex-col items-center gap-1 min-w-[56px] hover:opacity-80 transition-opacity"
                >
                  <Avatar uri={fv.avatarUrl} username={fv.username} size={36} />
                  <span className="text-[9px] text-[#8B8BAD] font-medium w-14 text-center truncate">
                    @{fv.username}
                  </span>
                  <div className="text-center">{voteLabel(fv.answer, fv.answerIndex)}</div>
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  ) : null;

  // ── Return ─────────────────────────────────────────────────────────────────
  if (showLink) {
    return (
      <>
        {statsModal}
        <div className="mb-3">
          <div className="block cursor-pointer" onClick={() => router.push(`/question/${q.id}`)}>
            {cardContent}
          </div>
          {followingSection}
        </div>
      </>
    );
  }
  return (
    <>
      {statsModal}
      <div className="mb-3">
        {cardContent}
        {followingSection}
      </div>
    </>
  );
}
