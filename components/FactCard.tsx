'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Fact } from '@/types';

interface FactCardProps {
  fact: Fact;
}

export default function FactCard({ fact }: FactCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg">{fact.title}</CardTitle>
          {fact.category && (
            <Badge variant="outline">{fact.category}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{fact.body}</p>
        {fact.tags && fact.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {fact.tags.map((tag, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
