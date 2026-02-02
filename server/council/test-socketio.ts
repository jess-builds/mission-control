/**
 * Council Socket.io Connectivity Test Suite
 * 
 * Simulates the UI's Socket.io interactions to verify:
 * - All button endpoints work
 * - Events are emitted and received correctly
 * - UI receives correct data structures
 */

import { io, Socket } from 'socket.io-client';

const MC_URL = process.env.MC_URL || 'http://localhost:3001';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  details?: any;
}

class SocketIOTester {
  private socket: Socket | null = null;
  private results: TestResult[] = [];
  private receivedEvents: Map<string, any[]> = new Map();

  private log(msg: string) {
    console.log(`[${new Date().toISOString()}] ${msg}`);
  }

  private async connect(): Promise<boolean> {
    return new Promise((resolve) => {
      this.socket = io(MC_URL, {
        transports: ['polling', 'websocket'],
        timeout: 10000,
      });

      this.socket.on('connect', () => {
        this.log('✅ Connected to Socket.io server');
        resolve(true);
      });

      this.socket.on('connect_error', (err) => {
        this.log(`❌ Connection error: ${err.message}`);
        resolve(false);
      });

      // Track all received events
      const events = [
        'council:created',
        'council:started',
        'council:message',
        'council:agent',
        'council:agents_ready',
        'council:round',
        'council:timer',
        'council:status',
        'council:error',
        'council:sessions_list',
        'council:state',
        'council:idea-exported',
      ];

      events.forEach(event => {
        this.socket?.on(event, (data: any) => {
          if (!this.receivedEvents.has(event)) {
            this.receivedEvents.set(event, []);
          }
          this.receivedEvents.get(event)!.push(data);
          this.log(`📥 Received ${event}: ${JSON.stringify(data).substring(0, 100)}...`);
        });
      });

      setTimeout(() => resolve(false), 10000);
    });
  }

