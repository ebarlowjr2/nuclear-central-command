'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

// Reuse the map component but keep the preview wrapper lightweight.
const Map = dynamic(() => import('@/components/WorldMap'), {
  ssr: false,
  loading: () => <Skeleton className="h-[420px] w-full" />,
});

export default function WorldMapPreview() {
  return <Map />;
}

