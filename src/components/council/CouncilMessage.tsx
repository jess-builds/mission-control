'use client';

import React from 'react';
import { CouncilMessage as MessageType, AgentInstance } from '@/types/council';
import AgentAvatar from './AgentAvatar';
import { cn } from '@/lib/utils';

interface CouncilMessageProps {
  message: MessageType;
  agent?: AgentInstance;
}

export default function CouncilMessage({ message, agent }: CouncilMessageProps) {
  const isArmaan = message.author === 'armaan';
  const isSystem = message.isSystemMessage;

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (isSystem) {
    return (
      <div className="flex justify-center my-4">
        <div className="bg-muted px-4 py-2 rounded-full text-sm text-muted-foreground">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex gap-3 mb-4',
        isArmaan && 'flex-row-reverse'
      )}
    >
      <div className="flex-shrink-0">
        {isArmaan ? (
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
            👤
          </div>
        ) : agent ? (
          <AgentAvatar agent={agent} />
        ) : (
          <div className="w-10 h-10 rounded-full bg-muted" />
        )}
      </div>

      <div className={cn('flex-1 max-w-[70%]', isArmaan && 'flex justify-end')}>
        <div>
          {!isArmaan && (
            <div className="flex items-baseline gap-2 mb-1">
              <span className="font-medium text-sm">
                {agent?.persona.name || message.author}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatTime(message.timestamp)}
              </span>
              {agent?.model && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-muted">
                  {agent.model === 'opus' ? 'Opus' : 'Sonnet'}
                </span>
              )}
            </div>
          )}

          <div
            className={cn(
              'rounded-lg px-4 py-2 prose prose-sm max-w-none',
              isArmaan
                ? 'bg-primary text-primary-foreground prose-invert'
                : 'bg-muted'
            )}
          >
            {message.replyTo && (
              <div className="text-xs opacity-70 mb-1">
                @{message.replyTo}
              </div>
            )}
            <div className="whitespace-pre-wrap">{message.content}</div>
          </div>

          {isArmaan && (
            <div className="text-xs text-muted-foreground mt-1 text-right">
              {formatTime(message.timestamp)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}