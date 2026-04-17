'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import TrendsChart from '@/components/TrendsChart';
import { MapPin, Zap, Building2 } from 'lucide-react';
import type { Reactor } from '@/lib/reactors/types';

export default function ReactorDetailPage() {
  const params = useParams();
  const [data, setData] = useState<{
    reactor: Reactor | null;
    generation: Array<{ year: number; month: number; net_mwh?: number | null }>;
    statusHistory: Array<{ status: string; effective_date: string }>;
    source?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReactor() {
      try {
        const res = await fetch(`/api/reactors/${params.id}`);
        const result = await res.json();
        setData(result);
      } catch (error) {
        console.error('Error fetching reactor:', error);
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      fetchReactor();
    }
  }, [params.id]);

  if (loading) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (!data || !data.reactor) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Reactor not found</p>
      </div>
    );
  }

  const { reactor, generation, statusHistory } = data;

  const statusColors: Record<Reactor['status'], string> = {
    operating: 'bg-emerald-500',
    suspended: 'bg-yellow-500',
    under_construction: 'bg-blue-500',
    planned: 'bg-purple-500',
    shutdown: 'bg-slate-400',
  };

  const statusLabel: Record<Reactor['status'], string> = {
    operating: 'Operating',
    suspended: 'Suspended / Offline',
    under_construction: 'Under Construction',
    planned: 'Planned',
    shutdown: 'Shutdown',
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-start justify-between mb-2">
          <h1 className="text-4xl font-bold">{reactor.plant}</h1>
          <Badge className={statusColors[reactor.status]}>{statusLabel[reactor.status]}</Badge>
        </div>
        <p className="text-xl text-muted-foreground">{reactor.name}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Technical Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {reactor.type && (
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Type:</span>
                <span>{reactor.type}</span>
              </div>
            )}
            {reactor.capacityMWe != null && (
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Capacity:</span>
                <span>{reactor.capacityMWe} MWe</span>
              </div>
            )}
            {reactor.operator && (
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Operator:</span>
                <span>{reactor.operator}</span>
              </div>
            )}
            <div className="text-xs text-muted-foreground">
              Source: {reactor.source} • Updated: {new Date(reactor.lastUpdated).toLocaleDateString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(typeof reactor.lat === 'number' || typeof reactor.lng === 'number') && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Location:</span>
                <span>
                  {typeof reactor.lat === 'number' ? reactor.lat.toFixed(4) : '—'},{' '}
                  {typeof reactor.lng === 'number' ? reactor.lng.toFixed(4) : '—'}
                </span>
              </div>
            )}
            <div className="text-sm text-muted-foreground">
              Timeline details appear when present in the local DB.
            </div>
          </CardContent>
        </Card>
      </div>

      {generation && generation.length > 0 && (
        <TrendsChart
          data={generation.map((g) => ({
            period: `${g.year}-${String(g.month).padStart(2, '0')}`,
            net_mwh: g.net_mwh || 0,
          }))}
          title="Recent Generation (MWh)"
          dataKey="net_mwh"
          xKey="period"
        />
      )}

      {statusHistory && statusHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Status History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {statusHistory.map((sh: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 border rounded">
                  <Badge className="bg-slate-200 text-slate-900">{sh.status}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {new Date(sh.effective_date).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
