import type { Metadata } from "next";
import "./globals.css";

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
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 h-16 flex items-center">
            <h1 className="text-xl font-bold text-primary">Rehab Case Copilot</h1>
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
