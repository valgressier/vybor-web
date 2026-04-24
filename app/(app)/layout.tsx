import { Navbar } from '@/components/Navbar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Navbar />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 pb-24 md:pb-6">
        {children}
      </main>
    </div>
  );
}
