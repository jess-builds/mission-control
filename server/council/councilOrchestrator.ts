import { EventEmitter } from 'events';
import ClawdbotClient from './clawdbotClient';
import fs from 'fs/promises';
import path from 'path';

export interface AgentInstance {
  role: string;
  model: 'opus' | 'sonnet';
  sessionKey: string;
  status: 'idle' | 'typing' | 'waiting';
  persona: any;
  emoji: string;
}

export interface CouncilMessage {
  id: string;
  timestamp: Date;
  author: string; // agent role or 'armaan'
  content: string;
  round: number;
  replyTo?: string;
  isSystemMessage?: boolean;
}

export class CouncilOrchestrator extends EventEmitter {
  private clawdbotClient: ClawdbotClient;
  private agents: Map<string, AgentInstance> = new Map();
  private messages: CouncilMessage[] = [];
  private currentRound: number = 0;
  private sessionId: string;
  private isActive: boolean = false;

  constructor(sessionId: string, clawdbotUrl?: string) {
    super();
    this.sessionId = sessionId;
    this.clawdbotClient = new ClawdbotClient(clawdbotUrl);
  }

  /**
   * Initialize all agents
   */
  async initializeAgents(contextPrompt?: string): Promise<void> {
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
        const personaPath = path.join(__dirname, 'personas', `${personaFile}.json`);
        const personaData = JSON.parse(await fs.readFile(personaPath, 'utf-8'));

        // Spawn agent session
        const session = await this.clawdbotClient.spawnSession(
          personaData.role,
          personaData,
          contextPrompt
        );

        // Create agent instance
        const agent: AgentInstance = {
          role: personaData.role,
          model: personaData.model as 'opus' | 'sonnet',
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
      } catch (error) {
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
  async broadcastRoundPrompt(round: number, prompt: string): Promise<void> {
    this.currentRound = round;
    
    // Add system message
    const systemMessage: CouncilMessage = {
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
    const sendPromises = Array.from(this.agents.values()).map(agent =>
      this.sendToAgent(agent, prompt)
    );

    await Promise.all(sendPromises);
  }

  /**
   * Broadcast wrap-up prompt to active agents
   */
  async broadcastWrapUp(wrapUpPrompt: string): Promise<void> {
    const systemMessage: CouncilMessage = {
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

    const sendPromises = activeAgents.map(agent =>
      this.sendToAgent(agent, wrapUpPrompt)
    );

    await Promise.all(sendPromises);
  }

  /**
   * Handle message from Armaan
   */
  async handleArmaanMessage(content: string): Promise<void> {
    const message: CouncilMessage = {
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
      } else {
        return this.sendToAgent(agent, contextMessage);
      }
    });

    await Promise.all(sendPromises);
  }

  /**
   * Send message to specific agent and listen for response
   */
  private async sendToAgent(agent: AgentInstance, message: string): Promise<void> {
    try {
      // Update agent status
      this.updateAgentStatus(agent.role, 'typing');

      // Send message and get response directly
      const result = await this.clawdbotClient.sendMessage(agent.sessionKey, message);

      if (result.success && result.reply) {
        // Create agent message
        const agentMessage: CouncilMessage = {
          id: this.generateMessageId(),
          timestamp: new Date(),
          author: agent.role,
          content: result.reply,
          round: this.currentRound,
        };

        this.messages.push(agentMessage);
        this.updateAgentStatus(agent.role, 'idle');
        
        // Emit message event for Socket.io broadcast
        this.emit('message', agentMessage);

        // Broadcast this message to other agents (context accumulation)
        await this.broadcastToOthers(agent.role, agentMessage);
      } else {
        console.error(`Failed to get response from ${agent.role}:`, result.error);
        this.updateAgentStatus(agent.role, 'idle');
      }
    } catch (error) {
      console.error(`Error sending to agent ${agent.role}:`, error);
      this.updateAgentStatus(agent.role, 'idle');
    }
  }

  /**
   * Broadcast agent message to other agents
   */
  private async broadcastToOthers(senderRole: string, message: CouncilMessage): Promise<void> {
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
  private updateAgentStatus(role: string, status: AgentInstance['status']): void {
    const agent = this.agents.get(role);
    if (agent) {
      agent.status = status;
      this.emit('agentStatus', { role, status });
    }
  }

  /**
   * Get all agents
   */
  getAgents(): AgentInstance[] {
    return Array.from(this.agents.values());
  }

  /**
   * Get all messages
   */
  getMessages(): CouncilMessage[] {
    return this.messages;
  }

  /**
   * Terminate all agent sessions
   */
  async terminate(): Promise<void> {
    if (!this.isActive) return;

    const terminatePromises = Array.from(this.agents.values()).map(agent =>
      this.clawdbotClient.terminateSession(agent.sessionKey)
    );

    await Promise.all(terminatePromises);
    this.agents.clear();
    this.isActive = false;
    this.emit('terminated');
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default CouncilOrchestrator;