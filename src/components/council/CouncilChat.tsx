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

interface CouncilChatProps {
  sessionId: string;
}

export default function CouncilChat({ sessionId }: CouncilChatProps) {
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

  if (loading) {
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
    <div className="flex h-screen bg-background">
      <div className="flex-1 flex flex-col">
        <CouncilHeader
          timerState={timerState}
          status={status}
          onPause={pauseCouncil}
          onResume={resumeCouncil}
        />

        <ScrollArea className="flex-1" ref={scrollRef}>
          <div className="max-w-4xl mx-auto p-4">
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

        <MessageInput
          onSend={sendMessage}
          disabled={status !== 'running'}
          agents={agents}
        />
      </div>

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
  );
}