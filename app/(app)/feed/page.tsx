'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth';
import { QuestionCard } from '@/components/QuestionCard';
import { Question } from '@/types';
import Link from 'next/link';

type Tab = 'forYou' | 'following';

export default function FeedPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('forYou');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  const fetchForYou = useCallback(async () => {
    if (!user) return;

    // 1. Get already-voted question IDs
    const { data: votedRows } = await supabase
      .from('votes')
      .select('question_id')
      .eq('user_id', user.id);
    const votedIds = (votedRows ?? []).map((v) => v.question_id as string);

    // 2. Fetch public questions (not in a group)
    let query = supabase
      .from('questions')
      .select(
        `*, author:profiles!author_id(id, username, avatar_url, privacy_questions, is_private)`
      )
      .eq('privacy', 'public')
      .is('group_id', null)
      .order('created_at', { ascending: false })
      .limit(60);

    if (votedIds.length > 0) {
      query = query.not('id', 'in', `(${votedIds.join(',')})`);
    }

    const { data: rawQuestions } = await query;
    if (!rawQuestions || rawQuestions.length === 0) {
      setQuestions([]);
      return;
    }

    // 3. Filter authors who have public questions setting
    const filtered = rawQuestions.filter(
      (q) =>
        !q.author?.is_private ||
        q.author?.privacy_questions === 'public'
    );

    const ids = filtered.map((q) => q.id as string);

    // 4. Fetch comment counts
    const { data: commentRows } = await supabase
      .from('comments')
      .select('question_id')
      .in('question_id', ids);

    const commentCountMap: Record<string, number> = {};
    (commentRows ?? []).forEach((c) => {
      commentCountMap[c.question_id] = (commentCountMap[c.question_id] ?? 0) + 1;
    });

    // 5. Fetch following votes (for social proof)
    const { data: followingRows } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id);
    const followingIds = (followingRows ?? []).map((f) => f.following_id as string);

    let followingVoteCountMap: Record<string, number> = {};
    if (followingIds.length > 0) {
      const { data: fVotes } = await supabase
        .from('votes')
        .select('question_id')
        .in('user_id', followingIds)
        .in('question_id', ids);
      (fVotes ?? []).forEach((v) => {
        followingVoteCountMap[v.question_id] = (followingVoteCountMap[v.question_id] ?? 0) + 1;
      });
    }

    // 6. Compute all vote stats from votes table (single query, source of truth)
    const { data: allVotes } = await supabase
      .from('votes')
      .select('question_id, answer, answer_index')
      .in('question_id', ids);

    const yesCountMap: Record<string, number> = {};
    const noCountMap: Record<string, number> = {};
    const optionVoteMap: Record<string, Record<number, number>> = {};
    const scaleAccMap: Record<string, { sum: number; count: number }> = {};

    const fmtMap: Record<string, { format: string; optLen: number }> = {};
    filtered.forEach((q) => { fmtMap[q.id] = { format: q.format, optLen: q.options?.length ?? 0 }; });

    (allVotes ?? []).forEach((v) => {
      const fmt = fmtMap[v.question_id]?.format;
      if (fmt === 'yes_no' && v.answer !== null && v.answer !== undefined) {
        if (v.answer) yesCountMap[v.question_id] = (yesCountMap[v.question_id] ?? 0) + 1;
        else noCountMap[v.question_id] = (noCountMap[v.question_id] ?? 0) + 1;
      } else if (fmt === 'multiple_choice' && v.answer_index !== null && v.answer_index !== undefined) {
        if (!optionVoteMap[v.question_id]) optionVoteMap[v.question_id] = {};
        optionVoteMap[v.question_id][v.answer_index] = (optionVoteMap[v.question_id][v.answer_index] ?? 0) + 1;
      } else if (fmt === 'scale' && v.answer_index !== null && v.answer_index !== undefined) {
        if (!scaleAccMap[v.question_id]) scaleAccMap[v.question_id] = { sum: 0, count: 0 };
        scaleAccMap[v.question_id].sum += v.answer_index;
        scaleAccMap[v.question_id].count += 1;
      }
    });

    const enriched: Question[] = filtered.slice(0, 50).map((q) => ({
      ...q,
      comment_count: commentCountMap[q.id] ?? 0,
      following_vote_count: followingVoteCountMap[q.id] ?? 0,
      yes_count: yesCountMap[q.id] ?? 0,
      no_count: noCountMap[q.id] ?? 0,
      user_vote: undefined,
      user_vote_index: undefined,
      option_counts: q.options
        ? q.options.map((_: unknown, i: number) => optionVoteMap[q.id]?.[i] ?? 0)
        : undefined,
      total_votes: scaleAccMap[q.id]?.count ?? 0,
      scale_average: scaleAccMap[q.id]?.count
        ? scaleAccMap[q.id].sum / scaleAccMap[q.id].count
        : null,
    }));

    setQuestions(enriched);
  }, [user]);

  const fetchFollowing = useCallback(async () => {
    if (!user) return;

    // 1. Get followed user IDs
    const { data: followRows } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id);
    const followingIds = (followRows ?? []).map((f) => f.following_id as string);

    if (followingIds.length === 0) {
      setQuestions([]);
      return;
    }

    // 2. Get my voted question IDs
    const { data: myVotes } = await supabase
      .from('votes')
      .select('question_id, answer, answer_index')
      .eq('user_id', user.id);
    const myVoteMap: Record<string, { answer?: boolean | null; answer_index?: number | null }> = {};
    (myVotes ?? []).forEach((v) => {
      myVoteMap[v.question_id] = { answer: v.answer, answer_index: v.answer_index };
    });

    // 3. Get my group memberships
    const { data: groupMemberRows } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', user.id)
      .limit(50);
    const myGroupIds = (groupMemberRows ?? []).map((g) => g.group_id as string);

    // 4. Fetch questions from followed users OR my groups
    const { data: rawQuestions } = await supabase
      .from('questions')
      .select(
        `*, author:profiles!author_id(id, username, avatar_url, privacy_answers, privacy_questions, is_private)`
      )
      .or(
        [
          `author_id.in.(${followingIds.join(',')})`,
          myGroupIds.length > 0 ? `group_id.in.(${myGroupIds.join(',')})` : null,
        ]
          .filter(Boolean)
          .join(',')
      )
      .order('created_at', { ascending: false })
      .limit(60);

    if (!rawQuestions || rawQuestions.length === 0) {
      setQuestions([]);
      return;
    }

    const ids = rawQuestions.map((q) => q.id as string);

    // 5. Fetch vote option_counts
    const { data: commentRows } = await supabase
      .from('comments')
      .select('question_id')
      .in('question_id', ids);
    const commentCountMap: Record<string, number> = {};
    (commentRows ?? []).forEach((c) => {
      commentCountMap[c.question_id] = (commentCountMap[c.question_id] ?? 0) + 1;
    });

    // Compute all vote stats from votes table (single query, source of truth)
    const { data: allVotes } = await supabase
      .from('votes')
      .select('question_id, answer, answer_index')
      .in('question_id', ids);

    const yesCountMap: Record<string, number> = {};
    const noCountMap: Record<string, number> = {};
    const optionVoteMap: Record<string, Record<number, number>> = {};
    const scaleAccMap: Record<string, { sum: number; count: number }> = {};

    const fmtMap: Record<string, { format: string; optLen: number }> = {};
    rawQuestions.forEach((q) => { fmtMap[q.id] = { format: q.format, optLen: q.options?.length ?? 0 }; });

    (allVotes ?? []).forEach((v) => {
      const fmt = fmtMap[v.question_id]?.format;
      if (fmt === 'yes_no' && v.answer !== null && v.answer !== undefined) {
        if (v.answer) yesCountMap[v.question_id] = (yesCountMap[v.question_id] ?? 0) + 1;
        else noCountMap[v.question_id] = (noCountMap[v.question_id] ?? 0) + 1;
      } else if (fmt === 'multiple_choice' && v.answer_index !== null && v.answer_index !== undefined) {
        if (!optionVoteMap[v.question_id]) optionVoteMap[v.question_id] = {};
        optionVoteMap[v.question_id][v.answer_index] = (optionVoteMap[v.question_id][v.answer_index] ?? 0) + 1;
      } else if (fmt === 'scale' && v.answer_index !== null && v.answer_index !== undefined) {
        if (!scaleAccMap[v.question_id]) scaleAccMap[v.question_id] = { sum: 0, count: 0 };
        scaleAccMap[v.question_id].sum += v.answer_index;
        scaleAccMap[v.question_id].count += 1;
      }
    });

    const enriched: Question[] = rawQuestions.map((q) => {
      const myVote = myVoteMap[q.id];
      return {
        ...q,
        comment_count: commentCountMap[q.id] ?? 0,
        yes_count: yesCountMap[q.id] ?? 0,
        no_count: noCountMap[q.id] ?? 0,
        user_vote: myVote?.answer ?? null,
        user_vote_index: myVote?.answer_index ?? null,
        option_counts: q.options
          ? q.options.map((_: unknown, i: number) => optionVoteMap[q.id]?.[i] ?? 0)
          : undefined,
        total_votes: scaleAccMap[q.id]?.count ?? 0,
        scale_average: scaleAccMap[q.id]?.count
          ? scaleAccMap[q.id].sum / scaleAccMap[q.id].count
          : null,
      };
    });

    setQuestions(enriched);
  }, [user]);

  const loadData = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      if (tab === 'forYou') await fetchForYou();
      else await fetchFollowing();
      if (isRefresh) setRefreshing(false);
      else setLoading(false);
    },
    [tab, fetchForYou, fetchFollowing]
  );

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [tab, user, loadData]);

  const handleVote = (updated: Question) => {
    setQuestions((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-[#FF4D6A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold text-white">Feed</h1>
        <Link
          href="/create"
          className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90 active:scale-95"
          style={{ background: 'linear-gradient(135deg, #FF4D6A, #8B5CF6)' }}
        >
          <span className="text-base leading-none">+</span>
          Publier
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-[#16161F] p-1 rounded-xl border border-[#252538]">
        {(['forYou', 'following'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === t
                ? 'bg-[#FF4D6A] text-white shadow-md shadow-[#FF4D6A]/30'
                : 'text-[#8B8BAD] hover:text-white'
            }`}
          >
            {t === 'forYou' ? 'Pour toi' : 'Abonnements'}
          </button>
        ))}
      </div>

      {/* Refresh button */}
      <div className="flex justify-end mb-3">
        <button
          onClick={() => loadData(true)}
          disabled={refreshing}
          className="flex items-center gap-2 text-xs text-[#8B8BAD] hover:text-white transition-colors disabled:opacity-50"
        >
          <span className={refreshing ? 'animate-spin' : ''}>↻</span>
          Actualiser
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-[#16161F] border border-[#252538] rounded-2xl p-4 animate-pulse"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[#252538]" />
                <div className="flex-1">
                  <div className="h-3 w-24 bg-[#252538] rounded mb-2" />
                  <div className="h-2 w-16 bg-[#252538] rounded" />
                </div>
              </div>
              <div className="h-4 w-full bg-[#252538] rounded mb-2" />
              <div className="h-4 w-3/4 bg-[#252538] rounded mb-4" />
              <div className="flex gap-2">
                <div className="flex-1 h-10 bg-[#252538] rounded-xl" />
                <div className="flex-1 h-10 bg-[#252538] rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : questions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-5xl mb-4">
            {tab === 'forYou' ? '🎉' : '👥'}
          </div>
          <p className="text-white font-semibold text-lg mb-2">
            {tab === 'forYou' ? 'Vous avez tout vu !' : 'Aucune question pour l\'instant'}
          </p>
          <p className="text-[#555575] text-sm max-w-xs">
            {tab === 'forYou'
              ? 'Revenez plus tard pour découvrir de nouvelles questions.'
              : 'Abonnez-vous à des utilisateurs pour voir leurs questions ici.'}
          </p>
          {tab === 'following' && (
            <button
              onClick={() => setTab('forYou')}
              className="mt-4 px-4 py-2 rounded-xl text-sm font-semibold text-[#FF4D6A] border border-[#FF4D6A]/30 hover:bg-[#FF4D6A]/10 transition-colors"
            >
              Explorer le feed public
            </button>
          )}
        </div>
      ) : (
        <div>
          {questions.map((q) => (
            <QuestionCard key={q.id} question={q} onVote={handleVote} />
          ))}
        </div>
      )}
    </div>
  );
}
