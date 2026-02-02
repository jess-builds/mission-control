'use client';

import React, { useState } from 'react';
import { useCouncilSocket } from '@/hooks/useCouncilSocket';
import CouncilChat from '@/components/council/CouncilChat';
import CouncilCommandCenter from '@/components/council/CouncilCommandCenter';
import { useRouter } from 'next/navigation';
import { Round } from '@/types/council';

export default function CouncilPage() {
  const router = useRouter();
  const { createCouncil, sessionId } = useCouncilSocket();
  const [isStarting, setIsStarting] = useState(false);

  React.useEffect(() => {
    if (sessionId) {
      // Redirect to the council session
      router.push(`/dashboard/council/${sessionId}`);
    }
  }, [sessionId, router]);

  const handleStart = async (config: {
    template?: 'standard' | 'quick' | 'freeForAll';
    customRounds?: Round[];
    contextPrompt?: string;
    roundDuration?: number;
    numberOfRounds?: number;
    freeForAll?: boolean;
  }) => {
    setIsStarting(true);
    createCouncil(config);
  };

  return (
    <div className="flex h-[94vh] bg-background">
      <div className="flex-1 flex flex-col">
        <CouncilChat 
          sessionId="" 
          isEmptyState={true}
          isStarting={isStarting}
        />
      </div>
      <CouncilCommandCenter 
        onStart={handleStart} 
        isStarting={isStarting}
      />
    </div>
  );
}