'use client';

import React from 'react';
import { AgentInstance } from '@/types/council';
import { cn } from '@/lib/utils';

interface AgentAvatarProps {
  agent: AgentInstance;
  size?: 'sm' | 'md' | 'lg';
  showStatus?: boolean;
}

export default function AgentAvatar({ 
  agent, 
  size = 'md',
  showStatus = true 
}: AgentAvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-base',
    md: 'w-10 h-10 text-lg',
    lg: 'w-12 h-12 text-xl',
  };

  const statusColors = {
    idle: 'bg-green-500',
    typing: 'bg-yellow-500',
    waiting: 'bg-gray-400',
  };

  return (
    <div className="relative">
      <div
        className={cn(
          'rounded-full bg-muted flex items-center justify-center',
          sizeClasses[size]
        )}
      >
        {agent.emoji}
      </div>
      
      {showStatus && (
        <div
          className={cn(
            'absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background',
            statusColors[agent.status]
          )}
        />
      )}
    </div>
  );
}