import type { Metadata } from "next";
import "./globals.css";
import Link from 'next/link';
import { Home, FolderOpen, CheckSquare } from 'lucide-react';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: "Rehab Case Copilot",
  description: "AI-powered case management for rehabilitation consultants",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-background">
        <header className="border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 sticky top-0 z-50">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">RC</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-foreground">Rehab Case Copilot</h1>
                <p className="text-xs text-muted-foreground -mt-0.5">AI-Powered Case Management</p>
              </div>
            </Link>
            
            <nav className="flex items-center gap-1">
              <Link 
                href="/dashboard" 
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
              <Link 
                href="/cases" 
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <FolderOpen className="h-4 w-4" />
                <span className="hidden sm:inline">Cases</span>
              </Link>
              <Link 
                href="/tasks" 
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <CheckSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Tasks</span>
              </Link>
            </nav>
          </div>
        </header>
        <main className="min-h-[calc(100vh-4rem)]">{children}</main>
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}
