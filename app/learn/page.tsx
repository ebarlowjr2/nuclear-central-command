'use client';

import { useState } from 'react';
import FactCard from '@/components/FactCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Fact } from '@/types';

export default function LearnPage() {
  const facts: Fact[] = [
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
    {
      title: 'Safety Systems',
      body: 'Modern nuclear reactors have multiple redundant safety systems including emergency core cooling systems, containment buildings, and passive safety features that work without power or human intervention.',
      category: 'safety',
      tags: ['safety', 'engineering'],
    },
    {
      title: 'Nuclear Waste',
      body: 'All the nuclear waste produced by the US nuclear industry over the past 60 years would fit on a single football field stacked less than 10 yards high. Most of this waste can be recycled.',
      category: 'fuel',
      tags: ['waste', 'recycling'],
    },
    {
      title: 'Capacity Factor',
      body: 'Nuclear power plants have the highest capacity factor of any energy source, typically operating at over 90% of their maximum output. This means they produce power reliably around the clock.',
      category: 'performance',
      tags: ['efficiency', 'reliability'],
    },
    {
      title: 'Small Modular Reactors',
      body: 'SMRs are advanced nuclear reactors with power capacity up to 300 MW per unit, about one-third the generating capacity of traditional nuclear power reactors. They offer enhanced safety features and can be factory-built.',
      category: 'technology',
      tags: ['SMR', 'innovation'],
    },
    {
      title: 'Nuclear Medicine',
      body: 'Nuclear reactors produce medical isotopes used in over 40 million medical procedures annually worldwide, including cancer treatments and diagnostic imaging.',
      category: 'applications',
      tags: ['medicine', 'isotopes'],
    },
    {
      title: 'Water Usage',
      body: 'While nuclear plants use water for cooling, they use less water per unit of electricity than coal plants and return it to the source at a slightly higher temperature.',
      category: 'environment',
      tags: ['water', 'cooling'],
    },
    {
      title: 'Global Nuclear Fleet',
      body: 'There are over 440 nuclear power reactors operating in 30 countries worldwide, providing about 10% of global electricity generation.',
      category: 'statistics',
      tags: ['global', 'capacity'],
    },
  ];

  const categories = ['all', 'technology', 'environment', 'safety', 'fuel', 'performance', 'applications', 'statistics'];

  return (
    <div className="space-y-6 md:space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2">Learn About Nuclear Energy</h1>
        <p className="text-muted-foreground">
          Educational resources, facts, and glossary
        </p>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-8">
          {categories.map((cat) => (
            <TabsTrigger key={cat} value={cat} className="capitalize">
              {cat}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {categories.map((cat) => (
          <TabsContent key={cat} value={cat} className="mt-4 md:mt-6">
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {facts
                .filter((fact) => cat === 'all' || fact.category === cat)
                .map((fact, idx) => (
                  <FactCard key={idx} fact={fact} />
                ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
