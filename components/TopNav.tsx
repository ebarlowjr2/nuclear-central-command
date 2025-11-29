'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Atom } from 'lucide-react';

export default function TopNav() {
  const pathname = usePathname();

  const links = [
    { href: '/', label: 'Dashboard' },
    { href: '/map', label: 'Map' },
    { href: '/reactors', label: 'Reactors' },
    { href: '/countries', label: 'Countries' },
    { href: '/countries/compare', label: 'Compare' },
    { href: '/learn', label: 'Learn' },
    { href: '/blog', label: 'Blog' },
    { href: '/in-the-news', label: 'In the News' },
  ];

  return (
    <nav className="border-b bg-card">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-base md:text-xl">
            <Atom className="h-5 w-5 md:h-6 md:w-6 text-primary" />
            <span className="hidden sm:inline">Nuclear Command Center</span>
            <span className="sm:hidden">NCC</span>
          </Link>
          
          <div className="flex gap-3 md:gap-6 flex-wrap">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-xs md:text-sm font-medium transition-colors hover:text-primary ${
                  pathname === link.href
                    ? 'text-primary'
                    : 'text-muted-foreground'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