  private async waitForEvent(event: string, timeoutMs: number = 30000): Promise<any | null> {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const events = this.receivedEvents.get(event);
      if (events && events.length > 0) {
        return events.shift();
      }
      await new Promise(r => setTimeout(r, 100));
    }
    return null;
  }

  private emit(event: string, data?: any): void {
    this.log(`📤 Emitting ${event}: ${JSON.stringify(data || {}).substring(0, 100)}`);
    this.socket?.emit(event, data);
  }

  /**
   * TEST 1: Connection Test
   */
  async testConnection(): Promise<TestResult> {
    const name = '1. Socket.io Connection';
    this.log(`\n${'='.repeat(50)}\nTEST: ${name}\n${'='.repeat(50)}`);

    const connected = await this.connect();
    
    return {
      name,
      passed: connected,
      error: connected ? undefined : 'Failed to connect to Socket.io server',
    };
  }

  /**
   * TEST 2: Create Council (Standard Template)
   */
  async testCreateCouncil(): Promise<TestResult> {
    const name = '2. Create Council (Standard)';
    this.log(`\n${'='.repeat(50)}\nTEST: ${name}\n${'='.repeat(50)}`);

    try {
      this.emit('council:create', {
        template: 'standard',
        contextPrompt: 'Test context: Build a simple todo app',
      });

      const response = await this.waitForEvent('council:created', 10000);
      
      if (!response) {
        return { name, passed: false, error: 'No council:created event received' };
      }

      const hasSessionId = !!response.sessionId;
      const hasConfig = !!response.config;
      const hasRounds = response.config?.rounds?.length > 0;

      return {
        name,
        passed: hasSessionId && hasConfig && hasRounds,
        error: !hasSessionId ? 'Missing sessionId' : !hasConfig ? 'Missing config' : !hasRounds ? 'Missing rounds' : undefined,
        details: { sessionId: response.sessionId, roundCount: response.config?.rounds?.length },
      };
    } catch (err: any) {
      return { name, passed: false, error: err.message };
    }
  }

  /**
   * TEST 3: Create Council (Quick Template)
   */
  async testCreateCouncilQuick(): Promise<TestResult> {
    const name = '3. Create Council (Quick)';
    this.log(`\n${'='.repeat(50)}\nTEST: ${name}\n${'='.repeat(50)}`);

    try {
      this.emit('council:create', {
        template: 'quick',
        contextPrompt: 'Quick test',
      });

      const response = await this.waitForEvent('council:created', 10000);
      
      return {
        name,
        passed: !!response?.sessionId,
        details: { sessionId: response?.sessionId },
      };
    } catch (err: any) {
      return { name, passed: false, error: err.message };
    }
  }

  /**
   * TEST 4: Create Council (Free-for-All)
   */
  async testCreateCouncilFreeForAll(): Promise<TestResult> {
    const name = '4. Create Council (Free-for-All)';
    this.log(`\n${'='.repeat(50)}\nTEST: ${name}\n${'='.repeat(50)}`);

    try {
      this.emit('council:create', {
        template: 'freeForAll',
        contextPrompt: 'Free-for-all test',
      });

      const response = await this.waitForEvent('council:created', 10000);
      const isFreeForAll = response?.config?.freeForAll === true;
      
      return {
        name,
        passed: !!response?.sessionId && isFreeForAll,
        error: !isFreeForAll ? 'freeForAll flag not set' : undefined,
        details: { sessionId: response?.sessionId, freeForAll: isFreeForAll },
      };
    } catch (err: any) {
      return { name, passed: false, error: err.message };
    }
  }

  /**
   * TEST 5: Create Council (Custom Rounds)
   */
  async testCreateCouncilCustom(): Promise<TestResult> {
    const name = '5. Create Council (Custom Rounds)';
    this.log(`\n${'='.repeat(50)}\nTEST: ${name}\n${'='.repeat(50)}`);

    try {
      const customRounds = [
        { name: 'Brainstorm', durationSeconds: 60, prompt: 'Share initial ideas' },
        { name: 'Refine', durationSeconds: 60, prompt: 'Refine the best ideas' },
      ];

      this.emit('council:create', {
        customRounds,
        contextPrompt: 'Custom rounds test',
      });

      const response = await this.waitForEvent('council:created', 10000);
      const roundCount = response?.config?.rounds?.length;
      
      return {
        name,
        passed: roundCount === 2,
        error: roundCount !== 2 ? `Expected 2 rounds, got ${roundCount}` : undefined,
        details: { sessionId: response?.sessionId, roundCount },
      };
    } catch (err: any) {
      return { name, passed: false, error: err.message };
    }
  }

  /**
   * TEST 6: Join Council Session
   */
  async testJoinSession(): Promise<TestResult> {
    const name = '6. Join Council Session';
    this.log(`\n${'='.repeat(50)}\nTEST: ${name}\n${'='.repeat(50)}`);

    try {
      // First create a session
      this.emit('council:create', { template: 'quick', contextPrompt: 'Join test' });
      const created = await this.waitForEvent('council:created', 10000);
      
      if (!created?.sessionId) {
        return { name, passed: false, error: 'Failed to create session for join test' };
      }

      // Now join it
      this.emit('council:join', created.sessionId);
      
      // Should receive council:state
      const state = await this.waitForEvent('council:state', 5000);
      
      return {
        name,
        passed: !!state,
        error: !state ? 'No council:state received after join' : undefined,
        details: { sessionId: created.sessionId, receivedState: !!state },
      };
    } catch (err: any) {
      return { name, passed: false, error: err.message };
    }
  }

  /**
   * TEST 7: Start Council
   */
  async testStartCouncil(): Promise<TestResult> {
    const name = '7. Start Council';
    this.log(`\n${'='.repeat(50)}\nTEST: ${name}\n${'='.repeat(50)}`);

    try {
      // Create session
      this.emit('council:create', { template: 'quick', contextPrompt: 'Start test' });
      const created = await this.waitForEvent('council:created', 10000);
      
      if (!created?.sessionId) {
        return { name, passed: false, error: 'Failed to create session' };
      }

      // Start it
      this.emit('council:start', created.sessionId);
      
      // Should receive council:started
      const started = await this.waitForEvent('council:started', 30000);
      
      // May also receive council:agents_ready
      const agentsReady = await this.waitForEvent('council:agents_ready', 5000);

      return {
        name,
        passed: !!started,
        error: !started ? 'No council:started event received' : undefined,
        details: { 
          sessionId: created.sessionId, 
          started: !!started,
          agentsReady: !!agentsReady,
        },
      };
    } catch (err: any) {
      return { name, passed: false, error: err.message };
    }
  }

  /**
   * TEST 8: Send Message (Armaan Input)
   */
  async testSendMessage(): Promise<TestResult> {
    const name = '8. Send Message (User Input)';
    this.log(`\n${'='.repeat(50)}\nTEST: ${name}\n${'='.repeat(50)}`);

    try {
      // Create and start session
      this.emit('council:create', { template: 'quick', contextPrompt: 'Message test' });
      const created = await this.waitForEvent('council:created', 10000);
      
      if (!created?.sessionId) {
        return { name, passed: false, error: 'Failed to create session' };
      }

      this.emit('council:start', created.sessionId);
      await this.waitForEvent('council:started', 30000);

      // Send a message (simulates user typing in chat)
      this.emit('council:send_message', {
        sessionId: created.sessionId,
        content: 'What do you think about this idea?',
      });

      // Should trigger agent responses (council:message events)
      const message = await this.waitForEvent('council:message', 60000);

      return {
        name,
        passed: !!message,
        error: !message ? 'No agent response received' : undefined,
        details: { 
          sessionId: created.sessionId,
          receivedResponse: !!message,
          responseAuthor: message?.message?.author,
        },
      };
    } catch (err: any) {
      return { name, passed: false, error: err.message };
    }
  }

  /**
   * TEST 9: Pause/Resume Council
   */
  async testPauseResume(): Promise<TestResult> {
    const name = '9. Pause/Resume Council';
    this.log(`\n${'='.repeat(50)}\nTEST: ${name}\n${'='.repeat(50)}`);

    try {
      // Create and start
      this.emit('council:create', { template: 'quick', contextPrompt: 'Pause test' });
      const created = await this.waitForEvent('council:created', 10000);
      
      if (!created?.sessionId) {
        return { name, passed: false, error: 'Failed to create session' };
      }

      this.emit('council:start', created.sessionId);
      await this.waitForEvent('council:started', 30000);

      // Pause
      this.emit('council:pause', created.sessionId);
      
      // Check timer state shows paused
      const timerAfterPause = await this.waitForEvent('council:timer', 5000);
      const isPaused = timerAfterPause?.timerState?.paused === true;

      // Resume
      this.emit('council:resume', created.sessionId);
      const timerAfterResume = await this.waitForEvent('council:timer', 5000);
      const isResumed = timerAfterResume?.timerState?.paused === false;

      return {
        name,
        passed: isPaused && isResumed,
        error: !isPaused ? 'Pause did not work' : !isResumed ? 'Resume did not work' : undefined,
        details: { isPaused, isResumed },
      };
    } catch (err: any) {
      return { name, passed: false, error: err.message };
    }
  }

  /**
   * TEST 10: Advance Round (Skip Button)
   */
  async testAdvanceRound(): Promise<TestResult> {
    const name = '10. Advance Round (Skip)';
    this.log(`\n${'='.repeat(50)}\nTEST: ${name}\n${'='.repeat(50)}`);

    try {
      // Create with standard template (has multiple rounds)
      this.emit('council:create', { template: 'standard', contextPrompt: 'Advance test' });
      const created = await this.waitForEvent('council:created', 10000);
      
      if (!created?.sessionId) {
        return { name, passed: false, error: 'Failed to create session' };
      }

      this.emit('council:start', created.sessionId);
      await this.waitForEvent('council:started', 30000);

      // Wait for first round to start
      const round1 = await this.waitForEvent('council:round', 10000);
      const initialRound = round1?.roundIndex || 0;

      // Advance to next round
      this.emit('council:advance', created.sessionId);
      
      // Should get new round event
      const round2 = await this.waitForEvent('council:round', 30000);
      const newRound = round2?.roundIndex;

      return {
        name,
        passed: newRound !== undefined && newRound > initialRound,
        error: newRound === undefined ? 'No round advance event' : newRound <= initialRound ? 'Round did not advance' : undefined,
        details: { initialRound, newRound },
      };
    } catch (err: any) {
      return { name, passed: false, error: err.message };
    }
  }

  /**
   * TEST 11: End Council
   */
  async testEndCouncil(): Promise<TestResult> {
    const name = '11. End Council';
    this.log(`\n${'='.repeat(50)}\nTEST: ${name}\n${'='.repeat(50)}`);

    try {
      // Create and start
      this.emit('council:create', { template: 'quick', contextPrompt: 'End test' });
      const created = await this.waitForEvent('council:created', 10000);
      
      if (!created?.sessionId) {
        return { name, passed: false, error: 'Failed to create session' };
      }

      this.emit('council:start', created.sessionId);
      await this.waitForEvent('council:started', 30000);

      // End it
      this.emit('council:end', created.sessionId);
      
      // Should get status=completed
      const status = await this.waitForEvent('council:status', 10000);
      const isCompleted = status?.status === 'completed';

      return {
        name,
        passed: isCompleted,
        error: !isCompleted ? `Expected status=completed, got ${status?.status}` : undefined,
        details: { status: status?.status },
      };
    } catch (err: any) {
      return { name, passed: false, error: err.message };
    }
  }

  /**
   * TEST 12: List Sessions
   */
  async testListSessions(): Promise<TestResult> {
    const name = '12. List Sessions';
    this.log(`\n${'='.repeat(50)}\nTEST: ${name}\n${'='.repeat(50)}`);

    try {
      this.emit('council:list_sessions');
      
      const list = await this.waitForEvent('council:sessions_list', 5000);
      
      return {
        name,
        passed: Array.isArray(list),
        error: !Array.isArray(list) ? 'Did not receive sessions array' : undefined,
        details: { sessionCount: Array.isArray(list) ? list.length : 0 },
      };
    } catch (err: any) {
      return { name, passed: false, error: err.message };
    }
  }

  /**
   * TEST 13: Timer Ticks
   */
  async testTimerTicks(): Promise<TestResult> {
    const name = '13. Timer Ticks';
    this.log(`\n${'='.repeat(50)}\nTEST: ${name}\n${'='.repeat(50)}`);

    try {
      // Create and start
      this.emit('council:create', { template: 'quick', contextPrompt: 'Timer test' });
      const created = await this.waitForEvent('council:created', 10000);
      
      if (!created?.sessionId) {
        return { name, passed: false, error: 'Failed to create session' };
      }

      this.emit('council:start', created.sessionId);
      await this.waitForEvent('council:started', 30000);

      // Wait for timer ticks
      const tick1 = await this.waitForEvent('council:timer', 5000);
      const tick2 = await this.waitForEvent('council:timer', 5000);

      const hasRemaining = tick1?.timerState?.remaining !== undefined;
      const hasRoundName = !!tick1?.timerState?.roundName;

      return {
        name,
        passed: hasRemaining && hasRoundName,
        error: !hasRemaining ? 'No remaining time in timer' : !hasRoundName ? 'No round name in timer' : undefined,
        details: { 
          remaining: tick1?.timerState?.remaining,
          roundName: tick1?.timerState?.roundName,
          ticksReceived: tick1 && tick2 ? 2 : tick1 ? 1 : 0,
        },
      };
    } catch (err: any) {
      return { name, passed: false, error: err.message };
    }
  }

  /**
   * TEST 14: Error Handling (Invalid Session)
   */
  async testErrorHandling(): Promise<TestResult> {
    const name = '14. Error Handling';
    this.log(`\n${'='.repeat(50)}\nTEST: ${name}\n${'='.repeat(50)}`);

    try {
      // Try to start a non-existent session
      this.emit('council:start', 'invalid-session-id-12345');
      
      const error = await this.waitForEvent('council:error', 5000);
      
      return {
        name,
        passed: !!error,
        error: !error ? 'No error event for invalid session' : undefined,
        details: { errorReceived: !!error, errorMessage: error?.error },
      };
    } catch (err: any) {
      return { name, passed: false, error: err.message };
    }
  }

  /**
   * Run all tests
   */
  async runAllTests(): Promise<void> {
    console.log('\n' + '═'.repeat(60));
    console.log('  SOCKET.IO CONNECTIVITY TEST SUITE');
    console.log('  Server: ' + MC_URL);
    console.log('═'.repeat(60) + '\n');

    // Connection test first
    const connResult = await this.testConnection();
    this.results.push(connResult);

    if (!connResult.passed) {
      console.log('\n❌ Cannot continue - connection failed');
      this.printSummary();
      return;
    }

    // Run remaining tests
    const tests = [
      () => this.testCreateCouncil(),
      () => this.testCreateCouncilQuick(),
      () => this.testCreateCouncilFreeForAll(),
      () => this.testCreateCouncilCustom(),
      () => this.testJoinSession(),
      () => this.testListSessions(),
      () => this.testErrorHandling(),
      // These tests are longer - run them last
      // () => this.testStartCouncil(),
      // () => this.testSendMessage(),
      // () => this.testPauseResume(),
      // () => this.testAdvanceRound(),
      // () => this.testEndCouncil(),
      // () => this.testTimerTicks(),
    ];

    for (const test of tests) {
      const result = await test();
      this.results.push(result);
      await new Promise(r => setTimeout(r, 1000));
    }

    this.printSummary();
    this.socket?.disconnect();
  }

  private printSummary(): void {
    console.log('\n' + '═'.repeat(60));
    console.log('  TEST SUMMARY');
    console.log('═'.repeat(60));

    let passed = 0;
    let failed = 0;

    for (const result of this.results) {
      const status = result.passed ? '✅' : '❌';
      console.log(`${status} ${result.name}`);
      if (result.error) {
        console.log(`   └─ Error: ${result.error}`);
      }
      if (result.details) {
        console.log(`   └─ Details: ${JSON.stringify(result.details)}`);
      }
      result.passed ? passed++ : failed++;
    }

    console.log('─'.repeat(60));
    console.log(`Total: ${passed} passed, ${failed} failed`);
    console.log('═'.repeat(60) + '\n');
  }
}

// Run tests
const tester = new SocketIOTester();
tester.runAllTests().catch(console.error);
