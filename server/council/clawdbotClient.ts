import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';

interface ClawdbotSession {
  sessionKey: string;
  status: string;
  runId?: string;
}

interface SendMessageResponse {
  success: boolean;
  reply?: string;
  sessionKey?: string;
  error?: string;
}

export class ClawdbotClient {
  private baseUrl: string;
  private apiKey: string;
  private sessionKeys: Map<string, string> = new Map(); // role -> sessionKey mapping
  private councilId: string;

  constructor(baseUrl?: string, apiKey?: string, councilId?: string) {
    this.baseUrl = baseUrl || process.env.CLAWDBOT_GATEWAY_URL || 'http://localhost:18789';
    this.apiKey = apiKey || process.env.CLAWDBOT_GATEWAY_TOKEN || '';
    this.councilId = councilId || `council_${Date.now()}`;
    
    if (!this.apiKey) {
      throw new Error('CLAWDBOT_GATEWAY_TOKEN is required');
    }
  }

  /**
   * Spawn a new agent session with a specific persona
   */
  async spawnSession(
    agentRole: string,
    persona: any,
    contextPrompt?: string
  ): Promise<ClawdbotSession> {
    try {
      // Use persona's built-in contextPrompt, or override with passed contextPrompt
      const effectiveContext = contextPrompt || persona.contextPrompt;
      
      const systemPrompt = `You are ${persona.name} in a council discussion.

${effectiveContext ? `Context: ${effectiveContext}\n` : ''}
Core Identity: ${persona.coreIdentity}

Values:
${persona.values.map((v: string) => `- ${v}`).join('\n')}

What Makes You Uncomfortable: ${persona.discomfort}

Staying True: ${persona.stayingTrue}

Guidelines: ${persona.responseGuidelines}

IMPORTANT: You are participating in a real-time council discussion. Keep responses focused and concise (2-3 paragraphs max). Engage directly with other agents' points. No preambles or sign-offs.`;

      const label = `${this.councilId}-${agentRole}`;
      const modelMap: { [key: string]: string } = {
        'opus': 'anthropic/claude-opus-4-20250514',
        'sonnet': 'anthropic/claude-sonnet-4-20250514'
      };

      const response = await axios.post(
        `${this.baseUrl}/tools/invoke`,
        {
          tool: 'sessions_spawn',
          args: {
            task: systemPrompt,
            label: label,
            model: modelMap[persona.model] || modelMap['sonnet'],
            timeoutSeconds: 1800,
            cleanup: 'keep'  // Keep session alive for ongoing conversation
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.data.ok) {
        throw new Error(response.data.error || 'Failed to spawn session');
      }

      const sessionKey = response.data.result?.details?.childSessionKey;
      const runId = response.data.result?.details?.runId;

      if (!sessionKey) {
        throw new Error('No sessionKey returned from spawn');
      }

      // Store the mapping by role for later use
      this.sessionKeys.set(agentRole, sessionKey);

      return {
        sessionKey,
        status: 'active',
        runId
      };
    } catch (error) {
      console.error(`Failed to spawn session for ${agentRole}:`, error);
      throw error;
    }
  }

  /**
   * Send a message to an agent session
   */
  async sendMessage(
    sessionKeyOrRole: string,
    message: string
  ): Promise<SendMessageResponse> {
    try {
      // Always use sessionKey for reliability (labels can have duplicates from old sessions)
      const sessionKey = this.sessionKeys.get(sessionKeyOrRole) || sessionKeyOrRole;

      const response = await axios.post(
        `${this.baseUrl}/tools/invoke`,
        {
          tool: 'sessions_send',
          args: {
            sessionKey: sessionKey,
            message: message,
            timeoutSeconds: 60
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.data.ok) {
        return {
          success: false,
          error: response.data.error || 'Failed to send message'
        };
      }

      const reply = response.data.result?.details?.reply;
      const returnedSessionKey = response.data.result?.details?.sessionKey;

      return {
        success: true,
        reply,
        sessionKey: returnedSessionKey || sessionKey
      };
    } catch (error) {
      console.error(`Failed to send message to ${sessionKeyOrRole}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get response from an agent (no longer needed - sendMessage returns the reply)
   * Kept for backward compatibility
   */
  async getResponse(
    sessionKey: string,
    lastMessageId?: string,
    timeout: number = 30000
  ): Promise<string | null> {
    // This method is no longer needed since sendMessage returns the reply directly
    console.warn('getResponse is deprecated - sendMessage now returns the reply directly');
    return null;
  }

  /**
   * List active sessions
   */
  async listSessions(limit: number = 10): Promise<any[]> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/tools/invoke`,
        {
          tool: 'sessions_list',
          args: { limit }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.data.ok) {
        throw new Error(response.data.error || 'Failed to list sessions');
      }

      return response.data.result || [];
    } catch (error) {
      console.error('Failed to list sessions:', error);
      return [];
    }
  }

  /**
   * Terminate an agent session by deleting its session file
   */
  async terminateSession(sessionKeyOrLabel: string): Promise<void> {
    try {
      // Get the session info to find the sessionId
      const sessionKey = this.sessionKeys.get(sessionKeyOrLabel) || sessionKeyOrLabel;
      
      // Try to get session details from sessions_list to find the sessionId
      const sessions = await this.listSessions(50);
      const session = sessions.find((s: any) => 
        s.key === sessionKey || 
        s.label === sessionKeyOrLabel ||
        s.sessionKey === sessionKey
      );
      
      if (session?.sessionId) {
        // Delete the session file
        const sessionDir = path.join(
          process.env.HOME || '/home/ubuntu',
          '.clawdbot/agents/main/sessions'
        );
        const sessionFile = path.join(sessionDir, `${session.sessionId}.jsonl`);
        const lockFile = path.join(sessionDir, `${session.sessionId}.jsonl.lock`);
        
        try {
          await fs.unlink(sessionFile);
          console.log(`Deleted session file: ${session.sessionId}`);
        } catch (e) {
          // File might not exist, that's ok
        }
        
        try {
          await fs.unlink(lockFile);
        } catch (e) {
          // Lock file might not exist, that's ok
        }
      } else {
        console.log(`Could not find session to terminate: ${sessionKeyOrLabel}`);
      }
      
      // Clean up our local mapping
      this.sessionKeys.delete(sessionKeyOrLabel);
    } catch (error) {
      console.error(`Failed to terminate session ${sessionKeyOrLabel}:`, error);
    }
  }
}

export default ClawdbotClient;