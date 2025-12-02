import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";

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
    <html lang="en" data-theme="classic">
      <body className="antialiased min-h-screen bg-background bg-grain">
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 ml-64">
            <div className="min-h-screen">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
