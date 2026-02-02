'use client';

import React from 'react';
import { AgentInstance } from '@/types/council';
import AgentAvatar from './AgentAvatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Pause, Play, SkipForward, Square, Save } from 'lucide-react';

interface CouncilSidebarProps {
  agents: AgentInstance[];
  status: 'configuring' | 'running' | 'paused' | 'completed';
  onAdvanceRound: () => void;
  onEndSession: () => void;
  timerPaused: boolean;
  onPause: () => void;
  onResume: () => void;
}

export default function CouncilSidebar({
  agents,
  status,
  onAdvanceRound,
  onEndSession,
  timerPaused,
  onPause,
  onResume,
}: CouncilSidebarProps) {
  return (
    <div className="w-64 border-l bg-muted/10 p-4 flex flex-col gap-4">
      <div>
        <h2 className="font-semibold mb-3">AGENTS</h2>
        <Separator className="mb-3" />
        
        <div className="space-y-3">
          {agents.map((agent) => (
            <div
              key={agent.role}
              className="flex items-center gap-3 p-2 rounded hover:bg-muted/50 transition-colors cursor-pointer"
            >
              <AgentAvatar agent={agent} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">
                  {agent.persona.name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {agent.model === 'opus' ? 'Opus' : 'Sonnet'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      <div>
        <h2 className="font-semibold mb-3">ACTIONS</h2>
        <div className="space-y-2">
          {status === 'running' && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={timerPaused ? onResume : onPause}
              >
                {timerPaused ? (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Resume
                  </>
                ) : (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={onAdvanceRound}
              >
                <SkipForward className="h-4 w-4 mr-2" />
                Next Round
              </Button>
            </>
          )}

          {status === 'completed' && (
            <Button
              variant="default"
              size="sm"
              className="w-full justify-start"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Idea
            </Button>
          )}

          {(status === 'running' || status === 'paused') && (
            <Button
              variant="destructive"
              size="sm"
              className="w-full justify-start"
              onClick={onEndSession}
            >
              <Square className="h-4 w-4 mr-2" />
              End Session
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}