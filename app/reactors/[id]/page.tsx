'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import TrendsChart from '@/components/TrendsChart';
import { MapPin, Zap, Building2, Calendar } from 'lucide-react';

export default function ReactorDetailPage() {
  const params = useParams();
  const [data, setData] = useState<any>(null);
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

  const statusColors: Record<string, string> = {
    'Operating': 'bg-green-500',
    'Under Construction': 'bg-blue-500',
    'Planned': 'bg-yellow-500',
    'Decommissioned': 'bg-gray-500',
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-start justify-between mb-2">
          <h1 className="text-4xl font-bold">{reactor.plant_name}</h1>
          <Badge className={statusColors[reactor.status || 'Operating']}>
            {reactor.status}
          </Badge>
        </div>
        {reactor.unit_name && (
          <p className="text-xl text-muted-foreground">{reactor.unit_name}</p>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Technical Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {reactor.reactor_type && (
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Type:</span>
                <span>{reactor.reactor_type}</span>
              </div>
            )}
            {reactor.net_capacity_mwe && (
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Capacity:</span>
                <span>{reactor.net_capacity_mwe} MW(e)</span>
              </div>
            )}
            {reactor.thermal_power_mwt && (
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Thermal Power:</span>
                <span>{reactor.thermal_power_mwt} MW(th)</span>
              </div>
            )}
            {reactor.operator && (
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Operator:</span>
                <span>{reactor.operator}</span>
              </div>
            )}
            {reactor.owner && (
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Owner:</span>
                <span>{reactor.owner}</span>
              </div>
            )}
            {reactor.supplier && (
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Supplier:</span>
                <span>{reactor.supplier}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {reactor.construction_start && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Construction Start:</span>
                <span>{new Date(reactor.construction_start).toLocaleDateString()}</span>
              </div>
            )}
            {reactor.first_grid_connection && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">First Grid Connection:</span>
                <span>{new Date(reactor.first_grid_connection).toLocaleDateString()}</span>
              </div>
            )}
            {reactor.commercial_operation && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Commercial Operation:</span>
                <span>{new Date(reactor.commercial_operation).toLocaleDateString()}</span>
              </div>
            )}
            {reactor.shutdown_date && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Shutdown:</span>
                <span>{new Date(reactor.shutdown_date).toLocaleDateString()}</span>
              </div>
            )}
            {reactor.latitude && reactor.longitude && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Location:</span>
                <span>{reactor.latitude.toFixed(4)}, {reactor.longitude.toFixed(4)}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {generation && generation.length > 0 && (
        <TrendsChart
          data={generation.map((g: any) => ({
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
                  <Badge className={statusColors[sh.status]}>{sh.status}</Badge>
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
