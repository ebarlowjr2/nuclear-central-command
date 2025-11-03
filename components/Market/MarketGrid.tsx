'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

type Item = {
  symbol: string;
  name: string;
  category: string;
  exchange?: string | null;
  price?: number | null;
  change_pct?: number | null;
  currency?: string | null;
  updated_at?: string | null;
};

export function MarketGrid({ category }: { category: string }) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/market/list?category=${encodeURIComponent(category)}`)
      .then(r => r.json())
      .then(j => setItems(j.items ?? []))
      .catch(err => {
        console.error('Error fetching market data:', err);
        setItems([]);
      })
      .finally(() => setLoading(false));
  }, [category]);

  if (loading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-6 w-16 mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-8 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="text-sm text-muted-foreground py-8 text-center">
        No instruments found in this category.
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {items.map(it => {
        const isVolatile = it.category === 'SMR/Advanced';
        const hasPrice = typeof it.price === 'number';
        const hasChange = typeof it.change_pct === 'number';
        
        return (
          <Card key={it.symbol} className="hover:shadow-lg transition-shadow border-glow">
            <CardContent className="p-4">
              <div className="flex items-baseline justify-between mb-1">
                <div className="text-lg font-semibold text-primary">{it.symbol}</div>
                {hasChange && (
                  <span className={`text-sm font-medium ${it.change_pct! >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {it.change_pct! >= 0 ? '+' : ''}{it.change_pct!.toFixed(2)}%
                  </span>
                )}
              </div>
              
              <div className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {it.name}
              </div>
              
              <div className="mb-3">
                <div className="text-2xl font-bold">
                  {hasPrice ? `$${it.price!.toFixed(2)}` : '—'}
                  {hasPrice && (
                    <span className="ml-2 text-xs text-muted-foreground font-normal">
                      {it.currency || 'USD'}
                    </span>
                  )}
                </div>
                {it.exchange && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {it.exchange}
                  </div>
                )}
              </div>

              {isVolatile && (
                <Badge variant="destructive" className="mb-2 text-xs">
                  High Volatility
                </Badge>
              )}

              <div className="pt-2 border-t border-border">
                <a
                  href={`/learn?symbol=${it.symbol}`}
                  className="text-xs text-primary hover:text-primary/80 underline"
                >
                  Learn about {it.symbol} →
                </a>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
