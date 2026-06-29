'use client';

import dynamic from 'next/dynamic';

const WorldMap = dynamic(() => import('@/components/WorldMap'), { ssr: false });

export default function MapPage() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        top: 64,
        background: '#020617',
      }}
    >
      <WorldMap fullScreen />
    </div>
  );
}
