'use client';

import React from 'react';
import { AgentInstance } from '@/types/council';
import AgentAvatar from './AgentAvatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Pause, Play, SkipForward, Square, Save } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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
  const getAgentStatusIndicator = (agent: AgentInstance) => {
    if (agent.status === 'typing') {
      return <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />;
    }
    if (agent.status === 'idle') {
      return <div className="w-2 h-2 rounded-full bg-green-500" />;
    }
    // 'waiting' status
    return <div className="w-2 h-2 rounded-full bg-muted-foreground" />;
  };

  return (
    <div className="w-80 border-l bg-muted/10 p-6 flex flex-col gap-6">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">SESSION CONTROL</h2>
          {status === 'running' && (
            <Badge variant="default" className="bg-green-600">
              ACTIVE
            </Badge>
          )}
          {status === 'completed' && (
            <Badge variant="secondary">
              COMPLETED
            </Badge>
          )}
        </div>
        <Separator className="mb-4" />
        
        <div className="space-y-3">
          {status === 'running' && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={timerPaused ? onResume : onPause}
              >
                {timerPaused ? (
                  <>
                    <Play className="h-4 w-4 mr-1" />
                    Resume
                  </>
                ) : (
                  <>
                    <Pause className="h-4 w-4 mr-1" />
                    Pause
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={onAdvanceRound}
              >
                <SkipForward className="h-4 w-4 mr-1" />
                Skip
              </Button>
            </div>
          )}

          {status === 'completed' && (
            <Button
              variant="default"
              size="sm"
              className="w-full"
            >
              <Save className="h-4 w-4 mr-2" />
              Save as Idea
            </Button>
          )}

          {(status === 'running' || status === 'paused') && (
            <Button
              variant="destructive"
              size="sm"
              className="w-full"
              onClick={onEndSession}
            >
              <Square className="h-4 w-4 mr-2" />
              End Session
            </Button>
          )}
        </div>
      </div>

      <Separator />

      <div className="flex-1 overflow-y-auto">
        <h2 className="font-semibold mb-4">ACTIVE AGENTS</h2>
        
        <div className="space-y-2">
          {agents.map((agent) => (
            <div
              key={agent.role}
              className="flex items-center gap-3 p-2 rounded bg-muted/20"
            >
              <div className="text-2xl">{agent.persona.emoji}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">
                  {agent.persona.name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {agent.model === 'opus' ? 'Opus' : 'Sonnet'}
                </div>
              </div>
              {getAgentStatusIndicator(agent)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}