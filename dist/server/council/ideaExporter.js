"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdeaExporter = void 0;
const axios_1 = __importDefault(require("axios"));
class IdeaExporter {
    constructor(apiUrl = 'http://localhost:3001') {
        this.apiUrl = apiUrl;
    }
    /**
     * Export council session to Idea Bank
     */
    async exportSession(messages, sessionId, roundNames) {
        try {
            // Extract the winning idea from messages
            const idea = this.extractIdeaFromMessages(messages, roundNames);
            if (!idea.title) {
                // No clear winner, save as discussion
                idea.title = 'Council Discussion';
                idea.summary = 'Ideas explored but no clear winner emerged';
            }
            // Format for API
            const payload = {
                title: idea.title,
                summary: idea.summary,
                why: idea.why,
                implementation: idea.implementation,
                ux: idea.ux,
                flow: idea.flow,
                tags: ['council-generated', 'auto-exported'],
                source: `council-session-${sessionId}`
            };
            // Send to Idea Bank API
            const response = await axios_1.default.post(`${this.apiUrl}/api/ideas`, payload, {
                headers: { 'Content-Type': 'application/json' }
            });
            return {
                success: true,
                ideaId: response.data.id
            };
        }
        catch (error) {
            console.error('Failed to export council idea:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    /**
     * Extract idea information from council messages
     */
    extractIdeaFromMessages(messages, roundNames) {
        const idea = {
            title: '',
            summary: '',
            why: '',
            implementation: '',
            ux: '',
            flow: ''
        };
        // Find round indices
        const mvpScopeRound = this.findRoundIndex('MVP Scope', roundNames);
        const narrowRound = this.findRoundIndex('Narrow', roundNames);
        const proposalsRound = this.findRoundIndex('Proposals', roundNames);
        // Get messages by round
        const mvpMessages = messages.filter(m => m.round === mvpScopeRound && !m.isSystemMessage);
        const narrowMessages = messages.filter(m => m.round === narrowRound && !m.isSystemMessage);
        const proposalMessages = messages.filter(m => m.round === proposalsRound && !m.isSystemMessage);
        // Extract winning idea title from voting or MVP discussion
        idea.title = this.extractWinningTitle(narrowMessages, mvpMessages);
        // Extract Visionary's "why" from proposals or MVP scope
        const visionaryMessages = messages.filter(m => m.author === 'visionary' && !m.isSystemMessage);
        idea.why = this.extractWhyFromVisionary(visionaryMessages, idea.title);
        // Extract Pragmatist's implementation from MVP Scope round
        const pragmatistMvpMessages = mvpMessages.filter(m => m.author === 'pragmatist');
        if (pragmatistMvpMessages.length > 0) {
            idea.implementation = this.extractImplementation(pragmatistMvpMessages[0].content);
        }
        // Extract UX principles from Cognitive Load Specialist
        const cognitiveLoadMessages = messages.filter(m => m.author === 'cognitive-load' && !m.isSystemMessage);
        idea.ux = this.extractUxPrinciples(cognitiveLoadMessages, idea.title);
        // Extract summary from proposals or create one
        idea.summary = this.extractSummary(proposalMessages, idea.title) ||
            `A tool to ${idea.title.toLowerCase()}`;
        // Extract flow if discussed
        idea.flow = this.extractFlow(messages, idea.title);
        return idea;
    }
    /**
     * Find the index of a round by name
     */
    findRoundIndex(roundName, roundNames) {
        return roundNames.findIndex(name => name.toLowerCase().includes(roundName.toLowerCase()));
    }
    /**
     * Extract the winning proposal title
     */
    extractWinningTitle(narrowMessages, mvpMessages) {
        // First try to find from voting patterns
        const votedIdeas = {};
        narrowMessages.forEach(msg => {
            // Look for patterns like "1. Tool Name" or "vote for Tool Name"
            const votePatterns = [
                /(?:1\.|vote[s]? for|top pick[:]?)\s*([A-Z][A-Za-z\s-]+)/gi,
                /^([A-Z][A-Za-z\s-]+)[:]/gm
            ];
            votePatterns.forEach(pattern => {
                let match;
                const regex = new RegExp(pattern.source, pattern.flags);
                while ((match = regex.exec(msg.content)) !== null) {
                    const toolName = match[1].trim();
                    if (toolName.length > 3 && toolName.length < 50) {
                        votedIdeas[toolName] = (votedIdeas[toolName] || 0) + 1;
                    }
                }
            });
        });
        // Get most voted idea
        const sortedVotes = Object.entries(votedIdeas).sort((a, b) => b[1] - a[1]);
        if (sortedVotes.length > 0) {
            return sortedVotes[0][0];
        }
        // Fallback: Extract from MVP Scope discussion
        if (mvpMessages.length > 0) {
            const firstMvpMessage = mvpMessages[0].content;
            const titleMatch = firstMvpMessage.match(/^([A-Z][A-Za-z\s-]+)[:]/);
            if (titleMatch) {
                return titleMatch[1].trim();
            }
        }
        return '';
    }
    /**
     * Extract the "why" from Visionary messages
     */
    extractWhyFromVisionary(visionaryMessages, ideaTitle) {
        for (const msg of visionaryMessages) {
            // Look for the idea title in the message
            if (ideaTitle && msg.content.includes(ideaTitle)) {
                // Extract "why" patterns
                const whyPatterns = [
                    /why[:]?\s*([^.!?]+[.!?])/i,
                    /valuable because[:]?\s*([^.!?]+[.!?])/i,
                    /becomes possible[:]?\s*([^.!?]+[.!?])/i,
                    /vision[:]?\s*([^.!?]+[.!?])/i
                ];
                for (const pattern of whyPatterns) {
                    const match = msg.content.match(pattern);
                    if (match) {
                        return match[1].trim();
                    }
                }
            }
        }
        // Fallback: find any why statement
        const generalWhyPattern = /(?:why|because|vision|valuable|matters)[:]?\s*([^.!?]+[.!?])/i;
        for (const msg of visionaryMessages) {
            const match = msg.content.match(generalWhyPattern);
            if (match) {
                return match[1].trim();
            }
        }
        return 'Enable new workflows and reduce friction in daily tasks.';
    }
    /**
     * Extract implementation details from Pragmatist's MVP spec
     */
    extractImplementation(content) {
        const sections = [];
        // Extract trigger
        const triggerMatch = content.match(/trigger[s]?[:]?\s*([^.\n]+[.]?)/i);
        if (triggerMatch) {
            sections.push(`Trigger: ${triggerMatch[1].trim()}`);
        }
        // Extract data sources
        const dataMatch = content.match(/data\s*source[s]?[:]?\s*([^.\n]+[.]?)/i);
        if (dataMatch) {
            sections.push(`Data sources: ${dataMatch[1].trim()}`);
        }
        // Extract output
        const outputMatch = content.match(/output[s]?[:]?\s*([^.\n]+[.]?)/i);
        if (outputMatch) {
            sections.push(`Output: ${outputMatch[1].trim()}`);
        }
        // Extract out of scope
        const scopeMatch = content.match(/out\s*of\s*scope[:]?\s*([^.\n]+[.]?)/i);
        if (scopeMatch) {
            sections.push(`Out of scope: ${scopeMatch[1].trim()}`);
        }
        // Extract build estimate
        const estimateMatch = content.match(/(?:build\s*)?estimate[:]?\s*([^.\n]+[.]?)/i);
        if (estimateMatch) {
            sections.push(`Build estimate: ${estimateMatch[1].trim()}`);
        }
        return sections.length > 0 ? sections.join('\n') : content.slice(0, 500);
    }
    /**
     * Extract UX principles from Cognitive Load Specialist
     */
    extractUxPrinciples(cognitiveMessages, ideaTitle) {
        const principles = [];
        cognitiveMessages.forEach(msg => {
            if (!ideaTitle || msg.content.includes(ideaTitle)) {
                // Look for principle patterns
                const principlePatterns = [
                    /principle[s]?[:]?\s*([^.\n]+[.]?)/gi,
                    /(?:must|should|needs? to)\s+([^.\n]+[.]?)/gi,
                    /cognitive\s+load[:]?\s*([^.\n]+[.]?)/gi
                ];
                principlePatterns.forEach(pattern => {
                    let match;
                    const regex = new RegExp(pattern.source, pattern.flags);
                    while ((match = regex.exec(msg.content)) !== null) {
                        const principle = match[1].trim();
                        if (principle.length > 10 && principle.length < 200) {
                            principles.push(principle);
                        }
                    }
                });
            }
        });
        return principles.slice(0, 3).join('\n') ||
            'Minimize cognitive load through clear information hierarchy and progressive disclosure.';
    }
    /**
     * Extract summary from proposals
     */
    extractSummary(proposalMessages, ideaTitle) {
        for (const msg of proposalMessages) {
            if (ideaTitle && msg.content.includes(ideaTitle)) {
                // Look for one-liner after the title
                const summaryPattern = new RegExp(`${ideaTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[:]?\\s*([^.\n]+[.]?)`, 'i');
                const match = msg.content.match(summaryPattern);
                if (match && match[1].length > 10) {
                    return match[1].trim();
                }
            }
        }
        return '';
    }
    /**
     * Extract user flow if discussed
     */
    extractFlow(messages, ideaTitle) {
        const flowMessages = messages.filter(m => m.content.match(/flow[s]?|step[s]?|process|workflow/i) &&
            (!ideaTitle || m.content.includes(ideaTitle)));
        if (flowMessages.length === 0)
            return '';
        // Look for numbered steps
        const steps = [];
        flowMessages.forEach(msg => {
            let match;
            const stepRegex = /(?:\d+[.)]|step\s*\d+[:]?)\s*([^.\n]+[.]?)/gi;
            while ((match = stepRegex.exec(msg.content)) !== null) {
                steps.push(match[1].trim());
            }
        });
        return steps.slice(0, 5).join('\n');
    }
}
exports.IdeaExporter = IdeaExporter;
exports.default = IdeaExporter;
