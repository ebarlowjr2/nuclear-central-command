'use client';

import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import PageHeader from '@/components/layout/PageHeader';

const MapComponent = dynamic(() => import('@/components/WorldMap'), {
  ssr: false,
  loading: () => <Skeleton className="h-[600px] w-full" />,
});

export default function MapPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Global • Interactive"
        title="Global Reactor Map"
        subtitle="Explore reactor locations worldwide, filter by status and type, and compare regions at a glance."
      />

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
