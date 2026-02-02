'use client';

import React, { useRef, useEffect } from 'react';
import { useCouncilSession } from '@/hooks/useCouncilSession';
import CouncilMessage from './CouncilMessage';
import CouncilHeader from './CouncilHeader';
import CouncilSidebar from './CouncilSidebar';
import MessageInput from './MessageInput';
import RoundMarker from './RoundMarker';
import TypingIndicator from './TypingIndicator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Rocket } from 'lucide-react';

interface CouncilChatProps {
  sessionId: string;
  isEmptyState?: boolean;
  isStarting?: boolean;
}

export default function CouncilChat({ sessionId, isEmptyState = false, isStarting = false }: CouncilChatProps) {
  const {
    messages,
    agents,
    timerState,
    status,
    loading,
    error,
    sendMessage,
    pauseCouncil,
    resumeCouncil,
    advanceRound,
    endCouncil,
  } = useCouncilSession(sessionId);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Show empty state if no session ID
  if (isEmptyState && !sessionId) {
    return (
      <div className="flex council-container">
        <div className="flex-1 flex flex-col">
          <div className="council-header">
            <CouncilHeader
              timerState={null}
              status={'configuring'}
              onPause={() => {}}
              onResume={() => {}}
            />
          </div>

          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Rocket className="h-12 w-12 text-muted-foreground mb-3 mx-auto" />
              <p className="text-lg font-semibold mb-2">Click Start to begin your council</p>
              <p className="text-sm text-muted-foreground">
                {isStarting ? 'Starting council session...' : 'Configure your settings and hit Start Council'}
              </p>
            </div>
          </div>

          <div className="council-message-input">
            <MessageInput
              onSend={() => {}}
              disabled={true}
              agents={[]}
            />
          </div>
        </div>
      </div>
    );
  }

  if (loading && sessionId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p>Loading council session...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center text-red-500">
          <p className="text-xl mb-2">Error</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const typingAgents = agents.filter(agent => agent.status === 'typing');
  let lastRound = -1;

  return (
    <div className="flex council-container bg-background">
      <div className="flex-1 flex flex-col">
        <div className="council-header">
          <CouncilHeader
            timerState={timerState}
            status={status}
            onPause={pauseCouncil}
            onResume={resumeCouncil}
          />
        </div>

        <ScrollArea className="flex-1" ref={scrollRef}>
          <div className="max-w-4xl mx-auto council-chat-content">
            {messages.map((message, index) => {
              const showRoundMarker = message.round > lastRound;
              if (showRoundMarker) {
                lastRound = message.round;
              }

              return (
                <React.Fragment key={message.id}>
                  {showRoundMarker && timerState && (
                    <RoundMarker
                      roundIndex={message.round}
                      roundName={timerState.roundName}
                    />
                  )}
                  <CouncilMessage
                    message={message}
                    agent={agents.find(a => a.role === message.author)}
                  />
                </React.Fragment>
              );
            })}

            {typingAgents.length > 0 && (
              <TypingIndicator agents={typingAgents} />
            )}
          </div>
        </ScrollArea>

        <div className="council-message-input">
          <MessageInput
            onSend={sendMessage}
            disabled={status !== 'running'}
            agents={agents}
          />
        </div>
      </div>

      <div className="council-sidebar">
        <CouncilSidebar
          agents={agents}
          status={status}
          onAdvanceRound={advanceRound}
          onEndSession={endCouncil}
          timerPaused={timerState?.paused || false}
          onPause={pauseCouncil}
          onResume={resumeCouncil}
        />
      </div>
    </div>
  );
}