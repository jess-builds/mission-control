import { Server, Socket } from 'socket.io';
import { CouncilOrchestrator, CouncilMessage } from './councilOrchestrator';
import { CouncilStateMachine, CouncilConfig, ROUND_TEMPLATES } from './councilStateMachine';
import { TimerService, TimerState } from './timerService';

interface CouncilSession {
  id: string;
  status: 'configuring' | 'running' | 'paused' | 'completed';
  orchestrator: CouncilOrchestrator;
  stateMachine: CouncilStateMachine;
  timer: TimerService;
  config: CouncilConfig;
  createdAt: Date;
  output?: {
    ideaId?: string;
    summary?: string;
    winningProposal?: string;
  };
}

export class CouncilSocketHandler {
  private io: Server;
  private sessions: Map<string, CouncilSession> = new Map();

  constructor(io: Server) {
    this.io = io;
    this.setupSocketHandlers();
  }

  private setupSocketHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      console.log(`Council client connected: ${socket.id}`);

      // Join a council session room
      socket.on('council:join', (sessionId: string) => {
        socket.join(`council:${sessionId}`);
        
        const session = this.sessions.get(sessionId);
        if (session) {
          // Send current state to new client
          socket.emit('council:state', {
            sessionId,
            status: session.stateMachine.getStatus(),
            config: session.config,
            agents: session.orchestrator.getAgents(),
            messages: session.orchestrator.getMessages(),
            currentRound: session.stateMachine.getCurrentRoundIndex(),
            timerState: session.timer.getState(),
          });
        }
      });

      // Leave council session
      socket.on('council:leave', (sessionId: string) => {
        socket.leave(`council:${sessionId}`);
      });

