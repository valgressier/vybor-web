'use client';
import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth';
import { Avatar } from '@/components/Avatar';
import { QuestionCard } from '@/components/QuestionCard';
import { Profile, Question } from '@/types';

type FollowStatus = 'none' | 'following' | 'requested' | 'own';

export default function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user, profile: myProfile } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Question[]>([]);
  const [activeTab, setActiveTab] = useState<'questions' | 'answers'>('questions');
  const [answersLoaded, setAnswersLoaded] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const [answerCount, setAnswerCount] = useState(0);
  const [votesReceivedCount, setVotesReceivedCount] = useState(0);
  const [affinity, setAffinity] = useState<number | null>(null);
  const [followStatus, setFollowStatus] = useState<FollowStatus>('none');
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [followModal, setFollowModal] = useState<'followers' | 'following' | null>(null);
  const [modalUsers, setModalUsers] = useState<Profile[]>([]);
  const [modalLoading, setModalLoading] = useState(false);

  const isOwnProfile = user?.id === id;

  useEffect(() => {
    loadProfile();
  }, [id, user]);

  const loadProfile = async () => {
    setLoading(true);

    // Fetch profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (!profileData) {
      setLoading(false);
      return;
    }
    setProfile(profileData);

    // Fetch counts in parallel
    const [
      { count: fCount },
      { count: fgCount },
      { count: qCount },
      { count: aCount },
      { count: vrCount },
    ] = await Promise.all([
      supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', id),
      supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', id),
      supabase
        .from('questions')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', id)
        .eq('privacy', 'public'),
      // Votes cast by this user (answers)
      supabase
        .from('votes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', id),
      // Votes received on this user's questions
      supabase
        .from('votes')
        .select('questions!inner(author_id)', { count: 'exact', head: true })
        .eq('questions.author_id', id),
    ]);

    setFollowerCount(fCount ?? 0);
    setFollowingCount(fgCount ?? 0);
    setQuestionCount(qCount ?? 0);
    setAnswerCount(aCount ?? 0);
    setVotesReceivedCount(vrCount ?? 0);

    // Check follow status
    if (user && !isOwnProfile) {
      const { data: followData } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', id)
        .maybeSingle();

      if (followData) {
        setFollowStatus('following');
      } else {
        const { data: reqData } = await supabase
          .from('follow_requests')
          .select('id')
          .eq('requester_id', user.id)
          .eq('target_id', id)
          .maybeSingle();
        setFollowStatus(reqData ? 'requested' : 'none');
      }
    } else if (isOwnProfile) {
      setFollowStatus('own');
    }

    // Compute affinity (only when viewing someone else's profile)
    if (user && !isOwnProfile) {
      const [{ data: myVotes }, { data: theirVotes }] = await Promise.all([
        supabase.from('votes').select('question_id, answer, answer_index').eq('user_id', user.id),
        supabase.from('votes').select('question_id, answer, answer_index').eq('user_id', id),
      ]);

      const myMap: Record<string, { answer: boolean | null; answer_index: number | null }> = {};
      (myVotes ?? []).forEach((v: { question_id: string; answer: boolean | null; answer_index: number | null }) => {
        myMap[v.question_id] = { answer: v.answer, answer_index: v.answer_index };
      });

      let common = 0;
      let matching = 0;
      (theirVotes ?? []).forEach((v: { question_id: string; answer: boolean | null; answer_index: number | null }) => {
        const mine = myMap[v.question_id];
        if (!mine) return;
        common++;
        if (v.answer !== null && mine.answer !== null) {
          if (v.answer === mine.answer) matching++;
        } else if (v.answer_index !== null && mine.answer_index !== null) {
          if (v.answer_index === mine.answer_index) matching++;
        }
      });

      setAffinity(common >= 3 ? Math.round((matching / common) * 100) : null);
    }

    // Fetch questions
    const canSeeQuestions =
      isOwnProfile ||
      followStatus === 'following' ||
      !profileData.is_private;

    if (canSeeQuestions) {
      const { data: qData } = await supabase
        .from('questions')
        .select('*, author:profiles!author_id(id, username, avatar_url)')
        .eq('author_id', id)
        .eq('privacy', isOwnProfile ? 'public' : 'public')
        .order('created_at', { ascending: false })
        .limit(30);

      // Enrich with user's votes + yes/no counts from votes table
      let enriched: Question[] = qData ?? [];
      if (enriched.length > 0) {
        const qIds = enriched.map((q) => q.id);

        const [{ data: myVotes }, { data: allVotes }] = await Promise.all([
          user
            ? supabase
                .from('votes')
                .select('question_id, answer, answer_index')
                .eq('user_id', user.id)
                .in('question_id', qIds)
            : Promise.resolve({ data: [] }),
          supabase
            .from('votes')
            .select('question_id, answer, answer_index')
            .in('question_id', qIds),
        ]);

        const voteMap: Record<string, { answer?: boolean | null; answer_index?: number | null }> = {};
        (myVotes ?? []).forEach((v) => {
          voteMap[v.question_id] = { answer: v.answer, answer_index: v.answer_index };
        });

        const yesCountMap: Record<string, number> = {};
        const noCountMap: Record<string, number> = {};
        const optionVoteMap: Record<string, Record<number, number>> = {};
        const scaleAccMap: Record<string, { sum: number; count: number }> = {};

        const fmtMap: Record<string, string> = {};
        enriched.forEach((q) => { fmtMap[q.id] = q.format; });

        (allVotes ?? []).forEach((v) => {
          const fmt = fmtMap[v.question_id];
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

        enriched = enriched.map((q) => ({
          ...q,
          yes_count: yesCountMap[q.id] ?? 0,
          no_count: noCountMap[q.id] ?? 0,
          user_vote: voteMap[q.id]?.answer ?? null,
          user_vote_index: voteMap[q.id]?.answer_index ?? null,
          option_counts: q.options
            ? q.options.map((_: unknown, i: number) => optionVoteMap[q.id]?.[i] ?? 0)
            : undefined,
          total_votes: scaleAccMap[q.id]?.count ?? (q.total_votes ?? 0),
          scale_average: scaleAccMap[q.id]?.count
            ? scaleAccMap[q.id].sum / scaleAccMap[q.id].count
            : (q.scale_average ?? null),
        }));
      }

      setQuestions(enriched);
    }

    setLoading(false);
  };

  const loadAnswers = async () => {
    if (answersLoaded) return;
    const { data: voteRows } = await supabase
      .from('votes')
      .select('question_id, answer, answer_index')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(30);

    if (!voteRows || voteRows.length === 0) {
      setAnswersLoaded(true);
      return;
    }

    const questionIds = voteRows.map((v) => v.question_id);
    const [{ data: qData }, { data: allVotes }] = await Promise.all([
      supabase
        .from('questions')
        .select('*, author:profiles!author_id(id, username, avatar_url)')
        .in('id', questionIds)
        .eq('privacy', 'public'),
      supabase
        .from('votes')
        .select('question_id, answer, answer_index')
        .in('question_id', questionIds),
    ]);

    // Profile user's votes (for highlighting their choice)
    const voteMap: Record<string, { answer?: boolean | null; answer_index?: number | null }> = {};
    voteRows.forEach((v) => {
      voteMap[v.question_id] = { answer: v.answer, answer_index: v.answer_index };
    });

    // Compute stats from all votes
    const yesCountMap: Record<string, number> = {};
    const noCountMap: Record<string, number> = {};
    const optionVoteMap: Record<string, Record<number, number>> = {};
    const scaleAccMap: Record<string, { sum: number; count: number }> = {};

    const fmtMap: Record<string, string> = {};
    (qData ?? []).forEach((q) => { fmtMap[q.id] = q.format; });

    (allVotes ?? []).forEach((v) => {
      const fmt = fmtMap[v.question_id];
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

    const enriched: Question[] = (qData ?? []).map((q) => ({
      ...q,
      yes_count: yesCountMap[q.id] ?? 0,
      no_count: noCountMap[q.id] ?? 0,
      user_vote: voteMap[q.id]?.answer ?? null,
      user_vote_index: voteMap[q.id]?.answer_index ?? null,
      option_counts: q.options
        ? q.options.map((_: unknown, i: number) => optionVoteMap[q.id]?.[i] ?? 0)
        : undefined,
      total_votes: scaleAccMap[q.id]?.count ?? (q.total_votes ?? 0),
      scale_average: scaleAccMap[q.id]?.count
        ? scaleAccMap[q.id].sum / scaleAccMap[q.id].count
        : (q.scale_average ?? null),
    }));

    setAnswers(enriched);
    setAnswersLoaded(true);
  };

  const handleFollow = async () => {
    if (!user || followLoading) return;
    setFollowLoading(true);

    if (followStatus === 'following') {
      await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', id);
      setFollowStatus('none');
      setFollowerCount((c) => c - 1);
    } else if (followStatus === 'requested') {
      await supabase
        .from('follow_requests')
        .delete()
        .eq('requester_id', user.id)
        .eq('target_id', id);
      setFollowStatus('none');
    } else {
      if (profile?.is_private) {
        await supabase.from('follow_requests').insert({
          requester_id: user.id,
          target_id: id,
        });
        setFollowStatus('requested');
      } else {
        await supabase.from('follows').insert({
          follower_id: user.id,
          following_id: id,
        });
        setFollowStatus('following');
        setFollowerCount((c) => c + 1);
      }
    }

    setFollowLoading(false);
  };

  const openFollowModal = async (type: 'followers' | 'following') => {
    setFollowModal(type);
    setModalUsers([]);
    setModalLoading(true);

    const { data } = await supabase
      .from('follows')
      .select(type === 'followers'
        ? 'profile:profiles!follower_id(id, username, avatar_url)'
        : 'profile:profiles!following_id(id, username, avatar_url)'
      )
      .eq(type === 'followers' ? 'following_id' : 'follower_id', id);

    setModalUsers(
      (data ?? [])
        .flatMap((r: { profile: any[] }) => r.profile ?? [])
        .filter(Boolean) as Profile[]
    );
    setModalLoading(false);
  };

  const handleMessage = async () => {
    if (!user) return;
    const ids = [user.id, id].sort();
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .or(`and(user1_id.eq.${ids[0]},user2_id.eq.${ids[1]})`)
      .maybeSingle();

    if (existing) {
      router.push(`/messages/${existing.id}`);
    } else {
      const { data: newConv } = await supabase
        .from('conversations')
        .insert({ user1_id: ids[0], user2_id: ids[1], last_message_at: new Date().toISOString() })
        .select('id')
        .single();
      if (newConv) router.push(`/messages/${newConv.id}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-[#FF4D6A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-5xl mb-4">👤</p>
        <p className="text-white font-semibold text-lg">Profil introuvable</p>
        <button
          onClick={() => router.back()}
          className="mt-4 text-sm text-[#FF4D6A] hover:underline"
        >
          Retour
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Cover image */}
      {profile.cover_url ? (
        <div
          className="w-full h-[180px] rounded-2xl mb-4 bg-cover bg-center"
          style={{ backgroundImage: `url(${profile.cover_url})` }}
        />
      ) : (
        <div
          className="w-full h-32 rounded-2xl mb-4"
          style={{ background: 'linear-gradient(135deg, #FF4D6A22, #7B61FF22)' }}
        />
      )}

      {/* Profile header */}
      <div className="flex items-end gap-4 -mt-12 px-2 mb-4">
        <div className="ring-4 ring-[#0D0D14] rounded-full">
          <Avatar uri={profile.avatar_url} username={profile.username} size={80} />
        </div>
        <div className="flex-1 mb-1">
          <h1 className="text-white font-bold text-xl">@{profile.username}</h1>
          {affinity !== null && (
            <div className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-1 rounded-full text-xs font-semibold"
              style={{
                background: affinity >= 80
                  ? 'linear-gradient(135deg, #FF4D6A22, #8B5CF622)'
                  : affinity >= 50
                  ? 'linear-gradient(135deg, #7B61FF22, #3E9EFF22)'
                  : '#25253822',
                border: `1px solid ${affinity >= 80 ? '#FF4D6A44' : affinity >= 50 ? '#7B61FF44' : '#3A3A5544'}`,
                color: affinity >= 80 ? '#FF4D6A' : affinity >= 50 ? '#9B8BFF' : '#8B8BAD',
              }}
            >
              <span>{affinity >= 80 ? '💜' : affinity >= 50 ? '💙' : '🩶'}</span>
              <span>{affinity}% d&apos;affinité</span>
            </div>
          )}
          {profile.country && (
            <p className="text-xs text-[#555575] mt-0.5">📍 {profile.country}</p>
          )}
        </div>
      </div>

      {profile.bio && (
        <p className="text-[#8B8BAD] text-sm px-2 mb-4 leading-relaxed">{profile.bio}</p>
      )}

      {profile.website_url && (
        <a
          href={profile.website_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-[#7B61FF] px-2 mb-4 block hover:underline truncate"
        >
          🔗 {profile.website_url}
        </a>
      )}

      {/* Stats */}
      <div className="flex gap-6 px-2 mb-2">
        <button
          onClick={() => openFollowModal('followers')}
          className="text-center hover:opacity-80 transition-opacity"
        >
          <p className="text-white font-bold text-lg">{followerCount}</p>
          <p className="text-[#555575] text-xs">Abonnés</p>
        </button>
        <button
          onClick={() => openFollowModal('following')}
          className="text-center hover:opacity-80 transition-opacity"
        >
          <p className="text-white font-bold text-lg">{followingCount}</p>
          <p className="text-[#555575] text-xs">Abonnements</p>
        </button>
      </div>

      {/* Votes récoltés */}
      <p className="px-2 mb-5 text-xs text-[#555575]">
        Votes récoltés :{' '}
        <span className="text-white font-semibold">{votesReceivedCount}</span>
      </p>

      {/* Action buttons */}
      <div className="flex gap-3 px-2 mb-6">
        {isOwnProfile ? (
          <a
            href="/settings"
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-center text-white border border-[#252538] hover:border-[#8B8BAD] transition-colors"
          >
            Modifier le profil
          </a>
        ) : !user ? (
          <a
            href="/login"
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-center text-white hover:opacity-90 transition-opacity"
            style={{ background: 'linear-gradient(135deg, #FF4D6A, #8B5CF6)' }}
          >
            S&apos;abonner
          </a>
        ) : (
          <>
            <button
              onClick={handleFollow}
              disabled={followLoading}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 ${
                followStatus === 'following'
                  ? 'bg-[#1E1E2D] text-white border border-[#252538] hover:border-[#FF4D6A]/50'
                  : followStatus === 'requested'
                  ? 'bg-[#1E1E2D] text-[#8B8BAD] border border-[#252538]'
                  : 'text-white hover:opacity-90'
              }`}
              style={
                followStatus === 'none'
                  ? { background: 'linear-gradient(135deg, #FF4D6A, #8B5CF6)' }
                  : {}
              }
            >
              {followLoading
                ? '...'
                : followStatus === 'following'
                ? 'Abonné ✓'
                : followStatus === 'requested'
                ? 'Demande envoyée'
                : "S'abonner"}
            </button>
            <button
              onClick={handleMessage}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-[#7B61FF] border border-[#7B61FF]/30 hover:bg-[#7B61FF]/10 transition-colors"
            >
              Message
            </button>
          </>
        )}
      </div>

      {/* Private profile gate */}
      {profile.is_private && followStatus !== 'following' && !isOwnProfile ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-4xl mb-3">🔒</p>
          <p className="text-white font-semibold mb-2">Compte privé</p>
          <p className="text-[#555575] text-sm">
            Abonnez-vous pour voir les questions de cet utilisateur.
          </p>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="flex gap-1 mb-4 bg-[#16161F] p-1 rounded-xl border border-[#252538]">
            <button
              onClick={() => setActiveTab('questions')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'questions'
                  ? 'bg-[#FF4D6A] text-white'
                  : 'text-[#8B8BAD] hover:text-white'
              }`}
            >
              Questions ({questionCount})
            </button>
            <button
              onClick={() => { setActiveTab('answers'); loadAnswers(); }}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'answers'
                  ? 'bg-[#FF4D6A] text-white'
                  : 'text-[#8B8BAD] hover:text-white'
              }`}
            >
              Réponses ({answerCount})
            </button>
          </div>

          {activeTab === 'questions' && (
            questions.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-4xl mb-3">📝</p>
                <p className="text-[#555575] text-sm">Aucune question publiée</p>
              </div>
            ) : (
              <div>
                {questions.map((q) => (
                  <QuestionCard key={q.id} question={q} />
                ))}
              </div>
            )
          )}

          {activeTab === 'answers' && (
            !answersLoaded ? (
              <div className="flex justify-center py-10">
                <div className="w-7 h-7 border-2 border-[#FF4D6A] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : answers.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-4xl mb-3">🗳️</p>
                <p className="text-[#555575] text-sm">Aucune réponse publique</p>
              </div>
            ) : (
              <div>
                {answers.map((q) => (
                  <QuestionCard key={q.id} question={q} />
                ))}
              </div>
            )
          )}
        </>
      )}

      {/* Followers / Following modal */}
      {followModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setFollowModal(null)} />
          <div className="relative w-full max-w-sm bg-[#16161F] border border-[#252538] rounded-2xl overflow-hidden max-h-[70vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#252538] shrink-0">
              <h3 className="text-base font-bold text-white">
                {followModal === 'followers' ? 'Abonnés' : 'Abonnements'}
              </h3>
              <button
                onClick={() => setFollowModal(null)}
                className="text-[#555575] hover:text-white transition-colors text-lg leading-none"
              >
                ✕
              </button>
            </div>

            {/* List */}
            <div className="overflow-y-auto flex-1">
              {modalLoading ? (
                <div className="flex justify-center py-10">
                  <div className="w-6 h-6 border-2 border-[#FF4D6A] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : modalUsers.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-[#555575] text-sm">
                    {followModal === 'followers' ? 'Aucun abonné' : 'Aucun abonnement'}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col">
                  {modalUsers.map((u) => (
                    <a
                      key={u.id}
                      href={`/profile/${u.id}`}
                      onClick={() => setFollowModal(null)}
                      className="flex items-center gap-3 px-5 py-3 hover:bg-[#1E1E2D] transition-colors"
                    >
                      <Avatar uri={u.avatar_url} username={u.username} size={38} />
                      <span className="text-sm font-semibold text-white">@{u.username}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
