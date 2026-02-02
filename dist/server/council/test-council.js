"use strict";
/**
 * Council Comprehensive Test Suite
 *
 * Tests the council orchestration with fast models (Haiku)
 * to verify coordination, timing, and error handling.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
// Use Haiku for fast testing
const TEST_MODEL = 'anthropic/claude-3-5-haiku-20241022';
class CouncilTester {
    constructor() {
        this.results = [];
        this.currentLogs = [];
        this.baseUrl = process.env.CLAWDBOT_GATEWAY_URL || 'http://localhost:18789';
        this.apiKey = process.env.CLAWDBOT_GATEWAY_TOKEN || '';
    }
    log(message) {
        const timestamp = new Date().toISOString();
        const logLine = `[${timestamp}] ${message}`;
        console.log(logLine);
        this.currentLogs.push(logLine);
    }
    async spawnTestAgent(role, councilId) {
        var _a, _b;
        try {
            const personaPath = path_1.default.join(__dirname, 'personas', `${role}.json`);
            let persona;
            try {
                persona = JSON.parse(await promises_1.default.readFile(personaPath, 'utf-8'));
            }
            catch {
                // Use minimal persona for testing
                persona = {
                    role,
                    name: `Test ${role}`,
                    model: 'haiku',
                    coreIdentity: `You are a test ${role} agent. Keep responses very brief (1-2 sentences).`,
                    values: ['brevity', 'clarity'],
                    discomfort: 'Long responses',
                    stayingTrue: 'Be concise',
                    responseGuidelines: 'Maximum 2 sentences per response.'
                };
            }
            const systemPrompt = `TEST MODE: You are ${persona.name}. 
Core: ${persona.coreIdentity}
IMPORTANT: Keep responses to 1-2 sentences MAX for testing purposes.`;
            const label = `test-${councilId}-${role}`;
            const response = await axios_1.default.post(`${this.baseUrl}/tools/invoke`, {
                tool: 'sessions_spawn',
                args: {
                    task: systemPrompt,
                    label: label,
                    model: TEST_MODEL,
                    timeoutSeconds: 300
                }
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            });
            if (!response.data.ok) {
                this.log(`❌ Failed to spawn ${role}: ${response.data.error}`);
                return null;
            }
            const sessionKey = (_b = (_a = response.data.result) === null || _a === void 0 ? void 0 : _a.details) === null || _b === void 0 ? void 0 : _b.childSessionKey;
            this.log(`✅ Spawned ${role}: ${sessionKey === null || sessionKey === void 0 ? void 0 : sessionKey.substring(0, 20)}...`);
            return sessionKey;
        }
        catch (error) {
            this.log(`❌ Error spawning ${role}: ${error.message}`);
            return null;
        }
    }
    async sendToAgent(sessionKey, message) {
        var _a, _b;
        try {
            const response = await axios_1.default.post(`${this.baseUrl}/tools/invoke`, {
                tool: 'sessions_send',
                args: {
                    sessionKey,
                    message,
                    timeoutSeconds: 30
                }
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 35000
            });
            if (!response.data.ok) {
                return null;
            }
            return ((_b = (_a = response.data.result) === null || _a === void 0 ? void 0 : _a.details) === null || _b === void 0 ? void 0 : _b.reply) || null;
        }
        catch (error) {
            this.log(`❌ Send failed: ${error.message}`);
            return null;
        }
    }
    /**
     * Test 1: Basic Visionary-First Flow
     */
    async testVisionaryFirst() {
        const testName = 'Visionary-First Flow';
        this.currentLogs = [];
        const errors = [];
        const startTime = Date.now();
        const councilId = `vf-${Date.now()}`;
        this.log(`\n${'='.repeat(50)}`);
        this.log(`TEST: ${testName}`);
        this.log(`${'='.repeat(50)}`);
        try {
            // Spawn only 3 agents for quick test
            const roles = ['visionary', 'pragmatist', 'critic'];
            const agents = new Map();
            this.log('Phase 1: Spawning agents...');
            for (const role of roles) {
                const sessionKey = await this.spawnTestAgent(role, councilId);
                if (sessionKey) {
                    agents.set(role, sessionKey);
                }
                else {
                    errors.push(`Failed to spawn ${role}`);
                }
            }
            if (agents.size < 3) {
                errors.push('Not all agents spawned');
                return { name: testName, passed: false, duration: Date.now() - startTime, errors, logs: this.currentLogs };
            }
            this.log('Phase 2: Sending prompt to Visionary ONLY...');
            const visionaryKey = agents.get('visionary');
            const visionaryResponse = await this.sendToAgent(visionaryKey, 'Propose ONE simple tool idea in 1-2 sentences.');
            if (!visionaryResponse) {
                errors.push('Visionary did not respond');
                return { name: testName, passed: false, duration: Date.now() - startTime, errors, logs: this.currentLogs };
            }
            this.log(`Visionary responded: "${visionaryResponse.substring(0, 100)}..."`);
            this.log('Phase 3: Broadcasting Visionary ideas to others...');
            const broadcastMessage = `The Visionary proposed: ${visionaryResponse}\n\nGive your quick reaction (1 sentence).`;
            for (const [role, sessionKey] of agents) {
                if (role === 'visionary')
                    continue;
                const response = await this.sendToAgent(sessionKey, broadcastMessage);
                if (response) {
                    this.log(`${role} responded: "${response.substring(0, 80)}..."`);
                }
                else {
                    errors.push(`${role} did not respond`);
                }
            }
            const passed = errors.length === 0;
            this.log(`\nResult: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
            return {
                name: testName,
                passed,
                duration: Date.now() - startTime,
                errors,
                logs: this.currentLogs
            };
        }
        catch (error) {
            errors.push(`Unexpected error: ${error.message}`);
            return { name: testName, passed: false, duration: Date.now() - startTime, errors, logs: this.currentLogs };
        }
    }
    /**
     * Test 2: Quick Rounds (Short Duration)
     */
    async testQuickRounds() {
        const testName = 'Quick Rounds (30s each)';
        this.currentLogs = [];
        const errors = [];
        const startTime = Date.now();
        const councilId = `qr-${Date.now()}`;
        this.log(`\n${'='.repeat(50)}`);
        this.log(`TEST: ${testName}`);
        this.log(`${'='.repeat(50)}`);
        try {
            // Spawn 2 agents
            const roles = ['visionary', 'critic'];
            const agents = new Map();
            for (const role of roles) {
                const sessionKey = await this.spawnTestAgent(role, councilId);
                if (sessionKey)
                    agents.set(role, sessionKey);
            }
            if (agents.size < 2) {
                errors.push('Failed to spawn agents');
                return { name: testName, passed: false, duration: Date.now() - startTime, errors, logs: this.currentLogs };
            }
            // Simulate 2 quick rounds
            const rounds = [
                { name: 'Pitch', prompt: 'Propose one idea (1 sentence).' },
                { name: 'Critique', prompt: 'Critique the idea (1 sentence).' }
            ];
            for (let i = 0; i < rounds.length; i++) {
                this.log(`\nRound ${i + 1}: ${rounds[i].name}`);
                for (const [role, sessionKey] of agents) {
                    const response = await this.sendToAgent(sessionKey, rounds[i].prompt);
                    if (response) {
                        this.log(`  ${role}: "${response.substring(0, 60)}..."`);
                    }
                    else {
                        errors.push(`Round ${i + 1}: ${role} failed`);
                    }
                }
            }
            const passed = errors.length === 0;
            this.log(`\nResult: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
            return { name: testName, passed, duration: Date.now() - startTime, errors, logs: this.currentLogs };
        }
        catch (error) {
            errors.push(`Unexpected error: ${error.message}`);
            return { name: testName, passed: false, duration: Date.now() - startTime, errors, logs: this.currentLogs };
        }
    }
    /**
     * Test 3: All 7 Agents Coordination
     */
    async testFullCouncil() {
        const testName = 'Full Council (7 Agents)';
        this.currentLogs = [];
        const errors = [];
        const startTime = Date.now();
        const councilId = `fc-${Date.now()}`;
        this.log(`\n${'='.repeat(50)}`);
        this.log(`TEST: ${testName}`);
        this.log(`${'='.repeat(50)}`);
        try {
            const roles = [
                'visionary', 'pragmatist', 'critic',
                'behavioral-realist', 'pattern-archaeologist',
                'systems-architect', 'cognitive-load'
            ];
            const agents = new Map();
            this.log('Spawning all 7 agents...');
            const spawnPromises = roles.map(async (role) => {
                const sessionKey = await this.spawnTestAgent(role, councilId);
                return { role, sessionKey };
            });
            const results = await Promise.all(spawnPromises);
            for (const { role, sessionKey } of results) {
                if (sessionKey) {
                    agents.set(role, sessionKey);
                }
                else {
                    errors.push(`Failed to spawn ${role}`);
                }
            }
            this.log(`Spawned ${agents.size}/7 agents`);
            if (agents.size < 5) {
                errors.push('Too many spawn failures');
                return { name: testName, passed: false, duration: Date.now() - startTime, errors, logs: this.currentLogs };
            }
            // Test Visionary-first coordination
            this.log('\nTesting Visionary-first flow...');
            const visionaryKey = agents.get('visionary');
            if (visionaryKey) {
                const idea = await this.sendToAgent(visionaryKey, 'Propose one tool idea in 1 sentence.');
                if (idea) {
                    this.log(`Visionary: "${idea.substring(0, 80)}..."`);
                    // Broadcast to 2 random others to save time
                    const otherRoles = Array.from(agents.keys()).filter(r => r !== 'visionary').slice(0, 2);
                    for (const role of otherRoles) {
                        const key = agents.get(role);
                        const response = await this.sendToAgent(key, `React to this: ${idea}`);
                        if (response) {
                            this.log(`${role}: "${response.substring(0, 60)}..."`);
                        }
                    }
                }
                else {
                    errors.push('Visionary failed to respond');
                }
            }
            const passed = errors.length <= 2; // Allow some tolerance
            this.log(`\nResult: ${passed ? '✅ PASSED' : '❌ FAILED'} (${errors.length} errors)`);
            return { name: testName, passed, duration: Date.now() - startTime, errors, logs: this.currentLogs };
        }
        catch (error) {
            errors.push(`Unexpected error: ${error.message}`);
            return { name: testName, passed: false, duration: Date.now() - startTime, errors, logs: this.currentLogs };
        }
    }
    /**
     * Test 4: Error Handling (Invalid Session)
     */
    async testErrorHandling() {
        const testName = 'Error Handling';
        this.currentLogs = [];
        const errors = [];
        const startTime = Date.now();
        this.log(`\n${'='.repeat(50)}`);
        this.log(`TEST: ${testName}`);
        this.log(`${'='.repeat(50)}`);
        try {
            // Test sending to invalid session
            this.log('Testing invalid session handling...');
            const response = await this.sendToAgent('invalid-session-key-12345', 'Hello');
            if (response === null) {
                this.log('✅ Correctly returned null for invalid session');
            }
            else {
                errors.push('Should have failed for invalid session');
            }
            const passed = errors.length === 0;
            this.log(`\nResult: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
            return { name: testName, passed, duration: Date.now() - startTime, errors, logs: this.currentLogs };
        }
        catch (error) {
            // Expected to catch errors gracefully
            this.log(`✅ Error caught gracefully: ${error.message}`);
            return { name: testName, passed: true, duration: Date.now() - startTime, errors: [], logs: this.currentLogs };
        }
    }
    /**
     * Run all tests
     */
    async runAllTests() {
        console.log('\n' + '═'.repeat(60));
        console.log('  COUNCIL COMPREHENSIVE TEST SUITE');
        console.log('  Model: ' + TEST_MODEL);
        console.log('═'.repeat(60) + '\n');
        const tests = [
            () => this.testVisionaryFirst(),
            () => this.testQuickRounds(),
            () => this.testFullCouncil(),
            () => this.testErrorHandling(),
        ];
        for (const test of tests) {
            const result = await test();
            this.results.push(result);
            // Small delay between tests
            await new Promise(r => setTimeout(r, 2000));
        }
        // Summary
        console.log('\n' + '═'.repeat(60));
        console.log('  TEST SUMMARY');
        console.log('═'.repeat(60));
        let passed = 0;
        let failed = 0;
        for (const result of this.results) {
            const status = result.passed ? '✅' : '❌';
            const duration = (result.duration / 1000).toFixed(1);
            console.log(`${status} ${result.name} (${duration}s)`);
            if (result.errors.length > 0) {
                result.errors.forEach(e => console.log(`   └─ ${e}`));
            }
            result.passed ? passed++ : failed++;
        }
        console.log('─'.repeat(60));
        console.log(`Total: ${passed} passed, ${failed} failed`);
        console.log('═'.repeat(60) + '\n');
        // Save results
        const reportPath = '/tmp/council-test-results.json';
        await promises_1.default.writeFile(reportPath, JSON.stringify(this.results, null, 2));
        console.log(`Full results saved to: ${reportPath}`);
    }
}
// Run tests
const tester = new CouncilTester();
tester.runAllTests().catch(console.error);
