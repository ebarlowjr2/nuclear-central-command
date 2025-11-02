'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Reactor } from '@/types';

const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function WorldMap() {
  const [reactors, setReactors] = useState<Reactor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReactors() {
      try {
        const res = await fetch('/api/reactors/list?limit=500');
        const data = await res.json();
        setReactors(data.data?.filter((r: Reactor) => r.latitude && r.longitude) || []);
      } catch (error) {
        console.error('Error fetching reactors:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchReactors();
  }, []);

  if (loading) {
    return <div className="h-[600px] w-full flex items-center justify-center">Loading map...</div>;
  }

  return (
    <div className="h-[600px] w-full">
      <MapContainer
        center={[20, 0]}
        zoom={2}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {reactors.map((reactor) => (
          <Marker
            key={reactor.id}
            position={[reactor.latitude!, reactor.longitude!]}
            icon={icon}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-bold">{reactor.plant_name}</h3>
                {reactor.unit_name && <p className="text-sm">{reactor.unit_name}</p>}
                <p className="text-sm text-gray-600">{reactor.status}</p>
                {reactor.net_capacity_mwe && (
                  <p className="text-sm">{reactor.net_capacity_mwe} MW</p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
