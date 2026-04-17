'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Zap } from 'lucide-react';
import type { Reactor } from '@/lib/reactors/types';

interface ReactorCardProps {
  reactor: Reactor;
}

export default function ReactorCard({ reactor }: ReactorCardProps) {
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
    <Link href={`/reactors/${reactor.id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg">{reactor.plant}</CardTitle>
            <Badge className={statusColors[reactor.status]}>{statusLabel[reactor.status]}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{reactor.name}</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {(reactor.type || reactor.capacityMWe != null) && (
              <div className="flex items-center gap-2 text-sm">
                <Zap className="h-4 w-4 text-muted-foreground" />
                {reactor.type && <span>{reactor.type}</span>}
                {reactor.capacityMWe != null && (
                  <span className="text-muted-foreground">
                    {reactor.type ? ' • ' : ''}
                    {reactor.capacityMWe} MWe
                  </span>
                )}
              </div>
            )}
            {reactor.operator && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{reactor.operator}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
