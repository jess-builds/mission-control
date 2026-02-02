'use client';

import React, { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useCouncilSocket } from '@/hooks/useCouncilSocket';
import CouncilChat from '@/components/council/CouncilChat';

export default function CouncilSessionPage() {
  const params = useParams();
  const sessionId = params.id as string;
  const { startCouncil } = useCouncilSocket();

  // Auto-start the council when the page loads
  useEffect(() => {
    if (sessionId) {
      // Small delay to ensure agents are ready
      const timer = setTimeout(() => {
        startCouncil(sessionId);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [sessionId, startCouncil]);

  return <CouncilChat sessionId={sessionId} />;
}