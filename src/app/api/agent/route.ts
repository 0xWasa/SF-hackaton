import { NextRequest, NextResponse } from 'next/server';
import { getAgentManager } from '@/lib/agent/manager';

export async function GET() {
  try {
    const manager = getAgentManager();
    const statuses = manager.getAllStatuses();

    return NextResponse.json({
      agents: statuses,
      totalAgents: statuses.length,
      runningAgents: statuses.filter((s) => s.isRunning).length,
    });
  } catch {
    return NextResponse.json({ agents: [], totalAgents: 0, runningAgents: 0 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, agentId } = body;
    const manager = getAgentManager();

    switch (action) {
      case 'launch-all': {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
          return NextResponse.json(
            { error: 'OPENAI_API_KEY not configured' },
            { status: 400 }
          );
        }
        manager.launchAllLobsters(apiKey);
        return NextResponse.json({
          message: 'All lobsters launched',
          agents: manager.getAllStatuses(),
        });
      }

      case 'start': {
        if (!agentId) {
          return NextResponse.json(
            { error: 'agentId required for start action' },
            { status: 400 }
          );
        }
        const agent = manager.getAgent(agentId);
        if (!agent) {
          return NextResponse.json(
            { error: `Agent ${agentId} not found` },
            { status: 404 }
          );
        }
        agent.start();
        return NextResponse.json({
          message: `Agent ${agentId} started`,
          status: agent.getStatus(),
        });
      }

      case 'stop': {
        if (agentId) {
          manager.stopAgent(agentId);
          return NextResponse.json({ message: `Agent ${agentId} stopped` });
        } else {
          manager.stopAll();
          return NextResponse.json({ message: 'All agents stopped' });
        }
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch {
    return NextResponse.json({ error: 'Service temporarily unavailable. Try again.' }, { status: 500 });
  }
}
