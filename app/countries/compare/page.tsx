'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import TrendsChart from '@/components/TrendsChart';

export default function ComparePage() {
  const [country1, setCountry1] = useState('');
  const [country2, setCountry2] = useState('');
  const [compareData, setCompareData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleCompare = async () => {
    if (!country1 || !country2) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/countries/compare?ids=${country1},${country2}`);
      const data = await res.json();
      setCompareData(data);
    } catch (error) {
      console.error('Error comparing countries:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">Country Comparison</h1>
        <p className="text-muted-foreground">
          Compare nuclear energy statistics between two countries
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Countries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="Country 1 ID"
              value={country1}
              onChange={(e) => setCountry1(e.target.value)}
            />
            <Input
              placeholder="Country 2 ID"
              value={country2}
              onChange={(e) => setCountry2(e.target.value)}
            />
            <Button onClick={handleCompare} disabled={loading}>
              {loading ? 'Loading...' : 'Compare'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {compareData && (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {compareData.countries?.map((country: any) => (
              <Card key={country.id}>
                <CardHeader>
                  <CardTitle>{country.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm">
                      <span className="font-medium">Region:</span> {country.region}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">ISO Code:</span> {country.iso2}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {compareData.stats && compareData.stats.length > 0 && (
            <TrendsChart
              data={compareData.stats}
              title="Nuclear Generation Comparison (TWh)"
              dataKey="nuclear_twh"
            />
          )}
        </div>
      )}
    </div>
  );
}
