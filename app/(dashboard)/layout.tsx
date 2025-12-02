import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSession();
  
  if (!user) {
    redirect('/login');
  }

  return (
    <>
      <Sidebar />
      <main className="flex-1 ml-64">
        <div className="min-h-screen">
          {children}
        </div>
      </main>
    </>
  );
}

