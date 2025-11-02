'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Zap } from 'lucide-react';
import { Reactor } from '@/types';

interface ReactorCardProps {
  reactor: Reactor;
}

export default function ReactorCard({ reactor }: ReactorCardProps) {
  const statusColors: Record<string, string> = {
    'Operating': 'bg-green-500',
    'Under Construction': 'bg-blue-500',
    'Planned': 'bg-yellow-500',
    'Decommissioned': 'bg-gray-500',
  };

  return (
    <Link href={`/reactors/${reactor.id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg">{reactor.plant_name}</CardTitle>
            <Badge className={statusColors[reactor.status || 'Operating']}>
              {reactor.status}
            </Badge>
          </div>
          {reactor.unit_name && (
            <p className="text-sm text-muted-foreground">{reactor.unit_name}</p>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {reactor.reactor_type && (
              <div className="flex items-center gap-2 text-sm">
                <Zap className="h-4 w-4 text-muted-foreground" />
                <span>{reactor.reactor_type}</span>
                {reactor.net_capacity_mwe && (
                  <span className="text-muted-foreground">
                    • {reactor.net_capacity_mwe} MW
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
