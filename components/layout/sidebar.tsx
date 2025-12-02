'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  FolderOpen, 
  CheckSquare, 
  FileText, 
  Calendar,
  Settings,
  Sparkles,
  ChevronRight,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeSwitcher } from './theme-switcher';

type NavItem = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
};

const navigation: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Cases',
    href: '/cases',
    icon: FolderOpen,
  },
  {
    name: 'Tasks',
    href: '/tasks',
    icon: CheckSquare,
  },
  {
    name: 'Calendar',
    href: '/calendar',
    icon: Calendar,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [username, setUsername] = useState<string>('User');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch current user
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUsername(data.user.username);
        }
      })
      .catch(() => {
        // Not logged in or error
      });
  }, []);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border/60 bg-sidebar/80 backdrop-blur-xl">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-20 items-center gap-3 px-6 border-b border-border/60">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-soft-sm">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-foreground" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
              Rehab Copilot
            </h1>
            <p className="text-xs text-muted-foreground">Case Management</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navigation.map((item, index) => {
            const isActive = pathname === item.href || 
              (item.href !== '/' && pathname.startsWith(item.href));
            
            return (
              <Link
                key={item.name}
                href={item.badge ? '#' : item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-smooth",
                  "animate-fade-in-up",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-soft-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  item.badge && "opacity-60 cursor-not-allowed"
                )}
                style={{ animationDelay: `${index * 0.05}s` }}
                onClick={item.badge ? (e) => e.preventDefault() : undefined}
              >
                <item.icon className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  !isActive && "group-hover:scale-110"
                )} />
                <span className="flex-1">{item.name}</span>
                {item.badge ? (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {item.badge}
                  </span>
                ) : isActive ? (
                  <ChevronRight className="h-4 w-4 opacity-60" />
                ) : null}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="border-t border-border/60 p-4 space-y-2">
          <ThemeSwitcher />
          <div className="rounded-xl bg-accent/50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-background shadow-soft-sm">
                <Settings className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">Settings</p>
                <p className="text-xs text-muted-foreground">Configure your workspace</p>
              </div>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="border-t border-border/60 p-4 space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
              <span className="text-sm font-semibold text-primary">{username.charAt(0).toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{username}</p>
              <p className="text-xs text-muted-foreground">Professional Account</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            disabled={loading}
            className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors disabled:opacity-50"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
}

