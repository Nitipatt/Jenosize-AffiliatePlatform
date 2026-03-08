'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { fetchWithAuth } from '../../lib/api';
import { useTranslation } from '../../lib/i18n/context';
import LanguageSwitcher from '../../components/LanguageSwitcher';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === '/admin/login';
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const { t } = useTranslation();

  const navItems = [
    { href: '/admin/dashboard', label: t('common.dashboard'), icon: '📊' },
    { href: '/admin/products', label: t('common.products'), icon: '📦' },
    { href: '/admin/campaigns', label: t('common.campaigns'), icon: '📣' },
    { href: '/admin/links', label: t('common.links'), icon: '🔗' },
  ];

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'}/api/auth/me`);
        if (!mounted) return;
        
        if (res.ok) {
          if (isLoginPage) {
            router.push('/admin/dashboard');
          } else {
            setIsAuthenticated(true);
          }
        } else {
          if (!isLoginPage) {
            router.push('/admin/login');
          } else {
            setIsAuthenticated(false);
          }
        }
      } catch {
        if (!mounted) return;
        if (!isLoginPage) {
          router.push('/admin/login');
        } else {
          setIsAuthenticated(false);
        }
      }
    };

    checkAuth();
    
    return () => {
      mounted = false;
    };
  }, [isLoginPage, router]);

  // Prevent flashing of content while checking auth status
  if (isAuthenticated === null || (isLoginPage && isAuthenticated !== false)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isLoginPage) {
    return <main className="min-h-screen bg-gray-50">{children}</main>;
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar (Fixed) */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 p-6 flex flex-col z-50 shadow-sm">
        <Link href="/" className="flex items-center gap-3 mb-10">
          <img src="/jenosize-logo.svg" alt="Jenosize" className="h-8" />
        </Link>

        <nav className="space-y-1 flex-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:text-[#0166E0] hover:bg-[#0166E0]/5 transition-all duration-200 group"
            >
              <span className="text-lg">{item.icon}</span>
              <span className="font-medium text-sm">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-gray-100 space-y-3">
          <div className="flex items-center justify-center">
            <LanguageSwitcher />
          </div>
          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition"
          >
            <span>🌐</span>
            <span className="text-sm">{t('common.viewPublicSite')}</span>
          </Link>
          <button
            onClick={async () => {
              try {
                await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'}/api/auth/logout`, {
                  method: 'POST',
                  credentials: 'include',
                });
                window.location.href = '/admin/login';
              } catch (e) {
                console.error(e);
              }
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500/80 hover:text-red-400 hover:bg-red-500/10 transition text-left"
          >
            <span>🚪</span>
            <span className="text-sm">{t('common.logout')}</span>
          </button>
        </div>
      </aside>

      {/* Main Content (Offset by sidebar width) */}
      <main className="flex-1 ml-64 p-8 min-h-screen text-gray-900">{children}</main>
    </div>
  );
}
