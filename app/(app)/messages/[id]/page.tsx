'use client';
import { use, useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth';
import { Avatar } from '@/components/Avatar';
import { Message, Profile } from '@/types';

function timeStr(dateString: string): string {
  return new Date(dateString).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: convId } = use(params);
  const { user } = useAuth();
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([]);
  const [otherProfile, setOtherProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    bottomRef.current?.scrollIntoView({ behavior });
  }, []);

  useEffect(() => {
    if (!user) return;
    loadConversation();
    markAsRead();
  }, [convId, user]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`conv-${convId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${convId}`,
        },
        async (payload) => {
          const newMsg = payload.new as Message;
          // Fetch sender profile
          const { data: senderProfile } = await supabase
            .from('profiles')
            .select('id, username, avatar_url')
            .eq('id', newMsg.sender_id)
            .single();
          const enriched = { ...newMsg, sender: senderProfile ?? undefined };
          setMessages((prev) => {
            if (prev.some((m) => m.id === enriched.id)) return prev;
            return [...prev, enriched];
          });
          scrollToBottom();
          // Mark as read if from other
          if (newMsg.sender_id !== user.id) {
            await supabase
              .from('messages')
              .update({ read_at: new Date().toISOString() })
              .eq('id', newMsg.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [convId, user, scrollToBottom]);

  useEffect(() => {
    scrollToBottom('instant');
  }, [messages.length]);

  const loadConversation = async () => {
    if (!user) return;

    // Load conversation to find other participant
    const { data: conv } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', convId)
      .single();

    if (!conv) {
      router.push('/messages');
      return;
    }

    const otherId = conv.user1_id === user.id ? conv.user2_id : conv.user1_id;
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .eq('id', otherId)
      .single();
    setOtherProfile(profile ?? null);

    // Load messages
    const { data: msgs } = await supabase
      .from('messages')
      .select('*, sender:profiles!sender_id(id, username, avatar_url)')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });

    setMessages(msgs ?? []);
    setLoading(false);
  };

  const markAsRead = async () => {
    if (!user) return;
    await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('conversation_id', convId)
      .neq('sender_id', user.id)
      .is('read_at', null);
  };

  const sendMessage = async () => {
    if (!user || !text.trim() || sending) return;
    const msgText = text.trim();
    setText('');
    setSending(true);

    const { error } = await supabase.from('messages').insert({
      conversation_id: convId,
      sender_id: user.id,
      text: msgText,
    });

    if (!error) {
      await supabase
        .from('conversations')
        .update({
          last_message_at: new Date().toISOString(),
          last_message: msgText,
        })
        .eq('id', convId);
    }

    setSending(false);
    inputRef.current?.focus();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-[#FF4D6A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const lastSentIdx = [...messages].reverse().findIndex((m) => m.sender_id === user?.id);
  const lastSentId =
    lastSentIdx !== -1 ? messages[messages.length - 1 - lastSentIdx].id : null;

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] md:h-[calc(100vh-3rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-[#252538] mb-2 flex-shrink-0">
        <button
          onClick={() => router.push('/messages')}
          className="text-[#8B8BAD] hover:text-white transition-colors mr-1"
        >
          ←
        </button>
        {otherProfile && (
          <>
            <a href={`/profile/${otherProfile.id}`}>
              <Avatar uri={otherProfile.avatar_url} username={otherProfile.username} size={36} />
            </a>
            <a
              href={`/profile/${otherProfile.id}`}
              className="flex-1 hover:opacity-80 transition-opacity"
            >
              <p className="text-white font-semibold text-sm">@{otherProfile.username}</p>
            </a>
          </>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-2 flex flex-col gap-1">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center flex-1 py-10 text-center">
            <p className="text-4xl mb-3">👋</p>
            <p className="text-[#555575] text-sm">Commencez la conversation</p>
          </div>
        )}

        {messages.map((msg, i) => {
          const isMe = msg.sender_id === user?.id;
          const prevMsg = messages[i - 1];
          const showAvatar = !isMe && msg.sender_id !== prevMsg?.sender_id;
          const isLastSent = msg.id === lastSentId;

          return (
            <div
              key={msg.id}
              className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {!isMe && (
                <div className="w-7 flex-shrink-0">
                  {showAvatar && (
                    <Avatar
                      uri={msg.sender?.avatar_url}
                      username={msg.sender?.username ?? '?'}
                      size={28}
                    />
                  )}
                </div>
              )}
              <div className={`max-w-[70%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div
                  className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    isMe
                      ? 'text-white rounded-br-sm'
                      : 'bg-[#1E1E2D] text-white rounded-bl-sm'
                  }`}
                  style={
                    isMe
                      ? { background: 'linear-gradient(135deg, #FF4D6A, #8B5CF6)' }
                      : {}
                  }
                >
                  {msg.text}
                </div>
                <div className="flex items-center gap-1 mt-0.5 px-1">
                  <span className="text-[10px] text-[#555575]">{timeStr(msg.created_at)}</span>
                  {isMe && isLastSent && (
                    <span className={`text-[10px] ${msg.read_at ? 'text-[#7B61FF]' : 'text-[#555575]'}`}>
                      {msg.read_at ? '✓✓' : '✓'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex items-center gap-3 pt-3 border-t border-[#252538] flex-shrink-0">
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Écrivez un message..."
          className="flex-1 bg-[#1E1E2D] border border-[#252538] rounded-full px-4 py-2.5 text-sm text-white placeholder-[#555575] focus:outline-none focus:border-[#7B61FF]/50 transition-colors"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
        />
        <button
          onClick={sendMessage}
          disabled={sending || !text.trim()}
          className="w-10 h-10 rounded-full flex items-center justify-center text-white transition-all disabled:opacity-40 hover:opacity-90 flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #FF4D6A, #8B5CF6)' }}
        >
          {sending ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
