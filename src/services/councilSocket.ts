import { io, Socket } from 'socket.io-client';
import { CouncilSocketEvents, CouncilMessage, TimerState, AgentInstance, Round } from '@/types/council';

export class CouncilSocketService {
  private socket: Socket<CouncilSocketEvents> | null = null;
  private listeners: Map<string, Function[]> = new Map();

  /**
   * Connect to the council socket server
   */
  connect(): void {
    if (this.socket?.connected) return;

    this.socket = io({
      path: '/socket.io/',
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('Connected to council socket server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from council socket server');
    });
  }

  /**
   * Disconnect from the server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners.clear();
  }

  /**
   * Join a council session
   */
  joinSession(sessionId: string): void {
    this.socket?.emit('council:join', sessionId);
  }

  /**
   * Leave a council session
   */
  leaveSession(sessionId: string): void {
    this.socket?.emit('council:leave', sessionId);
  }

  /**
   * Create a new council
   */
  createCouncil(data: {
    template?: 'standard' | 'quick' | 'freeForAll';
    customRounds?: Round[];
    contextPrompt?: string;
  }): void {
    this.socket?.emit('council:create', data);
  }

  /**
   * Start a council session
   */
  startCouncil(sessionId: string): void {
    this.socket?.emit('council:start', sessionId);
  }

  /**
   * Send a message (as Armaan)
   */
  sendMessage(sessionId: string, content: string): void {
    this.socket?.emit('council:send_message', { sessionId, content });
  }

  /**
   * Pause the council
   */
  pauseCouncil(sessionId: string): void {
    this.socket?.emit('council:pause', sessionId);
  }

  /**
   * Resume the council
   */
  resumeCouncil(sessionId: string): void {
    this.socket?.emit('council:resume', sessionId);
  }

  /**
   * Force advance to next round
   */
  advanceRound(sessionId: string): void {
    this.socket?.emit('council:advance', sessionId);
  }

  /**
   * End the council session
   */
  endCouncil(sessionId: string): void {
    this.socket?.emit('council:end', sessionId);
  }

  /**
   * Request list of all sessions
   */
  requestSessionList(): void {
    this.socket?.emit('council:list_sessions');
  }

  /**
   * Listen for council events
   */
  on(event: string, callback: Function): void {
    if (!this.socket) return;

    const listeners = this.listeners.get(event) || [];
    listeners.push(callback);
    this.listeners.set(event, listeners);

    this.socket.on(event as any, callback as any);
  }

  /**
   * Remove event listener
   */
  off(event: string, callback: Function): void {
    if (!this.socket) return;

    const listeners = this.listeners.get(event) || [];
    const index = listeners.indexOf(callback);
    if (index > -1) {
      listeners.splice(index, 1);
      this.listeners.set(event, listeners);
    }

    this.socket.off(event as any, callback as any);
  }

  /**
   * Remove all listeners for an event
   */
  removeAllListeners(event?: string): void {
    if (!this.socket) return;

    if (event) {
      this.listeners.delete(event);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.socket.removeAllListeners(event as any);
    } else {
      this.listeners.clear();
      this.socket.removeAllListeners();
    }
  }
}

// Singleton instance
export const councilSocket = new CouncilSocketService();

export default councilSocket;