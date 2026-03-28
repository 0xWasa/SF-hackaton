export async function register() {
  // Increase undici connect timeout — the default 10s is too short
  // for this server to reach api.hyperliquid.xyz
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { Agent, setGlobalDispatcher } = await import('undici');
    setGlobalDispatcher(new Agent({ connect: { timeout: 30_000 } }));
  }
}
