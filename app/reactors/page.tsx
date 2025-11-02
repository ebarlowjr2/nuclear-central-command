'use client';

import { useEffect, useState } from 'react';
import ReactorCard from '@/components/ReactorCard';
import FilterPanel from '@/components/FilterPanel';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Reactor } from '@/types';

export default function ReactorsPage() {
  const [reactors, setReactors] = useState<Reactor[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<any>({});
  const [offset, setOffset] = useState(0);
  const limit = 12;

  useEffect(() => {
    async function fetchReactors() {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          limit: limit.toString(),
          offset: offset.toString(),
          ...(filters.status && filters.status !== 'all' ? { status: filters.status } : {}),
          ...(filters.type && filters.type !== 'all' ? { type: filters.type } : {}),
          ...(filters.country ? { country: filters.country } : {}),
        });

        const res = await fetch(`/api/reactors/list?${params}`);
        const data = await res.json();
        setReactors(data.data || []);
      } catch (error) {
        console.error('Error fetching reactors:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchReactors();
  }, [filters, offset]);

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
    setOffset(0);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">Reactor Directory</h1>
        <p className="text-muted-foreground">
          Browse and filter nuclear reactors worldwide
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-4">
        <div className="md:col-span-1">
          <FilterPanel onFilterChange={handleFilterChange} />
        </div>

        <div className="md:col-span-3">
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          ) : reactors.length > 0 ? (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {reactors.map((reactor) => (
                  <ReactorCard key={reactor.id} reactor={reactor} />
                ))}
              </div>
              <div className="flex gap-2 mt-6 justify-center">
                <Button
                  onClick={() => setOffset(Math.max(0, offset - limit))}
                  disabled={offset === 0}
                  variant="outline"
                >
                  Previous
                </Button>
                <Button
                  onClick={() => setOffset(offset + limit)}
                  disabled={reactors.length < limit}
                  variant="outline"
                >
                  Next
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No reactors found matching your filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
