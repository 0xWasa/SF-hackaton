export interface AgentConfig {
  agentId: string;
  name: string;
  openaiApiKey: string;
  interval: number; // ms between steps
  maxPositionPct: number; // max % of balance per trade
  personality: 'conservative' | 'degen' | 'arbitrage';
}

export interface AgentLog {
  timestamp: Date;
  agentId: string;
  agentName: string;
  observation: string;
  reasoning: string;
  actions: AgentAction[];
  portfolioValue: number;
}

export interface AgentAction {
  type: 'place_trade' | 'close_position' | 'hold';
  details: Record<string, any>;
  result: 'success' | 'error';
  message: string;
}

export interface AgentStatus {
  agentId: string;
  name: string;
  personality: string;
  isRunning: boolean;
  lastStep?: Date;
  totalSteps: number;
  logs: AgentLog[];
}
