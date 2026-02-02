'use client';

import React from 'react';
import { AgentInstance } from '@/types/council';

interface TypingIndicatorProps {
  agents: AgentInstance[];
}

export default function TypingIndicator({ agents }: TypingIndicatorProps) {
  if (agents.length === 0) return null;

  const names = agents.map(a => a.persona.name);
  const displayText = 
    names.length === 1
      ? `${names[0]} is typing...`
      : names.length === 2
      ? `${names[0]} and ${names[1]} are typing...`
      : `${names[0]}, ${names[1]} and ${names.length - 2} others are typing...`;

  return (
    <div className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground">
      <div className="flex gap-1">
        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span>{displayText}</span>
    </div>
  );
}