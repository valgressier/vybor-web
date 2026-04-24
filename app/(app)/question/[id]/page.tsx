'use client';
import { use, useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth';
import { QuestionCard } from '@/components/QuestionCard';
import { Avatar } from '@/components/Avatar';
import { Question, Comment } from '@/types';

function timeAgo(dateString: string): string {
  const diff = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (diff < 60) return "à l'instant";
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}j`;
}

export default function QuestionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user, profile } = useAuth();
  const router = useRouter();
  const [question, setQuestion] = useState<Question | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<{ id: string; username: string } | null>(null);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadQuestion();
    loadComments();
  }, [id]);

  const loadQuestion = async () => {
    const { data: q } = await supabase
      .from('questions')
      .select('*, author:profiles!author_id(id, username, avatar_url, bio)')
      .eq('id', id)
      .single();

    if (!q) {
      setLoading(false);
      return;
    }

    // Fetch user's vote
    let userVote = null;
    let userVoteIndex = null;
    if (user) {
      const { data: voteData } = await supabase
        .from('votes')
        .select('answer, answer_index')
        .eq('user_id', user.id)
        .eq('question_id', id)
        .maybeSingle();
      if (voteData) {
        userVote = voteData.answer ?? null;
        userVoteIndex = voteData.answer_index ?? null;
      }
    }

    // Fetch all vote stats from votes table (source of truth)
    const { data: allVotes } = await supabase
      .from('votes')
      .select('answer, answer_index')
      .eq('question_id', id);

    const yesCount = (allVotes ?? []).filter((v) => v.answer === true).length;
    const noCount = (allVotes ?? []).filter((v) => v.answer === false).length;

    const optionVotes: Record<number, number> = {};
    let scaleSum = 0, scaleCount = 0;
    (allVotes ?? []).forEach((v) => {
      if (v.answer_index !== null && v.answer_index !== undefined) {
        if (q.format === 'multiple_choice') {
          optionVotes[v.answer_index] = (optionVotes[v.answer_index] ?? 0) + 1;
        } else if (q.format === 'scale') {
          scaleSum += v.answer_index;
          scaleCount += 1;
        }
      }
    });

    // Fetch comment count
    const { count: commentCount } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('question_id', id);

    // Fetch following votes count
    let followingVoteCount = 0;
    if (user) {
      const { data: followingRows } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);
      const followingIds = (followingRows ?? []).map((f) => f.following_id as string);
      if (followingIds.length > 0) {
        const { count } = await supabase
          .from('votes')
          .select('*', { count: 'exact', head: true })
          .in('user_id', followingIds)
          .eq('question_id', id);
        followingVoteCount = count ?? 0;
      }
    }

    setQuestion({
      ...q,
      yes_count: yesCount,
      no_count: noCount,
      user_vote: userVote,
      user_vote_index: userVoteIndex,
      comment_count: commentCount ?? 0,
      following_vote_count: followingVoteCount,
      option_counts: q.options
        ? q.options.map((_, i) => optionVotes[i] ?? 0)
        : undefined,
      total_votes: scaleCount,
      scale_average: scaleCount > 0 ? scaleSum / scaleCount : null,
    });
    setLoading(false);
  };

  const loadComments = async () => {
    const { data } = await supabase
      .from('comments')
      .select('*, author:profiles!author_id(id, username, avatar_url)')
      .eq('question_id', id)
      .order('created_at', { ascending: true });

    setComments(data ?? []);
  };

  const submitComment = async () => {
    if (!user || !profile || !commentText.trim()) return;
    setSubmitting(true);

    const text = replyTo
      ? `@${replyTo.username} ${commentText.trim()}`
      : commentText.trim();

    const { data: newComment, error } = await supabase
      .from('comments')
      .insert({
        question_id: id,
        author_id: user.id,
        text,
        parent_id: replyTo?.id ?? null,
      })
      .select('*, author:profiles!author_id(id, username, avatar_url)')
      .single();

    if (!error && newComment) {
      setComments((prev) => [...prev, newComment]);
      setQuestion((prev) =>
        prev ? { ...prev, comment_count: (prev.comment_count ?? 0) + 1 } : prev
      );
    }

    setCommentText('');
    setReplyTo(null);
    setSubmitting(false);
  };

  const handleReply = (commentId: string, username: string) => {
    setReplyTo({ id: commentId, username });
    commentInputRef.current?.focus();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-[#FF4D6A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!question) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-5xl mb-4">🔍</p>
        <p className="text-white font-semibold text-lg">Question introuvable</p>
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
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-[#8B8BAD] hover:text-white text-sm mb-4 transition-colors"
      >
        ← Retour
      </button>

      {/* Question card (no link, no showLink) */}
      <QuestionCard
        question={question}
        showLink={false}
        readOnly={!user}
        onVote={(updated) => setQuestion(updated)}
      />

      {/* Comments section */}
      <div className="mt-6">
        <h2 className="text-white font-bold text-base mb-4">
          Commentaires ({question.comment_count ?? 0})
        </h2>

        {/* Comment form */}
        {user ? (
          <div className="bg-[#16161F] border border-[#252538] rounded-2xl p-4 mb-5">
            {replyTo && (
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[#7B61FF]">
                  Répondre à @{replyTo.username}
                </span>
                <button
                  onClick={() => setReplyTo(null)}
                  className="text-xs text-[#555575] hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
            )}
            <div className="flex gap-3">
              <Avatar
                uri={profile?.avatar_url}
                username={profile?.username ?? 'U'}
                size={32}
              />
              <div className="flex-1">
                <textarea
                  ref={commentInputRef}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Ajouter un commentaire..."
                  rows={2}
                  className="w-full bg-[#1E1E2D] border border-[#252538] rounded-xl px-3 py-2 text-sm text-white placeholder-[#555575] resize-none focus:outline-none focus:border-[#FF4D6A]/50 transition-colors"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submitComment();
                  }}
                />
                <div className="flex justify-end mt-2">
                  <button
                    onClick={submitComment}
                    disabled={submitting || !commentText.trim()}
                    className="px-4 py-1.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40 hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg, #FF4D6A, #8B5CF6)' }}
                  >
                    {submitting ? '...' : 'Envoyer'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-[#16161F] border border-[#252538] rounded-2xl p-4 mb-5 text-center">
            <p className="text-[#8B8BAD] text-sm">
              <a href="/login" className="text-[#FF4D6A] hover:underline">
                Connectez-vous
              </a>{' '}
              pour commenter
            </p>
          </div>
        )}

        {/* Comments list */}
        {comments.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-4xl mb-3">💬</p>
            <p className="text-[#555575] text-sm">Soyez le premier à commenter</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className={`flex gap-3 ${comment.parent_id ? 'ml-10' : ''}`}
              >
                <a href={`/profile/${comment.author_id}`}>
                  <Avatar
                    uri={comment.author?.avatar_url}
                    username={comment.author?.username ?? '?'}
                    size={32}
                  />
                </a>
                <div className="flex-1 bg-[#16161F] border border-[#252538] rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1">
                    <a
                      href={`/profile/${comment.author_id}`}
                      className="text-sm font-semibold text-white hover:opacity-80"
                    >
                      @{comment.author?.username}
                    </a>
                    <span className="text-xs text-[#555575]">{timeAgo(comment.created_at)}</span>
                  </div>
                  <p className="text-sm text-[#8B8BAD] leading-relaxed">{comment.text}</p>
                  {user && (
                    <button
                      onClick={() =>
                        handleReply(comment.id, comment.author?.username ?? '?')
                      }
                      className="text-xs text-[#555575] hover:text-[#7B61FF] mt-1 transition-colors"
                    >
                      Répondre
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
