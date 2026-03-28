import { NextRequest, NextResponse } from 'next/server';
import { getAgentManager } from '@/lib/agent/manager';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const manager = getAgentManager();
    const agent = manager.getAgent(id);

    if (!agent) {
      return NextResponse.json(
        { error: `Agent ${id} not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: agent.getStatus(),
      logs: agent.getLogs(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