      // Create new council
      socket.on('council:create', async (data: {
        template?: 'standard' | 'quick' | 'freeForAll';
        customRounds?: any[];
        contextPrompt?: string;
      }) => {
        try {
          const sessionId = this.generateSessionId();
          
          // Configure rounds
          let config: CouncilConfig;
          if (data.template === 'freeForAll') {
            config = {
              rounds: [],
              freeForAll: true,
              contextPrompt: data.contextPrompt,
            };
          } else if (data.customRounds) {
            config = {
              rounds: data.customRounds,
              freeForAll: false,
              contextPrompt: data.contextPrompt,
            };
          } else {
            config = {
              rounds: ROUND_TEMPLATES[data.template || 'standard'],
              freeForAll: false,
              contextPrompt: data.contextPrompt,
            };
          }

          // Create session components
          const orchestrator = new CouncilOrchestrator(sessionId);
          const stateMachine = new CouncilStateMachine(config);
          const timer = new TimerService();

          // Wire up orchestrator events
          this.setupOrchestratorEvents(sessionId, orchestrator);

          // Wire up state machine events
          this.setupStateMachineEvents(sessionId, stateMachine, orchestrator, timer);

          // Wire up timer events
          this.setupTimerEvents(sessionId, timer, stateMachine);

          // Create session
          const session: CouncilSession = {
            id: sessionId,
            status: 'configuring',
            orchestrator,
            stateMachine,
            timer,
            config,
            createdAt: new Date(),
          };

          this.sessions.set(sessionId, session);

          socket.emit('council:created', {
            sessionId,
            config,
          });

        } catch (error) {
          socket.emit('council:error', {
            error: 'Failed to create council session',
            details: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      });

      // Start council
      socket.on('council:start', async (sessionId: string) => {
        const session = this.sessions.get(sessionId);
        if (!session) {
          socket.emit('council:error', { error: 'Session not found' });
          return;
        }

        try {
          // Initialize agents
          await session.orchestrator.initializeAgents(session.config.contextPrompt);
          
          // Start state machine
          session.stateMachine.start();
          
          socket.emit('council:started', { sessionId });
        } catch (error) {
          socket.emit('council:error', {
            error: 'Failed to start council',
            details: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      });

      // Send message (Armaan)
      socket.on('council:message', async (data: {
        sessionId: string;
        content: string;
      }) => {
        const session = this.sessions.get(data.sessionId);
        if (!session) {
          socket.emit('council:error', { error: 'Session not found' });
          return;
        }

        // Pause timer when Armaan speaks
        session.timer.pause('armaan');

        // Handle the message
        await session.orchestrator.handleArmaanMessage(data.content);

        // Resume timer after a delay (give agents time to respond)
        setTimeout(() => {
          session.timer.resume();
        }, 5000);
      });

      // Pause council
      socket.on('council:pause', (sessionId: string) => {
        const session = this.sessions.get(sessionId);
        if (!session) return;

        session.stateMachine.pause();
        session.timer.pause('system');
      });

      // Resume council
      socket.on('council:resume', (sessionId: string) => {
        const session = this.sessions.get(sessionId);
        if (!session) return;

        session.stateMachine.resume();
        session.timer.resume();
      });

      // Force advance round
      socket.on('council:advance', (sessionId: string) => {
        const session = this.sessions.get(sessionId);
        if (!session) return;

        session.timer.forceAdvance();
      });

      // End council
      socket.on('council:end', async (sessionId: string) => {
        const session = this.sessions.get(sessionId);
        if (!session) return;

        session.timer.stop();
        session.stateMachine.forceEnd();
        await session.orchestrator.terminate();
      });

      // Get session list
      socket.on('council:list', () => {
        const sessionList = Array.from(this.sessions.entries()).map(([id, session]) => ({
          id,
          status: session.stateMachine.getStatus(),
          createdAt: session.createdAt,
          currentRound: session.stateMachine.getCurrentRoundIndex(),
          totalRounds: session.stateMachine.getTotalRounds(),
        }));

        socket.emit('council:list', sessionList);
      });

      socket.on('disconnect', () => {
        console.log(`Council client disconnected: ${socket.id}`);
      });
    });
  }

  private setupOrchestratorEvents(sessionId: string, orchestrator: CouncilOrchestrator): void {
    orchestrator.on('message', (message: CouncilMessage) => {
      this.io.to(`council:${sessionId}`).emit('council:message', {
        sessionId,
        message,
      });
    });

    orchestrator.on('agentStatus', (data: { role: string; status: string }) => {
      this.io.to(`council:${sessionId}`).emit('council:agent', {
        sessionId,
        ...data,
      });
    });

    orchestrator.on('allAgentsReady', (agents: any[]) => {
      this.io.to(`council:${sessionId}`).emit('council:agents_ready', {
        sessionId,
        agents,
      });
    });
  }

  private setupStateMachineEvents(
    sessionId: string,
    stateMachine: CouncilStateMachine,
    orchestrator: CouncilOrchestrator,
    timer: TimerService
  ): void {
    stateMachine.on('roundStart', async (data: any) => {
      // Start timer for this round
      timer.startRound(data.roundIndex, data.round.name, data.round.durationSeconds);

      // Broadcast round prompt to agents
      await orchestrator.broadcastRoundPrompt(data.roundIndex, data.round.prompt);

      // Notify clients
      this.io.to(`council:${sessionId}`).emit('council:round', {
        sessionId,
        roundIndex: data.roundIndex,
        round: data.round,
        totalRounds: data.totalRounds,
      });
    });

    stateMachine.on('councilComplete', () => {
      this.io.to(`council:${sessionId}`).emit('council:status', {
        sessionId,
        status: 'completed',
      });
    });
  }

  private setupTimerEvents(
    sessionId: string,
    timer: TimerService,
    stateMachine: CouncilStateMachine
  ): void {
    timer.on('tick', (state: TimerState) => {
      this.io.to(`council:${sessionId}`).emit('council:timer', {
        sessionId,
        timerState: state,
      });
    });

    timer.on('wrapUp', async (state: TimerState) => {
      const round = stateMachine.getCurrentRound();
      if (round && round.wrapUpPrompt && !round.wrapUpSent) {
        const session = this.sessions.get(sessionId);
        if (session) {
          await session.orchestrator.broadcastWrapUp(round.wrapUpPrompt);
          stateMachine.markWrapUpSent();
        }
      }
    });

    timer.on('roundComplete', () => {
      // Auto-advance to next round
      const hasNext = stateMachine.nextRound();
      if (!hasNext) {
        // Council complete
        stateMachine.complete();
      }
    });
  }

  private generateSessionId(): string {
    return `council_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Export session to idea bank format
   */
  async exportToIdeaBank(sessionId: string): Promise<any> {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const messages = session.orchestrator.getMessages();
    
    // Extract key information from the discussion
    // This is a simplified version - could be enhanced with AI summarization
    const lastRoundMessages = messages
      .filter(m => m.round === session.stateMachine.getTotalRounds() - 1)
      .filter(m => !m.isSystemMessage);

    return {
      title: 'Council Generated Idea',
      summary: 'AI council debate outcome',
      messages: messages,
      participants: session.orchestrator.getAgents().map(a => a.role),
      rounds: session.config.rounds.length,
      duration: Math.floor((Date.now() - session.createdAt.getTime()) / 1000 / 60),
    };
  }
}

export default CouncilSocketHandler;