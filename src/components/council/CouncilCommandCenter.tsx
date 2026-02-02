'use client';

import React, { useState, useEffect } from 'react';
import { CouncilService } from '@/services/councilService';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Rocket } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { AgentInstance } from '@/types/council';
import AgentAvatar from './AgentAvatar';
import { Label } from '@/components/ui/label';

interface CouncilCommandCenterProps {
  onStart: (config: {
    template?: 'standard' | 'quick' | 'freeForAll';
    contextPrompt?: string;
    roundDuration?: number;
    numberOfRounds?: number;
    freeForAll?: boolean;
  }) => void;
  isStarting?: boolean;
}

// Mock agents for display
const mockAgents = [
  { role: 'visionary', name: 'Visionary', emoji: '🔮', model: 'opus' },
  { role: 'pragmatist', name: 'Pragmatist', emoji: '🔨', model: 'sonnet' },
  { role: 'critic', name: 'Critic', emoji: '🎯', model: 'opus' },
  { role: 'synthesizer', name: 'Synthesizer', emoji: '🧩', model: 'sonnet' },
  { role: 'innovator', name: 'Innovator', emoji: '💡', model: 'opus' },
  { role: 'realist', name: 'Realist', emoji: '⚖️', model: 'sonnet' },
  { role: 'facilitator', name: 'Facilitator', emoji: '🎭', model: 'sonnet' },
];

export default function CouncilCommandCenter({ onStart, isStarting }: CouncilCommandCenterProps) {
  const [roundDuration, setRoundDuration] = useState(5);
  const [numberOfRounds, setNumberOfRounds] = useState(6);
  const [freeForAll, setFreeForAll] = useState(false);
  const [contextPrompt, setContextPrompt] = useState('');

  const handleStart = () => {
    onStart({
      template: freeForAll ? 'freeForAll' : 'standard',
      contextPrompt: contextPrompt.trim() || undefined,
      roundDuration,
      numberOfRounds,
      freeForAll,
    });
  };

  return (
    <div className="w-80 border-l bg-muted/10 p-6 flex flex-col gap-6">
      <div>
        <h2 className="font-semibold text-lg mb-4">SETTINGS</h2>
        <Separator className="mb-6" />
        
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label htmlFor="round-duration">Round Duration</Label>
              <span className="text-sm text-muted-foreground">{roundDuration} min</span>
            </div>
            <input
              id="round-duration"
              type="range"
              min="1"
              max="10"
              value={roundDuration}
              onChange={(e) => setRoundDuration(Number(e.target.value))}
              disabled={freeForAll || isStarting}
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: freeForAll 
                  ? '#374151' 
                  : `linear-gradient(to right, #10B981 0%, #10B981 ${(roundDuration - 1) * 11.1}%, #374151 ${(roundDuration - 1) * 11.1}%, #374151 100%)`
              }}
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label htmlFor="number-rounds">Number of Rounds</Label>
              <span className="text-sm text-muted-foreground">{numberOfRounds}</span>
            </div>
            <input
              id="number-rounds"
              type="range"
              min="1"
              max="10"
              value={numberOfRounds}
              onChange={(e) => setNumberOfRounds(Number(e.target.value))}
              disabled={freeForAll || isStarting}
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: freeForAll 
                  ? '#374151' 
                  : `linear-gradient(to right, #10B981 0%, #10B981 ${(numberOfRounds - 1) * 11.1}%, #374151 ${(numberOfRounds - 1) * 11.1}%, #374151 100%)`
              }}
            />
          </div>

          <div className="flex items-center space-x-3">
            <input
              id="free-for-all"
              type="checkbox"
              checked={freeForAll}
              onChange={(e) => setFreeForAll(e.target.checked)}
              disabled={isStarting}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="free-for-all" className="text-sm cursor-pointer">
              Free-for-all Mode
            </Label>
          </div>

          <div className="space-y-3">
            <Label htmlFor="context">Context (optional)</Label>
            <Textarea
              id="context"
              placeholder="What problem are we solving?"
              value={contextPrompt}
              onChange={(e) => setContextPrompt(e.target.value)}
              rows={4}
              disabled={isStarting}
              className="resize-none text-sm"
            />
          </div>

          <Button
            size="lg"
            className="w-full"
            onClick={handleStart}
            disabled={isStarting}
          >
            <Rocket className="h-5 w-5 mr-2" />
            {isStarting ? 'Starting...' : 'Start Council'}
          </Button>
        </div>
      </div>

      <Separator />

      <div className="flex-1 overflow-y-auto">
        <h2 className="font-semibold mb-4">AGENTS</h2>
        
        <div className="space-y-2">
          {mockAgents.map((agent) => (
            <div
              key={agent.role}
              className="flex items-center gap-3 p-2 rounded opacity-50"
            >
              <div className="text-2xl">{agent.emoji}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">
                  {agent.name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {agent.model === 'opus' ? 'Opus' : 'Sonnet'}
                </div>
              </div>
              <div className="w-2 h-2 rounded-full bg-muted-foreground" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}