'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth';
import { Avatar } from '@/components/Avatar';
import { Profile } from '@/types';

interface Notification {
  id: string;
  user_id: string;
  type: string;
  actor_id: string;
  question_id?: string | null;
  read: boolean;
  created_at: string;
  actor?: Profile;
}

interface FollowRequest {
  id: string;
  requester_id: string;
  target_id: string;
  created_at: string;
  requester?: Profile;
}

function timeAgo(dateString: string): string {
  const diff = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (diff < 60) return "à l'instant";
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}j`;
}

const NOTIF_ICONS: Record<string, string> = {
  follow: '👤',
  vote: '🗳️',
  comment: '💬',
  mention: '@',
  question: '❓',
  follow_request: '🔔',
  default: '🔔',
};

const NOTIF_MESSAGES: Record<string, string> = {
  follow: "a commencé à te suivre",
  vote: 'a voté sur ta question',
  comment: 'a commenté ta question',
  mention: "t'a mentionné dans un commentaire",
  new_question: 'a posé une nouvelle question',
  question: 'a posé une nouvelle question',
  follow_request: 'souhaite te suivre',
  default: 'nouvelle notification',
};

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [followRequests, setFollowRequests] = useState<FollowRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    loadData();
    markAllRead();
  }, [user]);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('notifications-' + user.id)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          const notif = payload.new as Notification;
          const { data: actor } = await supabase
            .from('profiles')
            .select('id, username, avatar_url')
            .eq('id', notif.actor_id)
            .single();
          setNotifications((prev) => [{ ...notif, actor: actor ?? undefined }, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);

    const [{ data: notifData }, { data: reqData }] = await Promise.all([
      supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('follow_requests')
        .select('*')
        .eq('target_id', user.id)
        .order('created_at', { ascending: false }),
    ]);

    // Enrich notifications with actor profiles
    let enrichedNotifs: Notification[] = [];
    if (notifData && notifData.length > 0) {
      const actorIds = [...new Set(notifData.map((n) => n.actor_id))];
      const { data: actors } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', actorIds);
      const actorMap: Record<string, Profile> = {};
      (actors ?? []).forEach((a) => { actorMap[a.id] = a; });
      enrichedNotifs = notifData.map((n) => ({ ...n, actor: actorMap[n.actor_id] }));
    }

    // Enrich follow requests with requester profiles
    let enrichedReqs: FollowRequest[] = [];
    if (reqData && reqData.length > 0) {
      const requesterIds = reqData.map((r) => r.requester_id);
      const { data: requesters } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', requesterIds);
      const requesterMap: Record<string, Profile> = {};
      (requesters ?? []).forEach((r) => { requesterMap[r.id] = r; });
      enrichedReqs = reqData.map((r) => ({ ...r, requester: requesterMap[r.requester_id] }));
    }

    setNotifications(enrichedNotifs);
    setFollowRequests(enrichedReqs);
    setLoading(false);
  };

  const markAllRead = async () => {
    if (!user) return;
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false);
  };

  const acceptRequest = async (req: FollowRequest) => {
    setProcessingId(req.id);
    await supabase.from('follows').insert({
      follower_id: req.requester_id,
      following_id: req.target_id,
    });
    await supabase.from('follow_requests').delete().eq('id', req.id);
    setFollowRequests((prev) => prev.filter((r) => r.id !== req.id));
    setProcessingId(null);
  };

  const declineRequest = async (reqId: string) => {
    setProcessingId(reqId);
    await supabase.from('follow_requests').delete().eq('id', reqId);
    setFollowRequests((prev) => prev.filter((r) => r.id !== reqId));
    setProcessingId(null);
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-[#FF4D6A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-white mb-6">Notifications</h1>

      {/* Follow requests */}
      {followRequests.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-[#8B8BAD] uppercase tracking-wider mb-3">
            Demandes d'abonnement ({followRequests.length})
          </h2>
          <div className="flex flex-col gap-2">
            {followRequests.map((req) => (
              <div
                key={req.id}
                className="flex items-center gap-3 p-4 bg-[#16161F] border border-[#7B61FF]/30 rounded-2xl"
              >
                <a href={`/profile/${req.requester_id}`}>
                  <Avatar
                    uri={req.requester?.avatar_url}
                    username={req.requester?.username ?? '?'}
                    size={40}
                  />
                </a>
                <div className="flex-1 min-w-0">
                  <a
                    href={`/profile/${req.requester_id}`}
                    className="text-sm font-semibold text-white hover:opacity-80"
                  >
                    @{req.requester?.username}
                  </a>
                  <p className="text-xs text-[#555575]">{timeAgo(req.created_at)}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => acceptRequest(req)}
                    disabled={processingId === req.id}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#3ECFA8] hover:opacity-90 transition-all disabled:opacity-50"
                  >
                    Accepter
                  </button>
                  <button
                    onClick={() => declineRequest(req.id)}
                    disabled={processingId === req.id}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#FF4D6A] border border-[#FF4D6A]/30 hover:bg-[#FF4D6A]/10 transition-all disabled:opacity-50"
                  >
                    Refuser
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notifications list */}
      {notifications.length === 0 && followRequests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-5xl mb-4">🔔</p>
          <p className="text-white font-semibold text-lg mb-2">Tout est calme</p>
          <p className="text-[#555575] text-sm">Vous n'avez pas de nouvelles notifications.</p>
        </div>
      ) : (
        <>
          {notifications.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-[#8B8BAD] uppercase tracking-wider mb-3">
                Activité récente
              </h2>
              <div className="flex flex-col gap-2">
                {notifications.map((notif) => {
                  const icon = NOTIF_ICONS[notif.type] ?? NOTIF_ICONS.default;
                  const message = NOTIF_MESSAGES[notif.type] ?? NOTIF_MESSAGES.default;

                  return (
                    <a
                      key={notif.id}
                      href={
                        notif.question_id
                          ? `/question/${notif.question_id}`
                          : notif.actor_id
                          ? `/profile/${notif.actor_id}`
                          : '#'
                      }
                      className={`flex items-center gap-3 p-4 rounded-2xl border transition-colors hover:border-[#252538] ${
                        notif.read
                          ? 'bg-[#16161F] border-[#252538]'
                          : 'bg-[#1A1A2E] border-[#7B61FF]/30'
                      }`}
                    >
                      <div className="relative flex-shrink-0">
                        <Avatar
                          uri={notif.actor?.avatar_url}
                          username={notif.actor?.username ?? '?'}
                          size={40}
                        />
                        <span className="absolute -bottom-1 -right-1 text-sm leading-none">
                          {icon}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white leading-relaxed">
                          <span className="font-semibold">@{notif.actor?.username}</span>{' '}
                          <span className="text-[#8B8BAD]">{message}</span>
                        </p>
                        <p className="text-xs text-[#555575] mt-0.5">{timeAgo(notif.created_at)}</p>
                      </div>
                      {!notif.read && (
                        <div className="w-2 h-2 rounded-full bg-[#FF4D6A] flex-shrink-0" />
                      )}
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
