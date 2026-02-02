"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClawdbotClient = void 0;
const axios_1 = __importDefault(require("axios"));
class ClawdbotClient {
    constructor(baseUrl, apiKey) {
        this.sessionKeys = new Map(); // label -> sessionKey mapping
        this.baseUrl = baseUrl || process.env.CLAWDBOT_GATEWAY_URL || 'http://localhost:18789';
        this.apiKey = apiKey || process.env.CLAWDBOT_GATEWAY_TOKEN || '';
        if (!this.apiKey) {
            throw new Error('CLAWDBOT_GATEWAY_TOKEN is required');
        }
    }
    /**
     * Spawn a new agent session with a specific persona
     */
    async spawnSession(agentRole, persona, contextPrompt) {
        var _a, _b, _c, _d;
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
            const label = `council-${agentRole}`;
            const modelMap = {
                'opus': 'anthropic/claude-opus-4-20250514',
                'sonnet': 'anthropic/claude-sonnet-4-20250514'
            };
            const response = await axios_1.default.post(`${this.baseUrl}/tools/invoke`, {
                tool: 'sessions_spawn',
                args: {
                    task: systemPrompt,
                    label: label,
                    model: modelMap[persona.model] || modelMap['sonnet'],
                    timeoutSeconds: 1800
                }
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!response.data.ok) {
                throw new Error(response.data.error || 'Failed to spawn session');
            }
            const sessionKey = (_b = (_a = response.data.result) === null || _a === void 0 ? void 0 : _a.details) === null || _b === void 0 ? void 0 : _b.childSessionKey;
            const runId = (_d = (_c = response.data.result) === null || _c === void 0 ? void 0 : _c.details) === null || _d === void 0 ? void 0 : _d.runId;
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
        }
        catch (error) {
            console.error(`Failed to spawn session for ${agentRole}:`, error);
            throw error;
        }
    }
    /**
     * Send a message to an agent session
     */
    async sendMessage(sessionKeyOrLabel, message) {
        var _a, _b, _c, _d;
        try {
            // Determine if we're using a label or sessionKey
            const label = sessionKeyOrLabel.startsWith('council-') ? sessionKeyOrLabel : undefined;
            const sessionKey = label ? this.sessionKeys.get(label) : sessionKeyOrLabel;
            const response = await axios_1.default.post(`${this.baseUrl}/tools/invoke`, {
                tool: 'sessions_send',
                args: {
                    ...(label ? { label } : { sessionKey }),
                    message: message,
                    timeoutSeconds: 60
                }
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!response.data.ok) {
                return {
                    success: false,
                    error: response.data.error || 'Failed to send message'
                };
            }
            const reply = (_b = (_a = response.data.result) === null || _a === void 0 ? void 0 : _a.details) === null || _b === void 0 ? void 0 : _b.reply;
            const returnedSessionKey = (_d = (_c = response.data.result) === null || _c === void 0 ? void 0 : _c.details) === null || _d === void 0 ? void 0 : _d.sessionKey;
            // Update our mapping if we got a sessionKey back
            if (label && returnedSessionKey) {
                this.sessionKeys.set(label, returnedSessionKey);
            }
            return {
                success: true,
                reply,
                sessionKey: returnedSessionKey
            };
        }
        catch (error) {
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
    async getResponse(sessionKey, lastMessageId, timeout = 30000) {
        // This method is no longer needed since sendMessage returns the reply directly
        console.warn('getResponse is deprecated - sendMessage now returns the reply directly');
        return null;
    }
    /**
     * List active sessions
     */
    async listSessions(limit = 10) {
        try {
            const response = await axios_1.default.post(`${this.baseUrl}/tools/invoke`, {
                tool: 'sessions_list',
                args: { limit }
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!response.data.ok) {
                throw new Error(response.data.error || 'Failed to list sessions');
            }
            return response.data.result || [];
        }
        catch (error) {
            console.error('Failed to list sessions:', error);
            return [];
        }
    }
    /**
     * Terminate an agent session
     */
    async terminateSession(sessionKeyOrLabel) {
        try {
            // For now, there's no explicit terminate in the Gateway API
            // Sessions will timeout after their configured duration
            console.log(`Session ${sessionKeyOrLabel} will timeout automatically`);
            // Clean up our local mapping
            if (sessionKeyOrLabel.startsWith('council-')) {
                this.sessionKeys.delete(sessionKeyOrLabel);
            }
        }
        catch (error) {
            console.error(`Failed to terminate session ${sessionKeyOrLabel}:`, error);
        }
    }
}
exports.ClawdbotClient = ClawdbotClient;
exports.default = ClawdbotClient;
