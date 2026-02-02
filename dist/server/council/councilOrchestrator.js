"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CouncilOrchestrator = void 0;
const events_1 = require("events");
const clawdbotClient_1 = __importDefault(require("./clawdbotClient"));
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
class CouncilOrchestrator extends events_1.EventEmitter {
    constructor(sessionId, clawdbotUrl) {
        super();
        this.agents = new Map();
        this.messages = [];
        this.currentRound = 0;
        this.isActive = false;
        this.sessionId = sessionId;
        this.clawdbotClient = new clawdbotClient_1.default(clawdbotUrl);
    }
    /**
     * Initialize all agents
     */
    async initializeAgents(contextPrompt) {
        const personaFiles = [
            'visionary',
            'pragmatist',
            'critic',
            'behavioral-realist',
            'pattern-archaeologist',
            'systems-architect',
            'cognitive-load'
        ];
        const spawnPromises = personaFiles.map(async (personaFile) => {
            try {
                // Load persona definition
                const personaPath = path_1.default.join(__dirname, 'personas', `${personaFile}.json`);
                const personaData = JSON.parse(await promises_1.default.readFile(personaPath, 'utf-8'));
                // Spawn agent session
                const session = await this.clawdbotClient.spawnSession(personaData.role, personaData, contextPrompt);
                // Create agent instance
                const agent = {
                    role: personaData.role,
                    model: personaData.model,
                    sessionKey: session.sessionKey,
                    status: 'idle',
                    persona: personaData,
                    emoji: personaData.emoji,
                };
                this.agents.set(personaData.role, agent);
                this.emit('agentSpawned', {
                    role: personaData.role,
                    sessionKey: session.sessionKey,
                });
                return agent;
            }
            catch (error) {
                console.error(`Failed to initialize agent ${personaFile}:`, error);
                throw error;
            }
        });
        await Promise.all(spawnPromises);
        this.isActive = true;
        this.emit('allAgentsReady', Array.from(this.agents.values()));
    }
    /**
     * Broadcast a round prompt to all agents
     */
    async broadcastRoundPrompt(round, prompt) {
        this.currentRound = round;
        // Add system message
        const systemMessage = {
            id: this.generateMessageId(),
            timestamp: new Date(),
            author: 'system',
            content: prompt,
            round: round,
            isSystemMessage: true,
        };
        this.messages.push(systemMessage);
        this.emit('message', systemMessage);
        // Send prompt to all agents
        const sendPromises = Array.from(this.agents.values()).map(agent => this.sendToAgent(agent, prompt));
        await Promise.all(sendPromises);
    }
    /**
     * Broadcast wrap-up prompt to active agents
     */
    async broadcastWrapUp(wrapUpPrompt) {
        const systemMessage = {
            id: this.generateMessageId(),
            timestamp: new Date(),
            author: 'system',
            content: `⏰ ${wrapUpPrompt}`,
            round: this.currentRound,
            isSystemMessage: true,
        };
        this.messages.push(systemMessage);
        this.emit('message', systemMessage);
        // Send to all agents currently typing or idle
        const activeAgents = Array.from(this.agents.values())
            .filter(agent => agent.status !== 'waiting');
        const sendPromises = activeAgents.map(agent => this.sendToAgent(agent, wrapUpPrompt));
        await Promise.all(sendPromises);
    }
    /**
     * Handle message from Armaan
     */
    async handleArmaanMessage(content) {
        const message = {
            id: this.generateMessageId(),
            timestamp: new Date(),
            author: 'armaan',
            content: content,
            round: this.currentRound,
        };
        // Check for @mentions
        const mentionPattern = /@(\w+)/g;
        const mentions = content.match(mentionPattern);
        if (mentions) {
            const mentionedRole = mentions[0].substring(1).toLowerCase();
            message.replyTo = mentionedRole;
        }
        this.messages.push(message);
        this.emit('message', message);
        // Broadcast to all agents with context
        const contextMessage = `Armaan says: ${content}`;
        const sendPromises = Array.from(this.agents.values()).map(agent => {
            if (message.replyTo === agent.role) {
                return this.sendToAgent(agent, `Armaan asked you directly: ${content}`);
            }
            else {
                return this.sendToAgent(agent, contextMessage);
            }
        });
        await Promise.all(sendPromises);
    }
    /**
     * Send message to specific agent and listen for response
     */
    async sendToAgent(agent, message) {
        try {
            // Update agent status
            this.updateAgentStatus(agent.role, 'typing');
            // Send message
            await this.clawdbotClient.sendMessage(agent.sessionKey, message);
            // Get response (with timeout)
            const response = await this.clawdbotClient.getResponse(agent.sessionKey, undefined, agent.model === 'opus' ? 20000 : 10000 // Different timeouts for models
            );
            if (response) {
                // Create agent message
                const agentMessage = {
                    id: this.generateMessageId(),
                    timestamp: new Date(),
                    author: agent.role,
                    content: response,
                    round: this.currentRound,
                };
                this.messages.push(agentMessage);
                this.updateAgentStatus(agent.role, 'idle');
                // Emit message event
                this.emit('message', agentMessage);
                // Broadcast this message to other agents (context accumulation)
                await this.broadcastToOthers(agent.role, agentMessage);
            }
            else {
                this.updateAgentStatus(agent.role, 'idle');
            }
        }
        catch (error) {
            console.error(`Error sending to agent ${agent.role}:`, error);
            this.updateAgentStatus(agent.role, 'idle');
        }
    }
    /**
     * Broadcast agent message to other agents
     */
    async broadcastToOthers(senderRole, message) {
        const contextMessage = `${message.author}: ${message.content}`;
        const otherAgents = Array.from(this.agents.values())
            .filter(agent => agent.role !== senderRole);
        // Send in background, don't wait
        otherAgents.forEach(agent => {
            this.clawdbotClient.sendMessage(agent.sessionKey, contextMessage)
                .catch(err => console.error(`Failed to broadcast to ${agent.role}:`, err));
        });
    }
    /**
     * Update agent status
     */
    updateAgentStatus(role, status) {
        const agent = this.agents.get(role);
        if (agent) {
            agent.status = status;
            this.emit('agentStatus', { role, status });
        }
    }
    /**
     * Get all agents
     */
    getAgents() {
        return Array.from(this.agents.values());
    }
    /**
     * Get all messages
     */
    getMessages() {
        return this.messages;
    }
    /**
     * Terminate all agent sessions
     */
    async terminate() {
        if (!this.isActive)
            return;
        const terminatePromises = Array.from(this.agents.values()).map(agent => this.clawdbotClient.terminateSession(agent.sessionKey));
        await Promise.all(terminatePromises);
        this.agents.clear();
        this.isActive = false;
        this.emit('terminated');
    }
    /**
     * Generate unique message ID
     */
    generateMessageId() {
        return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
exports.CouncilOrchestrator = CouncilOrchestrator;
exports.default = CouncilOrchestrator;
