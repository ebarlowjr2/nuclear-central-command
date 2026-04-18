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
    { href: '/companies', label: 'Companies' },
    { href: '/countries', label: 'Countries' },
    { href: '/countries/compare', label: 'Compare' },
    { href: '/learn', label: 'Learn' },
    { href: '/news', label: 'News' },
  ];

  return (
    <nav className="border-b bg-card">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <Atom className="h-6 w-6 text-primary" />
            <span>Nuclear Command Center</span>
          </Link>
          
          <div className="flex gap-6">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-primary ${
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
