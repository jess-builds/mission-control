'use client';

import React from 'react';
import { TimerState } from '@/types/council';
import { cn } from '@/lib/utils';
import { Pause, Play } from 'lucide-react';

interface CouncilTimerProps {
  timerState: TimerState | null;
  onPause?: () => void;
  onResume?: () => void;
}

export default function CouncilTimer({ timerState, onPause, onResume }: CouncilTimerProps) {
  if (!timerState) return null;

  const minutes = Math.floor(timerState.remaining / 60);
  const seconds = timerState.remaining % 60;
  const timeDisplay = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  const getTimerColor = () => {
    if (timerState.remaining <= 10) return 'text-red-500';
    if (timerState.remaining <= 30) return 'text-yellow-500';
    if (timerState.remaining <= 60) return 'text-orange-500';
    return 'text-green-500';
  };

  const shouldPulse = timerState.remaining <= 10 && !timerState.paused;

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          'font-mono font-bold text-xl transition-colors',
          getTimerColor(),
          shouldPulse && 'animate-pulse'
        )}
      >
        ⏱️ {timeDisplay}
      </div>
      
      {timerState.paused && (
        <span className="text-sm text-muted-foreground">
          (Paused{timerState.pausedBy === 'armaan' ? ' - Armaan speaking' : ''})
        </span>
      )}

      {onPause && onResume && (
        <button
          onClick={timerState.paused ? onResume : onPause}
          className="p-1 rounded hover:bg-muted transition-colors"
          title={timerState.paused ? 'Resume' : 'Pause'}
        >
          {timerState.paused ? (
            <Play className="h-4 w-4" />
          ) : (
            <Pause className="h-4 w-4" />
          )}
        </button>
      )}
    </div>
  );
}