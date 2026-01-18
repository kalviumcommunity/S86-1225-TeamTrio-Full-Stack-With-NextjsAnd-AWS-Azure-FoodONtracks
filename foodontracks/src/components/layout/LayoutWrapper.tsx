'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Check if current page is a dashboard page
  const isDashboardPage = pathname?.startsWith('/dashboard');
  
  // Auth pages that should not have Header/Sidebar (clean standalone pages)
  const isAuthPage = pathname === '/login' || pathname === '/signup';

  // If it's an auth page (login, signup), render children without any layout
  if (isAuthPage) {
    return <>{children}</>;
  }

  // Dashboard pages have their own layouts with sidebars, but need Header
  if (isDashboardPage) {
    return (
      <div className="flex flex-col h-screen">
        <Header />
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    );
  }

  // Homepage and other pages (/, /restaurants, /cart, etc.) get Header only
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
