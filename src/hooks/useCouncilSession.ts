import { useState, useEffect, useCallback } from 'react';
import { councilSocket } from '@/services/councilSocket';
import { CouncilSession, CouncilMessage, TimerState, AgentInstance } from '@/types/council';

export function useCouncilSession(sessionId: string | null) {
  const [session, setSession] = useState<CouncilSession | null>(null);
  const [messages, setMessages] = useState<CouncilMessage[]>([]);
  const [agents, setAgents] = useState<AgentInstance[]>([]);
  const [timerState, setTimerState] = useState<TimerState | null>(null);
  const [status, setStatus] = useState<CouncilSession['status']>('configuring');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    // Connect to socket and join session
    councilSocket.connect();
    councilSocket.joinSession(sessionId);

    // Set up event listeners
    const handleState = (state: CouncilSession) => {
      setSession(state);
      setMessages(state.messages);
      setAgents(state.agents);
      setTimerState(state.timerState);
      setStatus(state.status);
      setLoading(false);
    };

    const handleMessage = (data: { sessionId: string; message: CouncilMessage }) => {
      if (data.sessionId === sessionId) {
        setMessages(prev => [...prev, data.message]);
      }
    };

    const handleAgentStatus = (data: { sessionId: string; role: string; status: string }) => {
      if (data.sessionId === sessionId) {
        setAgents(prev => prev.map(agent =>
          agent.role === data.role
            ? { ...agent, status: data.status as AgentInstance['status'] }
            : agent
        ));
      }
    };

    const handleTimer = (data: { sessionId: string; timerState: TimerState }) => {
      if (data.sessionId === sessionId) {
        setTimerState(data.timerState);
      }
    };

    const handleStatus = (data: { sessionId: string; status: string }) => {
      if (data.sessionId === sessionId) {
        setStatus(data.status as CouncilSession['status']);
      }
    };

    const handleError = (data: { error: string; details?: string }) => {
      setError(data.error);
      setLoading(false);
    };

    const handleAgentsReady = (data: { sessionId: string; agents: AgentInstance[] }) => {
      if (data.sessionId === sessionId) {
        setAgents(data.agents);
      }
    };

    // Register listeners
    councilSocket.on('council:state', handleState);
    councilSocket.on('council:message', handleMessage);
    councilSocket.on('council:agent', handleAgentStatus);
    councilSocket.on('council:timer', handleTimer);
    councilSocket.on('council:status', handleStatus);
    councilSocket.on('council:error', handleError);
    councilSocket.on('council:agents_ready', handleAgentsReady);

    // Cleanup
    return () => {
      councilSocket.leaveSession(sessionId);
      councilSocket.off('council:state', handleState);
      councilSocket.off('council:message', handleMessage);
      councilSocket.off('council:agent', handleAgentStatus);
      councilSocket.off('council:timer', handleTimer);
      councilSocket.off('council:status', handleStatus);
      councilSocket.off('council:error', handleError);
      councilSocket.off('council:agents_ready', handleAgentsReady);
    };
  }, [sessionId]);

  const sendMessage = useCallback((content: string) => {
    if (!sessionId) return;
    councilSocket.sendMessage(sessionId, content);
  }, [sessionId]);

  const pauseCouncil = useCallback(() => {
    if (!sessionId) return;
    councilSocket.pauseCouncil(sessionId);
  }, [sessionId]);

  const resumeCouncil = useCallback(() => {
    if (!sessionId) return;
    councilSocket.resumeCouncil(sessionId);
  }, [sessionId]);

  const advanceRound = useCallback(() => {
    if (!sessionId) return;
    councilSocket.advanceRound(sessionId);
  }, [sessionId]);

  const endCouncil = useCallback(() => {
    if (!sessionId) return;
    councilSocket.endCouncil(sessionId);
  }, [sessionId]);

  return {
    session,
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
  };
}