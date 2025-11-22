import { ReactNode } from 'react';
import { Heart, MessageCircle, User, Compass, Flame, Lock } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  currentPage: 'discover' | 'blazebold' | 'challenges' | 'glowvault' | 'devilsden' | 'pridecircles' | 'messages' | 'profile' | 'premium';
}

export default function Layout({ children, currentPage }: LayoutProps) {
  const navItems = [
    { id: 'discover', icon: Compass, label: 'Discover', href: '/discover' },
    { id: 'blazebold', icon: Flame, label: 'Blaze', href: '/blazebold' },
    { id: 'devilsden', icon: Lock, label: "Devil's Den", href: '/devilsden' },
    { id: 'pridecircles', icon: Heart, label: 'Circles', href: '/pridecircles' },
    { id: 'messages', icon: MessageCircle, label: 'Messages', href: '/messages' },
  ];

  return (
    <div className="min-h-screen bg-[#1a1a1a] pb-20">
      <header className="bg-[#2a2a2a] shadow-lg sticky top-0 z-10 border-b border-[#ff5555]/20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-r from-[#ff5555] to-[#ff9500] rounded-full p-2 fiery-glow">
                <Flame className="w-5 h-5 text-white" fill="white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-[#ff5555] to-[#ff9500] bg-clip-text text-transparent">
                BeProudly
              </h1>
            </div>
            <a
              href="/profile"
              className="flex items-center gap-2 bg-[#1a1a1a] hover:bg-[#3a3a3a] px-3 py-2 rounded-full transition"
            >
              <User className="w-5 h-5 text-white" />
            </a>
          </div>
        </div>
      </header>

      <main>{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 bg-[#2a2a2a] border-t border-[#ff5555]/20 shadow-2xl">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-around">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <a
                  key={item.id}
                  href={item.href}
                  className={`flex flex-col items-center gap-1 py-3 px-2 transition ${
                    isActive
                      ? 'text-[#ff5555]'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" fill={isActive && (item.id === 'blazebold' || item.id === 'pridecircles') ? 'currentColor' : 'none'} />
                  <span className="text-xs font-medium">{item.label}</span>
                </a>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}
