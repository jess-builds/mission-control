export interface CouncilSession {
  id: string;
  status: 'configuring' | 'running' | 'paused' | 'completed';
  createdAt: Date;
  config: CouncilConfig;
  agents: AgentInstance[];
  messages: CouncilMessage[];
  currentRound: number;
  timerState: TimerState;
  output?: {
    ideaId?: string;
    summary?: string;
    winningProposal?: string;
  };
}

export interface CouncilConfig {
  rounds: Round[];
  freeForAll: boolean;
  contextPrompt?: string;
}

export interface Round {
  name: string;
  durationSeconds: number;
  prompt: string;
  wrapUpPrompt?: string;
  wrapUpSent?: boolean;
}

export interface AgentInstance {
  role: string;
  model: 'opus' | 'sonnet';
  sessionKey: string;
  status: 'idle' | 'typing' | 'waiting';
  persona: Persona;
  emoji: string;
}

export interface Persona {
  role: string;
  name: string;
  emoji: string;
  model: 'opus' | 'sonnet';
  coreIdentity: string;
  values: string[];
  discomfort: string;
  stayingTrue: string;
  responseGuidelines: string;
}

export interface CouncilMessage {
  id: string;
  timestamp: Date;
  author: string; // agent role or 'armaan'
  content: string;
  round: number;
  replyTo?: string;
  isSystemMessage?: boolean;
}

export interface TimerState {
  remaining: number; // seconds
  paused: boolean;
  pausedBy?: 'armaan' | 'system';
  currentRound: number;
  roundName: string;
}

export interface RoundTemplate {
  name: string;
  description: string;
  rounds?: Round[];
  freeForAll?: boolean;
}

// Socket event types
export interface CouncilSocketEvents {
  // Client to server
  'council:join': (sessionId: string) => void;
  'council:leave': (sessionId: string) => void;
  'council:create': (data: {
    template?: 'standard' | 'quick' | 'freeForAll';
    customRounds?: Round[];
    contextPrompt?: string;
  }) => void;
  'council:start': (sessionId: string) => void;
  'council:message': (data: { sessionId: string; content: string }) => void;
  'council:pause': (sessionId: string) => void;
  'council:resume': (sessionId: string) => void;
  'council:advance': (sessionId: string) => void;
  'council:end': (sessionId: string) => void;
  'council:list': () => void;

  // Server to client
  'council:state': (state: CouncilSession) => void;
  'council:created': (data: { sessionId: string; config: CouncilConfig }) => void;
  'council:started': (data: { sessionId: string }) => void;
  'council:message': (data: { sessionId: string; message: CouncilMessage }) => void;
  'council:agent': (data: { sessionId: string; role: string; status: string }) => void;
  'council:agents_ready': (data: { sessionId: string; agents: AgentInstance[] }) => void;
  'council:round': (data: {
    sessionId: string;
    roundIndex: number;
    round: Round;
    totalRounds: number;
  }) => void;
  'council:timer': (data: { sessionId: string; timerState: TimerState }) => void;
  'council:status': (data: { sessionId: string; status: string }) => void;
  'council:error': (data: { error: string; details?: string }) => void;
  'council:list': (sessions: any[]) => void;
}