import { useEffect, useState, useCallback } from 'react';
import { councilSocket } from '@/services/councilSocket';
import { CouncilConfig, Round } from '@/types/council';

export function useCouncilSocket() {
  const [connected, setConnected] = useState(false);
  const [creating, setCreating] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    // Connect on mount
    councilSocket.connect();

    // Set up connection listeners
    const handleConnect = () => setConnected(true);
    const handleDisconnect = () => setConnected(false);

    // Listen for creation success
    const handleCreated = (data: { sessionId: string; config: CouncilConfig }) => {
      setSessionId(data.sessionId);
      setCreating(false);
    };

    // Listen for errors
    const handleError = (data: { error: string; details?: string }) => {
      console.error('Council error:', data);
      setCreating(false);
    };

    councilSocket.on('connect', handleConnect);
    councilSocket.on('disconnect', handleDisconnect);
    councilSocket.on('council:created', handleCreated);
    councilSocket.on('council:error', handleError);

    // Cleanup
    return () => {
      councilSocket.off('connect', handleConnect);
      councilSocket.off('disconnect', handleDisconnect);
      councilSocket.off('council:created', handleCreated);
      councilSocket.off('council:error', handleError);
      councilSocket.disconnect();
    };
  }, []);

  const createCouncil = useCallback((data: {
    template?: 'standard' | 'quick' | 'freeForAll';
    customRounds?: Round[];
    contextPrompt?: string;
  }) => {
    setCreating(true);
    councilSocket.createCouncil(data);
  }, []);

  const startCouncil = useCallback((sessionId: string) => {
    councilSocket.startCouncil(sessionId);
  }, []);

  return {
    connected,
    creating,
    sessionId,
    createCouncil,
    startCouncil,
  };
}