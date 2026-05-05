'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/auth';
import { Avatar } from './Avatar';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function Navbar() {
  const pathname = usePathname();
  const { user, profile } = useAuth();
  const [unreadMsgs, setUnreadMsgs] = useState(0);
  const [unreadNotifs, setUnreadNotifs] = useState(0);

  useEffect(() => {
    if (!user) return;
    const fetchCounts = async () => {
      const [{ count: msgCount }, { count: notifCount }] = await Promise.all([
        supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .neq('sender_id', user.id)
          .is('read_at', null),
        supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('read', false),
      ]);
      setUnreadMsgs(msgCount ?? 0);
      setUnreadNotifs(notifCount ?? 0);
    };
    fetchCounts();
  }, [user, pathname]);

  const navItems = [
    { href: '/feed', label: 'Feed', icon: HomeIcon },
    { href: '/search', label: 'Recherche', icon: SearchIcon },
    { href: '/messages', label: 'Messages', icon: MessageIcon, badge: unreadMsgs },
    { href: '/notifications', label: 'Notifications', icon: BellIcon, badge: unreadNotifs },
    { href: profile ? `/profile/${profile.id}` : '/profile', label: 'Profil', icon: UserIcon },
    { href: '/settings', label: 'Paramètres', icon: SettingsIcon },
  ];

  const isActive = (href: string) => {
    if (href === '/feed') return pathname === '/feed' || pathname === '/';
    const segment = href.split('/')[1];
    if (!segment) return false;
    return pathname.startsWith(`/${segment}`);
  };

  return (
    <>
      {/* Desktop sidebar */}
      <nav className="hidden md:flex flex-col w-64 h-screen sticky top-0 border-r border-[#252538] bg-[#0D0D14] p-6 shrink-0">
        <Link href="/feed" className="mb-10 block">
          <span
            className="text-3xl font-extrabold tracking-tight"
            style={{
              background: 'linear-gradient(135deg, #FF4D6A, #8B5CF6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Vybor
          </span>
        </Link>

        <Link
          href="/create"
          className="flex items-center justify-center gap-2 mb-5 py-2.5 rounded-xl font-bold text-sm text-white hover:opacity-90 active:scale-95 transition-all"
          style={{ background: 'linear-gradient(135deg, #FF4D6A, #8B5CF6)' }}
        >
          <span className="text-base leading-none">+</span>
          Poser une question
        </Link>

        <div className="flex flex-col gap-1 flex-1">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors relative group ${
                  active
                    ? 'bg-[#FF4D6A]/10 text-white font-semibold'
                    : 'text-[#8B8BAD] hover:bg-[#16161F] hover:text-white'
                }`}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-[#FF4D6A]" />
                )}
                <Icon
                  size={20}
                  className={active ? 'text-[#FF4D6A]' : 'text-[#555575] group-hover:text-white'}
                />
                <span className="text-[15px]">{item.label}</span>
                {(item.badge ?? 0) > 0 && (
                  <span className="ml-auto bg-[#FF4D6A] text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
                    {(item.badge ?? 0) > 99 ? '99+' : item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        <div className="border-t border-[#252538] pt-4 mt-2 flex gap-3">
          <Link href="/cgu" className="text-[10px] text-[#3a3a55] hover:text-[#555575] transition-colors">
            CGU
          </Link>
          <Link href="/privacy" className="text-[10px] text-[#3a3a55] hover:text-[#555575] transition-colors">
            Confidentialité
          </Link>
        </div>

        {profile && (
          <div className="border-t border-[#252538] pt-4 mt-4">
            <Link
              href={`/profile/${profile.id}`}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <Avatar uri={profile.avatar_url} username={profile.username} size={36} />
              <div className="overflow-hidden">
                <p className="text-sm font-semibold text-white truncate">@{profile.username}</p>
                {profile.bio && (
                  <p className="text-xs text-[#555575] truncate">{profile.bio}</p>
                )}
              </div>
            </Link>
          </div>
        )}
      </nav>

      {/* Mobile FAB */}
      <Link
        href="/create"
        className="md:hidden fixed bottom-20 right-4 z-50 w-12 h-12 rounded-full flex items-center justify-center shadow-lg shadow-[#FF4D6A]/30 text-white text-2xl font-bold"
        style={{ background: 'linear-gradient(135deg, #FF4D6A, #8B5CF6)' }}
      >
        +
      </Link>

      {/* Mobile bottom bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-[#0D0D14]/95 backdrop-blur border-t border-[#252538] z-50 flex safe-area-inset-bottom">
        {navItems.slice(0, 5).map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center py-2.5 gap-1 transition-colors relative ${
                active ? 'text-[#FF4D6A]' : 'text-[#555575]'
              }`}
            >
              <Icon size={22} />
              <span className="text-[9px] font-medium leading-none">{item.label}</span>
              {(item.badge ?? 0) > 0 && (
                <span className="absolute top-1.5 right-1/4 bg-[#FF4D6A] text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                  {(item.badge ?? 0) > 99 ? '99+' : item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </>
  );
}

function HomeIcon({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
    </svg>
  );
}

function MessageIcon({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
    </svg>
  );
}

function BellIcon({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
    </svg>
  );
}

function UserIcon({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
    </svg>
  );
}

function SettingsIcon({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
    </svg>
  );
}

function SearchIcon({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
