"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CouncilSocketHandler = void 0;
const councilOrchestrator_1 = require("./councilOrchestrator");
const councilStateMachine_1 = require("./councilStateMachine");
const timerService_1 = require("./timerService");
class CouncilSocketHandler {
    constructor(io) {
        this.sessions = new Map();
        this.io = io;
        this.setupSocketHandlers();
    }
    setupSocketHandlers() {
        this.io.on('connection', (socket) => {
            console.log(`Council client connected: ${socket.id}`);
            // Join a council session room
            socket.on('council:join', (sessionId) => {
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
            socket.on('council:leave', (sessionId) => {
                socket.leave(`council:${sessionId}`);
            });
            // Create new council
            socket.on('council:create', async (data) => {
                try {
                    const sessionId = this.generateSessionId();
                    // Configure rounds
                    let config;
                    if (data.template === 'freeForAll') {
                        config = {
                            rounds: [],
                            freeForAll: true,
                            contextPrompt: data.contextPrompt,
                        };
                    }
                    else if (data.customRounds) {
                        config = {
                            rounds: data.customRounds,
                            freeForAll: false,
                            contextPrompt: data.contextPrompt,
                        };
                    }
                    else {
                        config = {
                            rounds: councilStateMachine_1.ROUND_TEMPLATES[data.template || 'standard'],
                            freeForAll: false,
                            contextPrompt: data.contextPrompt,
                        };
                    }
                    // Create session components
                    const orchestrator = new councilOrchestrator_1.CouncilOrchestrator(sessionId);
                    const stateMachine = new councilStateMachine_1.CouncilStateMachine(config);
                    const timer = new timerService_1.TimerService();
                    // Wire up orchestrator events
                    this.setupOrchestratorEvents(sessionId, orchestrator);
                    // Wire up state machine events
                    this.setupStateMachineEvents(sessionId, stateMachine, orchestrator, timer);
                    // Wire up timer events
                    this.setupTimerEvents(sessionId, timer, stateMachine);
                    // Create session
                    const session = {
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
                }
                catch (error) {
                    socket.emit('council:error', {
                        error: 'Failed to create council session',
                        details: error instanceof Error ? error.message : 'Unknown error',
                    });
                }
            });
            // Start council
            socket.on('council:start', async (sessionId) => {
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
                }
                catch (error) {
                    socket.emit('council:error', {
                        error: 'Failed to start council',
                        details: error instanceof Error ? error.message : 'Unknown error',
                    });
                }
            });
            // Send message (Armaan)
            socket.on('council:message', async (data) => {
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
            socket.on('council:pause', (sessionId) => {
                const session = this.sessions.get(sessionId);
                if (!session)
                    return;
                session.stateMachine.pause();
                session.timer.pause('system');
            });
            // Resume council
            socket.on('council:resume', (sessionId) => {
                const session = this.sessions.get(sessionId);
                if (!session)
                    return;
                session.stateMachine.resume();
                session.timer.resume();
            });
            // Force advance round
            socket.on('council:advance', (sessionId) => {
                const session = this.sessions.get(sessionId);
                if (!session)
                    return;
                session.timer.forceAdvance();
            });
            // End council
            socket.on('council:end', async (sessionId) => {
                const session = this.sessions.get(sessionId);
                if (!session)
                    return;
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
    setupOrchestratorEvents(sessionId, orchestrator) {
        orchestrator.on('message', (message) => {
            this.io.to(`council:${sessionId}`).emit('council:message', {
                sessionId,
                message,
            });
        });
        orchestrator.on('agentStatus', (data) => {
            this.io.to(`council:${sessionId}`).emit('council:agent', {
                sessionId,
                ...data,
            });
        });
        orchestrator.on('allAgentsReady', (agents) => {
            this.io.to(`council:${sessionId}`).emit('council:agents_ready', {
                sessionId,
                agents,
            });
        });
    }
    setupStateMachineEvents(sessionId, stateMachine, orchestrator, timer) {
        stateMachine.on('roundStart', async (data) => {
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
    setupTimerEvents(sessionId, timer, stateMachine) {
        timer.on('tick', (state) => {
            this.io.to(`council:${sessionId}`).emit('council:timer', {
                sessionId,
                timerState: state,
            });
        });
        timer.on('wrapUp', async (state) => {
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
    generateSessionId() {
        return `council_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Export session to idea bank format
     */
    async exportToIdeaBank(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session)
            return null;
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
exports.CouncilSocketHandler = CouncilSocketHandler;
exports.default = CouncilSocketHandler;
