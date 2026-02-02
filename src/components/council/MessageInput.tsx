'use client';

import React, { useState, useRef, KeyboardEvent } from 'react';
import { AgentInstance } from '@/types/council';
import { Button } from '@/components/ui/button';
import { Send, AtSign } from 'lucide-react';

interface MessageInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  agents: AgentInstance[];
}

export default function MessageInput({ onSend, disabled, agents }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
      setShowMentions(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (showMentions) {
      const filteredAgents = agents.filter(a =>
        a.persona.name.toLowerCase().includes(mentionFilter.toLowerCase()) ||
        a.role.toLowerCase().includes(mentionFilter.toLowerCase())
      );

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedMentionIndex((prev) => 
          prev < filteredAgents.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedMentionIndex((prev) => prev > 0 ? prev - 1 : 0);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        if (filteredAgents.length > 0) {
          insertMention(filteredAgents[selectedMentionIndex]);
        }
      } else if (e.key === 'Escape') {
        setShowMentions(false);
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMessage(value);

    // Check for @ mentions
    const lastAtIndex = value.lastIndexOf('@');
    if (lastAtIndex >= 0) {
      const afterAt = value.slice(lastAtIndex + 1);
      const hasSpace = afterAt.includes(' ');
      
      if (!hasSpace) {
        setShowMentions(true);
        setMentionFilter(afterAt);
        setSelectedMentionIndex(0);
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
  };

  const insertMention = (agent: AgentInstance) => {
    const lastAtIndex = message.lastIndexOf('@');
    const newMessage = message.slice(0, lastAtIndex) + `@${agent.role} `;
    setMessage(newMessage);
    setShowMentions(false);
    inputRef.current?.focus();
  };

  const filteredAgents = showMentions
    ? agents.filter(a =>
        a.persona.name.toLowerCase().includes(mentionFilter.toLowerCase()) ||
        a.role.toLowerCase().includes(mentionFilter.toLowerCase())
      )
    : [];

  return (
    <div className="border-t px-4 py-1">
      <div className="relative max-w-4xl mx-auto">
        {showMentions && filteredAgents.length > 0 && (
          <div className="absolute bottom-full left-0 mb-2 w-64 bg-popover border rounded-md shadow-lg py-1">
            {filteredAgents.map((agent, index) => (
              <button
                key={agent.role}
                className={`w-full px-3 py-2 text-left hover:bg-muted flex items-center gap-2 ${
                  index === selectedMentionIndex ? 'bg-muted' : ''
                }`}
                onClick={() => insertMention(agent)}
              >
                <span className="text-lg">{agent.emoji}</span>
                <div>
                  <div className="text-sm font-medium">{agent.persona.name}</div>
                  <div className="text-xs text-muted-foreground">@{agent.role}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={message}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              disabled={disabled}
              placeholder={disabled ? "Council not active" : "Type a message..."}
              className="w-full px-4 py-1.5 pr-10 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            />
            <button
              onClick={() => {
                const newMessage = message + '@';
                setMessage(newMessage);
                setShowMentions(true);
                setMentionFilter('');
                inputRef.current?.focus();
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
              title="Mention an agent"
            >
              <AtSign className="h-4 w-4" />
            </button>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={disabled || !message.trim()}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}