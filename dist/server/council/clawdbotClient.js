"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClawdbotClient = void 0;
const axios_1 = __importDefault(require("axios"));
class ClawdbotClient {
    constructor(baseUrl = 'http://localhost:3000', apiKey) {
        this.baseUrl = baseUrl;
        this.apiKey = apiKey;
    }
    /**
     * Spawn a new agent session with a specific persona
     */
    async spawnSession(agentRole, persona, contextPrompt) {
        try {
            const systemPrompt = `You are ${persona.name} in a council discussion.

Core Identity: ${persona.coreIdentity}

Values:
${persona.values.map((v) => `- ${v}`).join('\n')}

What Makes You Uncomfortable: ${persona.discomfort}

Staying True: ${persona.stayingTrue}

Guidelines: ${persona.responseGuidelines}

${contextPrompt ? `\nContext for this council: ${contextPrompt}` : ''}

IMPORTANT: You are participating in a real-time council discussion. Keep responses focused and concise (2-3 paragraphs max). Engage directly with other agents' points. No preambles or sign-offs.`;
            const response = await axios_1.default.post(`${this.baseUrl}/api/sessions/spawn`, {
                label: `council-${agentRole}`,
                model: persona.model === 'opus' ? 'claude-opus-4' : 'claude-sonnet-4',
                systemPrompt,
                temperature: 0.8, // Slightly higher for more varied responses
            }, {
                headers: this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {},
            });
            return {
                sessionKey: response.data.sessionKey,
                status: response.data.status,
            };
        }
        catch (error) {
            console.error(`Failed to spawn session for ${agentRole}:`, error);
            throw error;
        }
    }
    /**
     * Send a message to an agent session
     */
    async sendMessage(sessionKey, message) {
        try {
            const response = await axios_1.default.post(`${this.baseUrl}/api/sessions/${sessionKey}/send`, {
                message,
            }, {
                headers: this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {},
            });
            return {
                success: true,
                messageId: response.data.messageId,
            };
        }
        catch (error) {
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
    async getResponse(sessionKey, lastMessageId, timeout = 30000) {
        const startTime = Date.now();
        while (Date.now() - startTime < timeout) {
            try {
                const response = await axios_1.default.get(`${this.baseUrl}/api/sessions/${sessionKey}/messages`, {
                    params: { after: lastMessageId },
                    headers: this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {},
                });
                if (response.data.messages && response.data.messages.length > 0) {
                    // Return the latest agent message
                    const agentMessage = response.data.messages
                        .filter((m) => m.role === 'assistant')
                        .pop();
                    if (agentMessage) {
                        return agentMessage.content;
                    }
                }
            }
            catch (error) {
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
    async terminateSession(sessionKey) {
        try {
            await axios_1.default.post(`${this.baseUrl}/api/sessions/${sessionKey}/terminate`, {}, {
                headers: this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {},
            });
        }
        catch (error) {
            console.error(`Failed to terminate session ${sessionKey}:`, error);
        }
    }
}
exports.ClawdbotClient = ClawdbotClient;
exports.default = ClawdbotClient;
