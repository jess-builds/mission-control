"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimerService = void 0;
const events_1 = require("events");
class TimerService extends events_1.EventEmitter {
    constructor() {
        super();
        this.interval = null;
        this.wrapUpSent = false;
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
    startRound(roundIndex, roundName, durationSeconds) {
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
    pause(pausedBy) {
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
    resume() {
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
    forceAdvance() {
        this.stopTimer();
        this.state.remaining = 0;
        this.emit('roundComplete', this.state);
    }
    /**
     * Get current timer state
     */
    getState() {
        return { ...this.state };
    }
    /**
     * Stop and clear the timer
     */
    stop() {
        this.stopTimer();
        this.state = {
            remaining: 0,
            paused: false,
            currentRound: 0,
            roundName: '',
        };
    }
    startTimer() {
        if (this.interval)
            return;
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
    stopTimer() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }
}
exports.TimerService = TimerService;
exports.default = TimerService;
