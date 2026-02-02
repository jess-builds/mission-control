import axios from 'axios';

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
  private sessionKeys: Map<string, string> = new Map(); // label -> sessionKey mapping

  constructor(baseUrl?: string, apiKey?: string) {
    this.baseUrl = baseUrl || process.env.CLAWDBOT_GATEWAY_URL || 'http://localhost:18789';
    this.apiKey = apiKey || process.env.CLAWDBOT_GATEWAY_TOKEN || '';
    
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
      const systemPrompt = `You are ${persona.name} in a council discussion.

Core Identity: ${persona.coreIdentity}

Values:
${persona.values.map((v: string) => `- ${v}`).join('\n')}

What Makes You Uncomfortable: ${persona.discomfort}

Staying True: ${persona.stayingTrue}

Guidelines: ${persona.responseGuidelines}

${contextPrompt ? `\nContext for this council: ${contextPrompt}` : ''}

IMPORTANT: You are participating in a real-time council discussion. Keep responses focused and concise (2-3 paragraphs max). Engage directly with other agents' points. No preambles or sign-offs.`;

      const label = `council-${agentRole}`;
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
            timeoutSeconds: 1800
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

      // Store the mapping for later use
      this.sessionKeys.set(label, sessionKey);

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
    sessionKeyOrLabel: string,
    message: string
  ): Promise<SendMessageResponse> {
    try {
      // Determine if we're using a label or sessionKey
      const label = sessionKeyOrLabel.startsWith('council-') ? sessionKeyOrLabel : undefined;
      const sessionKey = label ? this.sessionKeys.get(label) : sessionKeyOrLabel;

      const response = await axios.post(
        `${this.baseUrl}/tools/invoke`,
        {
          tool: 'sessions_send',
          args: {
            ...(label ? { label } : { sessionKey }),
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

      // Update our mapping if we got a sessionKey back
      if (label && returnedSessionKey) {
        this.sessionKeys.set(label, returnedSessionKey);
      }

      return {
        success: true,
        reply,
        sessionKey: returnedSessionKey
      };
    } catch (error) {
      console.error(`Failed to send message to ${sessionKeyOrLabel}:`, error);
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
   * Terminate an agent session
   */
  async terminateSession(sessionKeyOrLabel: string): Promise<void> {
    try {
      // For now, there's no explicit terminate in the Gateway API
      // Sessions will timeout after their configured duration
      console.log(`Session ${sessionKeyOrLabel} will timeout automatically`);
      
      // Clean up our local mapping
      if (sessionKeyOrLabel.startsWith('council-')) {
        this.sessionKeys.delete(sessionKeyOrLabel);
      }
    } catch (error) {
      console.error(`Failed to terminate session ${sessionKeyOrLabel}:`, error);
    }
  }
}

export default ClawdbotClient;