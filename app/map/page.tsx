'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const MapComponent = dynamic(() => import('@/components/WorldMap'), {
  ssr: false,
  loading: () => <Skeleton className="h-[600px] w-full" />,
});

export default function MapPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">Global Reactor Map</h1>
        <p className="text-muted-foreground">
          Interactive map of nuclear reactors worldwide
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reactor Locations</CardTitle>
        </CardHeader>
        <CardContent>
          <MapComponent />
        </CardContent>
      </Card>
    </div>
  );
}
