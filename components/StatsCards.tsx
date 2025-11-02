'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Zap, TrendingUp, Building2 } from 'lucide-react';

interface StatsCardsProps {
  stats: {
    totalReactors: number;
    operating: number;
    underConstruction: number;
    totalCapacity: number;
    operatingCapacity: number;
    operatingPercent: number;
  };
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: 'Total Reactors',
      value: stats.totalReactors.toLocaleString(),
      icon: Building2,
      description: `${stats.operating} operating`,
    },
    {
      title: 'Global Capacity',
      value: `${stats.totalCapacity.toLocaleString()} MW`,
      icon: Zap,
      description: `${stats.operatingCapacity.toLocaleString()} MW operating`,
    },
    {
      title: 'Operating Rate',
      value: `${stats.operatingPercent}%`,
      icon: Activity,
      description: 'Of total reactors',
    },
    {
      title: 'Under Construction',
      value: stats.underConstruction.toLocaleString(),
      icon: TrendingUp,
      description: 'New units being built',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">
                {card.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
