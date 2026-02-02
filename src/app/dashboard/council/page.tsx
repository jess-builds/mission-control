'use client';

import React from 'react';
import { useCouncilSocket } from '@/hooks/useCouncilSocket';
import CouncilConfig from '@/components/council/CouncilConfig';
import { useRouter } from 'next/navigation';
import { Round } from '@/types/council';

export default function CouncilPage() {
  const router = useRouter();
  const { createCouncil, sessionId } = useCouncilSocket();

  React.useEffect(() => {
    if (sessionId) {
      // Redirect to the council session
      router.push(`/dashboard/council/${sessionId}`);
    }
  }, [sessionId, router]);

  const handleStart = (config: {
    template?: 'standard' | 'quick' | 'freeForAll';
    customRounds?: Round[];
    contextPrompt?: string;
  }) => {
    createCouncil(config);
  };

  return (
    <div className="min-h-screen bg-background">
      <CouncilConfig onStart={handleStart} />
    </div>
  );
}