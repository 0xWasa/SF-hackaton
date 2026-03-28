import { TradingAgent } from './trader';
import { getPaperTradingEngine } from '../trading/paper-engine';
import type { AgentConfig, AgentLog, AgentStatus } from '@/types/agent';

class AgentManager {
  private agents: Map<string, TradingAgent> = new Map();

  createAndStartAgent(config: AgentConfig): TradingAgent {
    // Stop existing agent with same ID if running
    this.stopAgent(config.agentId);

    const agent = new TradingAgent(config);
    this.agents.set(config.agentId, agent);
    agent.start();
    return agent;
  }

  stopAgent(agentId: string): void {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.stop();
      this.agents.delete(agentId);
    }
  }

  stopAll(): void {
    for (const [id] of this.agents) {
      this.stopAgent(id);
    }
  }

  getAgent(agentId: string): TradingAgent | undefined {
    return this.agents.get(agentId);
  }

  getAllStatuses(): AgentStatus[] {
    return Array.from(this.agents.values()).map((agent) => agent.getStatus());
  }

  getAgentLogs(agentId: string): AgentLog[] {
    const agent = this.agents.get(agentId);
    return agent ? agent.getLogs() : [];
  }

  launchAllLobsters(openaiApiKey: string): void {
    const isDemo = process.env.DEMO_MODE === 'true';
    const interval = isDemo ? 10_000 : 30_000;

    const paper = getPaperTradingEngine();

    const lobsters: Omit<AgentConfig, 'openaiApiKey' | 'interval'>[] = [
      {
        agentId: 'conservative-lobster',
        name: 'The Conservative Lobster',
        maxPositionPct: 5,
        personality: 'conservative',
      },
      {
        agentId: 'degen-lobster',
        name: 'The Degen Lobster',
        maxPositionPct: 10,
        personality: 'degen',
      },
      {
        agentId: 'arbitrage-lobster',
        name: 'The Arbitrage Lobster',
        maxPositionPct: 5,
        personality: 'arbitrage',
      },
    ];

    for (const lobster of lobsters) {
      // Create paper trading account for each agent
      paper.createAccount(lobster.agentId, lobster.name, `${lobster.personality} strategy`, 10_000);

      this.createAndStartAgent({
        ...lobster,
        openaiApiKey,
        interval,
      });
    }

    console.log(`[AgentManager] Launched ${lobsters.length} lobsters (interval: ${interval}ms)`);
  }
}

let manager: AgentManager | null = null;

export function getAgentManager(): AgentManager {
  if (!manager) {
    manager = new AgentManager();
  }
  return manager;
}
