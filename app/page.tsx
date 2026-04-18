'use client';

import { useEffect, useState } from 'react';
import StatsCards from '@/components/StatsCards';
import ReactorCard from '@/components/ReactorCard';
import FactCard from '@/components/FactCard';
import { MarketTabs } from '@/components/Market/MarketTabs';
import { Skeleton } from '@/components/ui/skeleton';
import TopCountryGauges from '@/components/TopCountryGauges';
import type { Reactor } from '@/lib/reactors/types';
import type { Fact } from '@/types';
import Link from 'next/link';
import type { NewsItem } from '@/lib/news/types';
import type { Company } from '@/lib/companies/types';

export default function Home() {
  const [stats, setStats] = useState<any>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [underConstruction, setUnderConstruction] = useState<Reactor[]>([]);
  const [topReactors, setTopReactors] = useState<any[]>([]);
  const [facts, setFacts] = useState<Fact[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [newsError, setNewsError] = useState<string | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companiesError, setCompaniesError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, ucRes, topRes] = await Promise.all([
          fetch('/api/stats/global'),
          fetch('/api/reactors/list?status=under_construction&limit=3'),
          fetch('/api/stats/top?metric=capacity&scope=country&limit=5'),
        ]);

        const statsData = await statsRes.json();
        const ucData = await ucRes.json();
        const topData = await topRes.json();

        if (!statsRes.ok || statsData?.error) {
          setStats(null);
          setStatsError(
            statsData?.error ||
              'Unable to load global stats right now.'
          );
        } else {
          setStats(statsData);
          setStatsError(null);
        }

        setUnderConstruction(ucData?.data || []);
        setTopReactors(topData?.data || []);

        try {
          const newsRes = await fetch('/api/news/list?limit=6&offset=0');
          const newsJson = await newsRes.json();
          if (!newsRes.ok || newsJson?.error) {
            setNews([]);
            setNewsError(newsJson?.error || 'Unable to load news right now.');
          } else {
            setNews((newsJson?.data || []) as NewsItem[]);
            setNewsError(null);
          }
        } catch (e) {
          setNews([]);
          setNewsError('Unable to load news right now.');
        }

        try {
          const companiesRes = await fetch('/api/companies/list?limit=9&offset=0');
          const companiesJson = await companiesRes.json();
          if (!companiesRes.ok || companiesJson?.error) {
            setCompanies([]);
            setCompaniesError(companiesJson?.error || 'Unable to load companies right now.');
          } else {
            setCompanies((companiesJson?.data || []) as Company[]);
            setCompaniesError(null);
          }
        } catch (e) {
          setCompanies([]);
          setCompaniesError('Unable to load companies right now.');
        }

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
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <section className="hero-sky rounded-2xl border overflow-hidden">
        <div className="p-6 md:p-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border bg-white/70 px-3 py-1 text-xs text-slate-700">
              Education • Data • Deployment
            </div>
            <h1 className="mt-4 text-4xl md:text-5xl font-bold tracking-tight">
              Nuclear energy, explained with real-world data.
            </h1>
            <p className="mt-3 text-muted-foreground text-lg">
              Track reactors, follow credible news, and explore the companies building the next generation of clean power.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/map"
                className="h-10 inline-flex items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-95"
              >
                Explore the map
              </Link>
              <Link
                href="/reactors"
                className="h-10 inline-flex items-center justify-center rounded-md border bg-white px-4 text-sm font-medium hover:bg-slate-50"
              >
                Browse reactors
              </Link>
              <Link
                href="/learn"
                className="h-10 inline-flex items-center justify-center rounded-md border bg-white px-4 text-sm font-medium hover:bg-slate-50"
              >
                Learn Nuclear 101
              </Link>
            </div>
          </div>
        </div>
      </section>

      <TopCountryGauges />

      {stats ? (
        <StatsCards stats={stats} />
      ) : (
        <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
          {statsError || 'Global stats are temporarily unavailable.'}
        </div>
      )}

      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <h2 className="text-2xl font-bold mb-4">Under Construction Now</h2>
          <div className="space-y-4">
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
          <h2 className="text-2xl font-bold mb-4">Top Capacity by Country</h2>
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
        <h2 className="text-2xl font-bold mb-4">Did You Know?</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {facts.map((fact, idx) => (
            <FactCard key={idx} fact={fact} />
          ))}
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Latest News</h2>
            <p className="text-muted-foreground">Fresh headlines, ingested and stored locally.</p>
          </div>
          <Link className="text-sm text-primary hover:underline" href="/news">
            View all news
          </Link>
        </div>

        {news.length > 0 ? (
          <div className="rounded-lg border bg-white overflow-hidden">
            <div className="divide-y">
              {news.map((n, i) => (
                <a
                  key={n.id}
                  className="block p-4 hover:bg-slate-50 transition"
                  href={n.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <div className="font-medium">{i === 0 ? `Featured: ${n.title}` : n.title}</div>
                  <div className="text-sm text-muted-foreground mt-1">{n.source}</div>
                  {n.summary && <div className="text-sm mt-2">{n.summary}</div>}
                </a>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
            {newsError ||
              'No news loaded yet. If this is a fresh deploy, the first cron run will populate the feed.'}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Companies</h2>
            <p className="text-muted-foreground">Key organizations shaping nuclear deployment and innovation.</p>
          </div>
          <Link className="text-sm text-primary hover:underline" href="/companies">
            Explore companies
          </Link>
        </div>

        {companies.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {companies.map((c) => (
              <div key={c.id} className="rounded-lg border bg-white p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold">{c.name}</div>
                    <div className="text-sm text-muted-foreground mt-1">{c.category.replace(/_/g, ' ')}</div>
                  </div>
                  {c.latestUpdate && (
                    <span className="text-xs rounded-full border bg-white px-2 py-1 text-slate-700 whitespace-nowrap">
                      Updated {new Date(c.latestUpdate).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <p className="text-sm mt-3">{c.description}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-sm">
                  <a className="text-primary hover:underline" href={c.website} target="_blank" rel="noreferrer">
                    Website
                  </a>
                  {c.socials?.linkedin && (
                    <a className="text-primary hover:underline" href={c.socials.linkedin} target="_blank" rel="noreferrer">
                      LinkedIn
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
            {companiesError || 'No companies loaded yet.'}
          </div>
        )}
      </section>

      <section>
        <MarketTabs />
      </section>
    </div>
  );
}
