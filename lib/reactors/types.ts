export type ReactorStatus =
  | 'operating'
  | 'suspended'
  | 'shutdown'
  | 'under_construction'
  | 'planned';

export type Reactor = {
  id: string;
  name: string;
  plant: string;
  country: string;
  lat: number | null;
  lng: number | null;
  status: ReactorStatus;
  capacityMWe: number | null;
  type?: string;
  operator?: string;
  source: string;
  lastUpdated: string; // ISO string
};

