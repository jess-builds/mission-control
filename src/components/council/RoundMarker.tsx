'use client';

import React from 'react';

interface RoundMarkerProps {
  roundIndex: number;
  roundName: string;
}

export default function RoundMarker({ roundIndex, roundName }: RoundMarkerProps) {
  return (
    <div className="flex items-center gap-4 my-8">
      <div className="flex-1 h-px bg-border" />
      <div className="text-sm font-medium text-muted-foreground px-4">
        Round {roundIndex + 1}: {roundName}
      </div>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}