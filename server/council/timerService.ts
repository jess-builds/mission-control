import { EventEmitter } from 'events';

export interface TimerState {
  remaining: number; // seconds
  paused: boolean;
  pausedBy?: 'armaan' | 'system';
  currentRound: number;
  roundName: string;
}

export class TimerService extends EventEmitter {
  private state: TimerState;
  private interval: NodeJS.Timeout | null = null;
  private wrapUpSent: boolean = false;

  constructor() {
    super();
    this.state = {
      remaining: 0,
      paused: false,
      currentRound: 0,
      roundName: '',
    };
  }

  /**
   * Start a new round timer
   */
  startRound(roundIndex: number, roundName: string, durationSeconds: number): void {
    this.stopTimer();
    
    this.state = {
      remaining: durationSeconds,
      paused: false,
      currentRound: roundIndex,
      roundName,
    };
    
    this.wrapUpSent = false;
    this.emit('roundStart', this.state);
    this.startTimer();
  }

  /**
   * Pause the timer
   */
  pause(pausedBy: 'armaan' | 'system'): void {
    if (!this.state.paused) {
      this.state.paused = true;
      this.state.pausedBy = pausedBy;
      this.stopTimer();
      this.emit('paused', this.state);
    }
  }

  /**
   * Resume the timer
   */
  resume(): void {
    if (this.state.paused) {
      this.state.paused = false;
      this.state.pausedBy = undefined;
      this.startTimer();
      this.emit('resumed', this.state);
    }
  }

  /**
   * Force advance to next round
   */
  forceAdvance(): void {
    this.stopTimer();
    this.state.remaining = 0;
    this.emit('roundComplete', this.state);
  }

  /**
   * Get current timer state
   */
  getState(): TimerState {
    return { ...this.state };
  }

  /**
   * Stop and clear the timer
   */
  stop(): void {
    this.stopTimer();
    this.state = {
      remaining: 0,
      paused: false,
      currentRound: 0,
      roundName: '',
    };
  }

  private startTimer(): void {
    if (this.interval) return;

    this.interval = setInterval(() => {
      if (this.state.remaining > 0) {
        this.state.remaining--;
        
        // Emit tick event every second
        this.emit('tick', this.state);

        // Check for wrap-up time (30 seconds remaining)
        if (this.state.remaining === 30 && !this.wrapUpSent) {
          this.wrapUpSent = true;
          this.emit('wrapUp', this.state);
        }

        // Check for final countdown (10 seconds)
        if (this.state.remaining === 10) {
          this.emit('finalCountdown', this.state);
        }

        // Round complete
        if (this.state.remaining === 0) {
          this.stopTimer();
          this.emit('roundComplete', this.state);
        }
      }
    }, 1000);
  }

  private stopTimer(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}

export default TimerService;