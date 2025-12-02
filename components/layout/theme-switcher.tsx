'use client';

import { useEffect, useState } from 'react';
import { Palette, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

type Theme = 'classic' | 'light' | 'rich' | 'modern';

const themes: { id: Theme; name: string; description: string }[] = [
  {
    id: 'classic',
    name: 'Granola Classic',
    description: 'Warm cream with espresso accents',
  },
  {
    id: 'light',
    name: 'Granola Light',
    description: 'Minimal and airy',
  },
  {
    id: 'rich',
    name: 'Granola Rich',
    description: 'Deeper tones, more contrast',
  },
  {
    id: 'modern',
    name: 'Granola Modern',
    description: 'Cooler tones, contemporary',
  },
];

export function ThemeSwitcher() {
  const [currentTheme, setCurrentTheme] = useState<Theme>('classic');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load saved theme from localStorage
    const saved = localStorage.getItem('ui-theme') as Theme;
    if (saved && themes.some((t) => t.id === saved)) {
      setCurrentTheme(saved);
      document.documentElement.setAttribute('data-theme', saved);
    } else {
      document.documentElement.setAttribute('data-theme', 'classic');
    }
  }, []);

  const handleThemeChange = (theme: Theme) => {
    setCurrentTheme(theme);
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ui-theme', theme);
  };

  // Prevent hydration mismatch by only rendering on client
  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
        disabled
      >
        <Palette className="h-4 w-4" />
        <span className="text-sm">Theme</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
        >
          <Palette className="h-4 w-4" />
          <span className="text-sm">Theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {themes.map((theme) => (
          <DropdownMenuItem
            key={theme.id}
            onClick={() => handleThemeChange(theme.id)}
            className="flex items-start gap-3 p-3 cursor-pointer"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">{theme.name}</p>
                {currentTheme === theme.id && (
                  <Check className="h-3.5 w-3.5 text-primary" />
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {theme.description}
              </p>
            </div>
            <div
              className={`h-6 w-6 rounded-md border-2 border-border ${
                theme.id === 'classic'
                  ? 'bg-gradient-to-br from-amber-100 to-amber-50'
                  : theme.id === 'light'
                  ? 'bg-gradient-to-br from-stone-50 to-white'
                  : theme.id === 'rich'
                  ? 'bg-gradient-to-br from-amber-800 to-amber-900'
                  : 'bg-gradient-to-br from-slate-100 to-blue-50'
              }`}
            />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


