import axios from 'axios';

interface ClawdbotSession {
  sessionKey: string;
  status: string;
}

interface SendMessageResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class ClawdbotClient {
  private baseUrl: string;
  private apiKey?: string;

  constructor(baseUrl: string = 'http://localhost:3000', apiKey?: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
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

      const response = await axios.post(
        `${this.baseUrl}/api/sessions/spawn`,
        {
          label: `council-${agentRole}`,
          model: persona.model === 'opus' ? 'claude-opus-4' : 'claude-sonnet-4',
          systemPrompt,
          temperature: 0.8, // Slightly higher for more varied responses
        },
        {
          headers: this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {},
        }
      );

      return {
        sessionKey: response.data.sessionKey,
        status: response.data.status,
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
    sessionKey: string,
    message: string
  ): Promise<SendMessageResponse> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/sessions/${sessionKey}/send`,
        {
          message,
        },
        {
          headers: this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {},
        }
      );

      return {
        success: true,
        messageId: response.data.messageId,
      };
    } catch (error) {
      console.error(`Failed to send message to ${sessionKey}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get response from an agent (polling)
   */
  async getResponse(
    sessionKey: string,
    lastMessageId?: string,
    timeout: number = 30000
  ): Promise<string | null> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      try {
        const response = await axios.get(
          `${this.baseUrl}/api/sessions/${sessionKey}/messages`,
          {
            params: { after: lastMessageId },
            headers: this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {},
          }
        );

        if (response.data.messages && response.data.messages.length > 0) {
          // Return the latest agent message
          const agentMessage = response.data.messages
            .filter((m: any) => m.role === 'assistant')
            .pop();
          
          if (agentMessage) {
            return agentMessage.content;
          }
        }
      } catch (error) {
        console.error(`Failed to get response from ${sessionKey}:`, error);
      }

      // Wait before polling again
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return null;
  }

  /**
   * Terminate an agent session
   */
  async terminateSession(sessionKey: string): Promise<void> {
    try {
      await axios.post(
        `${this.baseUrl}/api/sessions/${sessionKey}/terminate`,
        {},
        {
          headers: this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {},
        }
      );
    } catch (error) {
      console.error(`Failed to terminate session ${sessionKey}:`, error);
    }
  }
}

export default ClawdbotClient;