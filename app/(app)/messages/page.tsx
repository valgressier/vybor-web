'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth';
import { Avatar } from '@/components/Avatar';
import { Conversation, Profile } from '@/types';

function timeAgo(dateString: string): string {
  const diff = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (diff < 60) return "à l'instant";
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  const days = Math.floor(diff / 86400);
  return days === 1 ? 'hier' : `${days}j`;
}

export default function MessagesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewMsg, setShowNewMsg] = useState(false);
  const [mutuals, setMutuals] = useState<Profile[]>([]);
  const [mutualsLoading, setMutualsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    loadConversations();
  }, [user]);

  const loadConversations = async () => {
    if (!user) return;
    setLoading(true);

    const { data } = await supabase
      .from('conversations')
      .select('*')
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .order('last_message_at', { ascending: false });

    if (!data) {
      setLoading(false);
      return;
    }

    // Fetch other participant profiles
    const otherIds = data.map((c) =>
      c.user1_id === user.id ? c.user2_id : c.user1_id
    );

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .in('id', otherIds);

    const profileMap: Record<string, Profile> = {};
    (profiles ?? []).forEach((p) => {
      profileMap[p.id] = p;
    });

    // Fetch unread counts per conversation
    const convIds = data.map((c) => c.id);
    const { data: unreadMsgs } = await supabase
      .from('messages')
      .select('conversation_id')
      .in('conversation_id', convIds)
      .neq('sender_id', user.id)
      .is('read_at', null);

    const unreadMap: Record<string, number> = {};
    (unreadMsgs ?? []).forEach((m) => {
      unreadMap[m.conversation_id] = (unreadMap[m.conversation_id] ?? 0) + 1;
    });

    // Fetch actual last message text for conversations where last_message is not set
    const nullMsgConvIds = data.filter((c) => !c.last_message).map((c) => c.id);
    const lastMsgMap: Record<string, string> = {};
    if (nullMsgConvIds.length > 0) {
      const { data: lastMsgs } = await supabase
        .from('messages')
        .select('conversation_id, text')
        .in('conversation_id', nullMsgConvIds)
        .order('created_at', { ascending: false });
      (lastMsgs ?? []).forEach((m) => {
        if (!lastMsgMap[m.conversation_id]) lastMsgMap[m.conversation_id] = m.text;
      });
    }

    const enriched: (Conversation & { unread?: number })[] = data.map((c) => ({
      ...c,
      other: profileMap[c.user1_id === user.id ? c.user2_id : c.user1_id],
      unread: unreadMap[c.id] ?? 0,
      last_message: c.last_message ?? lastMsgMap[c.id],
    }));

    setConversations(enriched as Conversation[]);
    setLoading(false);
  };

  const loadMutuals = async () => {
    if (!user) return;
    setMutualsLoading(true);

    const { data: followingRows } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id);
    const followingIds = (followingRows ?? []).map((f) => f.following_id as string);

    if (followingIds.length === 0) {
      setMutuals([]);
      setMutualsLoading(false);
      return;
    }

    const { data: mutualRows } = await supabase
      .from('follows')
      .select('follower_id')
      .in('follower_id', followingIds)
      .eq('following_id', user.id);

    const mutualIds = (mutualRows ?? []).map((r) => r.follower_id as string);

    if (mutualIds.length === 0) {
      setMutuals([]);
      setMutualsLoading(false);
      return;
    }

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .in('id', mutualIds);

    setMutuals(profiles ?? []);
    setMutualsLoading(false);
  };

  const openNewMessage = () => {
    setShowNewMsg(true);
    loadMutuals();
  };

  const startConversation = async (otherId: string) => {
    if (!user) return;
    const ids = [user.id, otherId].sort();

    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .eq('user1_id', ids[0])
      .eq('user2_id', ids[1])
      .maybeSingle();

    if (existing) {
      router.push(`/messages/${existing.id}`);
    } else {
      const { data: newConv } = await supabase
        .from('conversations')
        .insert({
          user1_id: ids[0],
          user2_id: ids[1],
          last_message_at: new Date().toISOString(),
        })
        .select('id')
        .single();
      if (newConv) router.push(`/messages/${newConv.id}`);
    }
    setShowNewMsg(false);
  };

  const filteredMutuals = mutuals.filter((p) =>
    p.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading || (loading && !conversations.length)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-[#FF4D6A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold text-white">Messages</h1>
        <button
          onClick={openNewMessage}
          className="px-4 py-2 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #FF4D6A, #8B5CF6)' }}
        >
          + Nouveau
        </button>
      </div>

      {/* New message modal */}
      {showNewMsg && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-[#16161F] border border-[#252538] rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-[#252538]">
              <h2 className="text-white font-bold">Nouveau message</h2>
              <button
                onClick={() => { setShowNewMsg(false); setSearchQuery(''); }}
                className="text-[#8B8BAD] hover:text-white text-xl leading-none"
              >
                ✕
              </button>
            </div>
            <div className="p-4 border-b border-[#252538]">
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#1E1E2D] border border-[#252538] rounded-xl px-3 py-2 text-sm text-white placeholder-[#555575] focus:outline-none focus:border-[#7B61FF]/50"
              />
            </div>
            <div className="overflow-y-auto flex-1">
              {mutualsLoading ? (
                <div className="flex justify-center p-8">
                  <div className="w-6 h-6 border-2 border-[#FF4D6A] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filteredMutuals.length === 0 ? (
                <div className="text-center p-8">
                  <p className="text-4xl mb-2">👥</p>
                  <p className="text-[#555575] text-sm">
                    {mutuals.length === 0
                      ? 'Aucun abonné mutuel trouvé'
                      : 'Aucun résultat'}
                  </p>
                </div>
              ) : (
                filteredMutuals.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => startConversation(p.id)}
                    className="w-full flex items-center gap-3 p-4 hover:bg-[#1E1E2D] transition-colors text-left"
                  >
                    <Avatar uri={p.avatar_url} username={p.username} size={40} />
                    <span className="text-white font-medium text-sm">@{p.username}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Conversations list */}
      {loading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-4 bg-[#16161F] border border-[#252538] rounded-2xl animate-pulse"
            >
              <div className="w-12 h-12 rounded-full bg-[#252538]" />
              <div className="flex-1">
                <div className="h-3 w-24 bg-[#252538] rounded mb-2" />
                <div className="h-2 w-40 bg-[#252538] rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : conversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-5xl mb-4">✉️</p>
          <p className="text-white font-semibold text-lg mb-2">Aucun message</p>
          <p className="text-[#555575] text-sm">Commencez une conversation !</p>
          <button
            onClick={openNewMessage}
            className="mt-4 px-5 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-all"
            style={{ background: 'linear-gradient(135deg, #FF4D6A, #8B5CF6)' }}
          >
            Écrire un message
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {conversations.map((conv) => {
            const anyConv = conv as Conversation & { unread?: number };
            const hasUnread = (anyConv.unread ?? 0) > 0;
            return (
              <a
                key={conv.id}
                href={`/messages/${conv.id}`}
                className={`flex items-center gap-3 p-4 rounded-2xl border transition-all hover:border-[#7B61FF]/30 ${
                  hasUnread
                    ? 'bg-[#16161F] border-[#7B61FF]/40'
                    : 'bg-[#16161F] border-[#252538]'
                }`}
              >
                <Avatar
                  uri={conv.other?.avatar_url}
                  username={conv.other?.username ?? '?'}
                  size={48}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p
                      className={`text-sm font-semibold truncate ${
                        hasUnread ? 'text-white' : 'text-[#8B8BAD]'
                      }`}
                    >
                      @{conv.other?.username ?? '?'}
                    </p>
                    <span className="text-xs text-[#555575] flex-shrink-0 ml-2">
                      {timeAgo(conv.last_message_at)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-xs text-[#555575] truncate max-w-[200px]">
                      {conv.last_message ?? 'Commencer la conversation'}
                    </p>
                    {hasUnread && (
                      <span className="ml-2 bg-[#7B61FF] text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 flex-shrink-0">
                        {(anyConv.unread ?? 0) > 99 ? '99+' : anyConv.unread}
                      </span>
                    )}
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
