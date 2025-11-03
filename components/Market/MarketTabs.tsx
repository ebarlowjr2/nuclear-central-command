'use client';

import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { MarketGrid } from './MarketGrid';
import { AlertCircle } from 'lucide-react';

const CATEGORIES = [
  { key: 'ETF', label: 'ETFs' },
  { key: 'SMR/Advanced', label: 'SMR / Advanced' },
  { key: 'Fuel & Equipment', label: 'Fuel & Equipment' },
  { key: 'Utility', label: 'Utilities' },
];

export function MarketTabs() {
  const [active, setActive] = useState(CATEGORIES[0].key);

  return (
    <div className="w-full">
      <div className="flex flex-col gap-2 mb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-primary">Nuclear Market</h2>
        </div>
        
        <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border border-border">
          <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <p className="text-xs text-muted-foreground">
            <strong>Disclaimer:</strong> Quotes may be delayed and are provided for educational purposes only. 
            This is not investment advice. Nuclear investments can be volatile, especially early-stage SMR companies.
          </p>
        </div>
      </div>

      <Tabs value={active} onValueChange={setActive}>
        <TabsList className="mb-4 w-full justify-start">
          {CATEGORIES.map(c => (
            <TabsTrigger key={c.key} value={c.key}>
              {c.label}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {CATEGORIES.map(c => (
          <TabsContent key={c.key} value={c.key}>
            <MarketGrid category={c.key} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
