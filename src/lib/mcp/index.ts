#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { HyperliquidClient } from "../hyperliquid/client";
import { createTradingMcpServer } from "./server";

async function main() {
  const privateKey = process.env.HYPERLIQUID_PRIVATE_KEY;
  const client = new HyperliquidClient(privateKey);

  const server = createTradingMcpServer(client);
  const transport = new StdioServerTransport();

  console.error("Starting Hyperliquid Trading MCP Server...");
  console.error(`Wallet: ${client.getWalletAddress() || "read-only (no private key)"}`);

  await server.connect(transport);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
