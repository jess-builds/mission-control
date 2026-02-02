'use client';

import React from 'react';
import { TimerState } from '@/types/council';
import CouncilTimer from './CouncilTimer';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

interface CouncilHeaderProps {
  timerState: TimerState | null;
  status: 'configuring' | 'running' | 'paused' | 'completed';
  onPause: () => void;
  onResume: () => void;
}

export default function CouncilHeader({
  timerState,
  status,
  onPause,
  onResume,
}: CouncilHeaderProps) {
  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/ideas"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Ideas
          </Link>

          <div className="h-5 w-px bg-border" />

          <h1 className="text-lg font-semibold">COUNCIL</h1>

          {timerState && (
            <>
              <div className="h-5 w-px bg-border" />
              <div className="text-sm font-medium">
                Round {timerState.currentRound + 1}: {timerState.roundName}
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-4">
          {status === 'running' && (
            <CouncilTimer
              timerState={timerState}
              onPause={onPause}
              onResume={onResume}
            />
          )}

          {status === 'completed' && (
            <div className="text-sm font-medium text-green-500">
              ✓ Completed
            </div>
          )}

          {status === 'configuring' && (
            <div className="text-sm text-muted-foreground">
              Configuring...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}