'use client';

import { useEffect, useState } from 'react';
import StatsCards from '@/components/StatsCards';
import ReactorCard from '@/components/ReactorCard';
import FactCard from '@/components/FactCard';
import { MarketTabs } from '@/components/Market/MarketTabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Reactor, Fact } from '@/types';

export default function Home() {
  const [stats, setStats] = useState<any>(null);
  const [underConstruction, setUnderConstruction] = useState<Reactor[]>([]);
  const [topReactors, setTopReactors] = useState<any[]>([]);
  const [facts, setFacts] = useState<Fact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, ucRes, topRes] = await Promise.all([
          fetch('/api/stats/global'),
          fetch('/api/reactors/list?status=Under Construction&limit=3'),
          fetch('/api/stats/top?metric=capacity&scope=country&limit=5'),
        ]);

        const statsData = await statsRes.json();
        const ucData = await ucRes.json();
        const topData = await topRes.json();

        setStats(statsData);
        setUnderConstruction(ucData.data || []);
        setTopReactors(topData.data || []);

        const sampleFacts: Fact[] = [
          {
            title: 'Nuclear Power is Carbon-Free',
            body: 'Nuclear power plants produce no greenhouse gas emissions during operation, making them a key technology for combating climate change.',
            category: 'environment',
            tags: ['climate', 'emissions'],
          },
          {
            title: 'PWR vs BWR',
            body: 'Pressurized Water Reactors (PWR) and Boiling Water Reactors (BWR) are the two most common reactor types, with PWR using a separate steam generator while BWR boils water directly in the reactor core.',
            category: 'technology',
            tags: ['reactor types', 'engineering'],
          },
          {
            title: 'Nuclear Fuel Efficiency',
            body: 'A single uranium fuel pellet the size of a fingertip contains as much energy as 17,000 cubic feet of natural gas, 1,780 pounds of coal, or 149 gallons of oil.',
            category: 'fuel',
            tags: ['efficiency', 'fuel'],
          },
        ];
        setFacts(sampleFacts);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2">Nuclear Command Center</h1>
        <p className="text-muted-foreground">
          Global nuclear reactor tracking, statistics, and educational resources
        </p>
      </div>

      {stats && <StatsCards stats={stats} />}

      <div className="grid gap-6 md:gap-8 grid-cols-1 md:grid-cols-2">
        <div>
          <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">Under Construction Now</h2>
          <div className="space-y-3 md:space-y-4">
            {underConstruction.length > 0 ? (
              underConstruction.map((reactor) => (
                <ReactorCard key={reactor.id} reactor={reactor} />
              ))
            ) : (
              <p className="text-muted-foreground">No reactors under construction data available</p>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">Top Capacity by Country</h2>
          {topReactors.length > 0 ? (
            <div className="space-y-2">
              {topReactors.map((country, idx) => (
                <div
                  key={country.country_id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <span className="font-medium">{idx + 1}. {country.country_name}</span>
                    <p className="text-sm text-muted-foreground">
                      {country.reactor_count} reactors
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{Math.round(country.total_capacity).toLocaleString()} MW</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No country data available</p>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">Did You Know?</h2>
        <div className="grid gap-4 md:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {facts.map((fact, idx) => (
            <FactCard key={idx} fact={fact} />
          ))}
        </div>
      </div>

      <section>
        <MarketTabs />
      </section>
    </div>
  );
}
