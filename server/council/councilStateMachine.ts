import { EventEmitter } from 'events';

export interface Round {
  name: string;
  durationSeconds: number;
  prompt: string;
  wrapUpPrompt?: string;
  wrapUpSent?: boolean;
}

export interface CouncilConfig {
  rounds: Round[];
  freeForAll: boolean;
  contextPrompt?: string;
}

export type CouncilStatus = 'configuring' | 'running' | 'paused' | 'completed';

export class CouncilStateMachine extends EventEmitter {
  private config: CouncilConfig;
  private currentRoundIndex: number = -1;
  private status: CouncilStatus = 'configuring';

  constructor(config: CouncilConfig) {
    super();
    this.config = config;
  }

  /**
   * Start the council session
   */
  start(): void {
    if (this.status !== 'configuring') {
      throw new Error('Council already started');
    }

    this.status = 'running';
    this.currentRoundIndex = 0;
    
    this.emit('councilStart', {
      config: this.config,
      status: this.status,
    });

    // Start first round if not free-for-all
    if (!this.config.freeForAll && this.config.rounds.length > 0) {
      this.startCurrentRound();
    }
  }

  /**
   * Advance to the next round
   */
  nextRound(): boolean {
    if (this.config.freeForAll) {
      return false; // No rounds in free-for-all
    }

    if (this.currentRoundIndex >= this.config.rounds.length - 1) {
      // No more rounds
      this.complete();
      return false;
    }

    this.currentRoundIndex++;
    this.startCurrentRound();
    return true;
  }

  /**
   * Get the current round
   */
  getCurrentRound(): Round | null {
    if (this.config.freeForAll || this.currentRoundIndex < 0) {
      return null;
    }
    return this.config.rounds[this.currentRoundIndex];
  }

  /**
   * Get current status
   */
  getStatus(): CouncilStatus {
    return this.status;
  }

  /**
   * Get current round index
   */
  getCurrentRoundIndex(): number {
    return this.currentRoundIndex;
  }

  /**
   * Get total number of rounds
   */
  getTotalRounds(): number {
    return this.config.rounds.length;
  }

  /**
   * Pause the council
   */
  pause(): void {
    if (this.status === 'running') {
      this.status = 'paused';
      this.emit('councilPaused');
    }
  }

  /**
   * Resume the council
   */
  resume(): void {
    if (this.status === 'paused') {
      this.status = 'running';
      this.emit('councilResumed');
    }
  }

  /**
   * Mark wrap-up sent for current round
   */
  markWrapUpSent(): void {
    const round = this.getCurrentRound();
    if (round) {
      round.wrapUpSent = true;
    }
  }

  /**
   * Complete the council session
   */
  complete(): void {
    this.status = 'completed';
    this.emit('councilComplete');
  }

  /**
   * Force end the council
   */
  forceEnd(): void {
    this.complete();
  }

  private startCurrentRound(): void {
    const round = this.getCurrentRound();
    if (!round) return;

    this.emit('roundStart', {
      roundIndex: this.currentRoundIndex,
      round: round,
      totalRounds: this.config.rounds.length,
    });
  }
}

// Default round templates
export const ROUND_TEMPLATES = {
  standard: [
    {
      name: "Proposals",
      durationSeconds: 300,
      prompt: "Visionary: Propose 2-3 distinct tool ideas. For each: name, one-liner, why valuable, what becomes possible.",
      wrapUpPrompt: "30 seconds remaining. Finalize your proposals."
    },
    {
      name: "Reactions",
      durationSeconds: 300,
      prompt: "All agents: React to the proposals through your specific lens. Be direct.",
      wrapUpPrompt: "30 seconds. Final reactions."
    },
    {
      name: "Defense",
      durationSeconds: 180,
      prompt: "Visionary: Address the council's concerns. Concede where valid, push back where wrong.",
      wrapUpPrompt: "Wrap up your defense."
    },
    {
      name: "Narrow",
      durationSeconds: 180,
      prompt: "All agents: Vote for top 2 ideas. Brief reasoning.",
      wrapUpPrompt: "Final votes."
    },
    {
      name: "Debate",
      durationSeconds: 300,
      prompt: "Stress-test the top 2 finalists. Attack, defend, evolve.",
      wrapUpPrompt: "Converge on a winner."
    },
    {
      name: "MVP Scope",
      durationSeconds: 300,
      prompt: "Define the minimum viable version. Trigger, data sources, output, what's OUT of scope.",
      wrapUpPrompt: "Finalize the spec."
    }
  ],
  
  quick: [
    {
      name: "Pitch",
      durationSeconds: 180,
      prompt: "Visionary: One idea. Make it count."
    },
    {
      name: "Rapid Fire",
      durationSeconds: 300,
      prompt: "All: Quick reactions. No essays. Hit the key points."
    },
    {
      name: "Decision",
      durationSeconds: 180,
      prompt: "Converge: Yes or no? If yes, define scope. If no, why?"
    }
  ]
};

export default CouncilStateMachine;