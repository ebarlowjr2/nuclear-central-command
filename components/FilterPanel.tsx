'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface FilterPanelProps {
  onFilterChange: (filters: {
    status?: string;
    type?: string;
    country?: string;
    search?: string;
  }) => void;
}

export default function FilterPanel({ onFilterChange }: FilterPanelProps) {
  const [status, setStatus] = useState<string>('');
  const [type, setType] = useState<string>('');
  const [country, setCountry] = useState<string>('');
  const [search, setSearch] = useState<string>('');

  const handleApply = () => {
    onFilterChange({
      status: status || undefined,
      type: type || undefined,
      country: country || undefined,
      search: search || undefined,
    });
  };

  const handleReset = () => {
    setStatus('');
    setType('');
    setCountry('');
    setSearch('');
    onFilterChange({});
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Search</label>
          <Input
            placeholder="Search reactors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Status</label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="operating">Operating</SelectItem>
              <SelectItem value="suspended">Suspended / Offline</SelectItem>
              <SelectItem value="under_construction">Under Construction</SelectItem>
              <SelectItem value="planned">Planned</SelectItem>
              <SelectItem value="shutdown">Shutdown</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Reactor Type</label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger>
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="PWR">PWR</SelectItem>
              <SelectItem value="BWR">BWR</SelectItem>
              <SelectItem value="PHWR">PHWR</SelectItem>
              <SelectItem value="FBR">FBR</SelectItem>
              <SelectItem value="HTGR">HTGR</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Country</label>
          <Input
            placeholder="Country name (e.g., United States)"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={handleApply} className="flex-1">
            Apply
          </Button>
          <Button onClick={handleReset} variant="outline" className="flex-1">
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
