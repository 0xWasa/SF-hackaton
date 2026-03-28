/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-explicit-any */
// @ts-nocheck — SDK types require newer TS features (ErrorOptions)
import {
  HttpTransport,
  InfoClient,
  ExchangeClient,
} from "@nktkas/hyperliquid";
import { privateKeyToAccount } from "viem/accounts";
import type {
  Market,
  Orderbook,
  OrderbookLevel,
  AccountState,
  Position,
  Order,
  Candle,
  PlaceOrderParams,
  OrderResult,
} from "@/types/trading";

const MAINNET_URL = "https://api.hyperliquid.xyz";
const TESTNET_URL = "https://api.hyperliquid-testnet.xyz";

type CandleInterval = "1m" | "3m" | "5m" | "15m" | "30m" | "1h" | "2h" | "4h" | "8h" | "12h" | "1d" | "3d" | "1w" | "1M";

let assetIndexMap: Map<string, number> | null = null;

export class HyperliquidClient {
  // Reads from mainnet (real prices), writes to testnet (paper trading)
  private mainnetInfo: InfoClient;
  private testnetInfo: InfoClient;
  private exchange: ExchangeClient | null = null;
  private walletAddress: string | null = null;

  constructor(privateKey?: string) {
    const mainnetTransport = new HttpTransport({ url: MAINNET_URL });
    const testnetTransport = new HttpTransport({ url: TESTNET_URL });

    this.mainnetInfo = new InfoClient({ transport: mainnetTransport });
    this.testnetInfo = new InfoClient({ transport: testnetTransport });

    if (privateKey) {
      const account = privateKeyToAccount(
        privateKey.startsWith("0x")
          ? (privateKey as `0x${string}`)
          : (`0x${privateKey}` as `0x${string}`)
      );
      this.walletAddress = account.address;
      this.exchange = new ExchangeClient({
        transport: testnetTransport,
        wallet: account,
      });
    }
  }

  getWalletAddress(): string | null {
    return this.walletAddress;
  }

  // --- Asset index uses mainnet (source of truth for pairs) ---

  async getAssetIndex(symbol: string): Promise<number> {
    if (!assetIndexMap) {
      const meta = await this.mainnetInfo.meta();
      assetIndexMap = new Map();
      meta.universe.forEach((asset: any, index: number) => {
        assetIndexMap!.set(asset.name.toUpperCase(), index);
      });
    }
    const index = assetIndexMap.get(symbol.toUpperCase());
    if (index === undefined) {
      throw new Error(`Unknown asset: ${symbol}`);
    }
    return index;
  }

  // --- Read operations: MAINNET (real prices & data) ---

  async getMarkets(): Promise<Market[]> {
    const [meta, assetCtxs] = await this.mainnetInfo.metaAndAssetCtxs();

    return meta.universe.map((asset: any, index: number) => {
      const ctx = assetCtxs[index];
      const midPx = ctx?.midPx ? parseFloat(ctx.midPx) : 0;
      const prevDayPx = ctx?.prevDayPx ? parseFloat(ctx.prevDayPx) : 0;
      const dayNtlVlm = ctx?.dayNtlVlm ? parseFloat(ctx.dayNtlVlm) : 0;
      const funding = ctx?.funding ? parseFloat(ctx.funding) : 0;
      const openInterest = ctx?.openInterest ? parseFloat(ctx.openInterest) : 0;
      const change24h = prevDayPx > 0 ? ((midPx - prevDayPx) / prevDayPx) * 100 : 0;

      return {
        symbol: asset.name,
        price: midPx,
        volume24h: dayNtlVlm,
        change24h,
        prevDayPx,
        funding,
        openInterest,
      };
    });
  }

  async getOrderbook(symbol: string): Promise<Orderbook> {
    const book = await this.mainnetInfo.l2Book({ coin: symbol });

    const mapLevels = (levels: any[]): OrderbookLevel[] =>
      levels.slice(0, 10).map((l: any) => ({
        price: parseFloat(l.px),
        size: parseFloat(l.sz),
      }));

    return {
      coin: symbol,
      bids: mapLevels(book.levels[0]),
      asks: mapLevels(book.levels[1]),
    };
  }

  async getCandles(
    symbol: string,
    interval: CandleInterval = "1h",
    limit: number = 100
  ): Promise<Candle[]> {
    const now = Date.now();
    const intervalMs: Record<string, number> = {
      "1m": 60_000,
      "5m": 300_000,
      "15m": 900_000,
      "1h": 3_600_000,
      "4h": 14_400_000,
      "1d": 86_400_000,
    };
    const ms = intervalMs[interval] || 3_600_000;
    const startTime = now - ms * limit;

    const candles = await this.mainnetInfo.candleSnapshot({
      coin: symbol,
      interval,
      startTime,
      endTime: now,
    });

    return candles.map((c: any) => ({
      timestamp: c.t,
      open: parseFloat(c.o),
      high: parseFloat(c.h),
      low: parseFloat(c.l),
      close: parseFloat(c.c),
      volume: parseFloat(c.v),
    }));
  }

  // --- Account state: TESTNET (paper trading balances) ---

  async getAccountState(address?: string): Promise<AccountState> {
    const user = address || this.walletAddress;
    if (!user) throw new Error("No address provided and no wallet configured");

    const [state, openOrders] = await Promise.all([
      this.testnetInfo.clearinghouseState({ user: user as `0x${string}` }),
      this.testnetInfo.openOrders({ user: user as `0x${string}` }),
    ]);

    const positions: Position[] = (state as any).assetPositions
      .filter((p: any) => parseFloat(p.position.szi) !== 0)
      .map((p: any) => {
        const size = parseFloat(p.position.szi);
        return {
          symbol: p.position.coin,
          side: size > 0 ? "long" : "short",
          size: Math.abs(size),
          entryPrice: parseFloat(p.position.entryPx || "0"),
          unrealizedPnl: parseFloat(p.position.unrealizedPnl),
          leverage: parseFloat(String(p.position.leverage?.value || "1")),
        };
      });

    const orders: Order[] = openOrders.map((o: any) => ({
      id: o.oid.toString(),
      symbol: o.coin,
      side: o.side === "B" ? "buy" : "sell",
      size: parseFloat(o.sz),
      price: parseFloat(o.limitPx),
      type: "limit" as const,
      status: "open",
    }));

    return {
      address: user,
      balance: parseFloat((state as any).marginSummary.accountValue),
      totalMarginUsed: parseFloat((state as any).marginSummary.totalMarginUsed),
      totalUnrealizedPnl: positions.reduce((sum, p) => sum + p.unrealizedPnl, 0),
      positions,
      openOrders: orders,
    };
  }

  // --- Write operations: TESTNET (paper trades) ---

  async placeOrder(params: PlaceOrderParams): Promise<OrderResult> {
    if (!this.exchange)
      throw new Error("Exchange client not initialized — provide a private key");

    const assetIndex = await this.getAssetIndex(params.symbol);
    const isBuy = params.side === "buy";

    const orderType =
      params.type === "market"
        ? { limit: { tif: "Ioc" as const } }
        : { limit: { tif: "Gtc" as const } };

    // For market orders, get real price from mainnet
    let price: string;
    if (params.type === "market") {
      const mids = await this.mainnetInfo.allMids();
      const mid = parseFloat((mids as any)[params.symbol] || "0");
      price = isBuy
        ? (mid * 1.01).toFixed(6)
        : (mid * 0.99).toFixed(6);
    } else {
      price = params.price!.toFixed(6);
    }

    try {
      const result = await this.exchange.order({
        orders: [
          {
            a: assetIndex,
            b: isBuy,
            p: price,
            s: params.size.toString(),
            r: params.reduceOnly || false,
            t: orderType,
          },
        ],
        grouping: "na",
      });

      const status = (result as any).response.data.statuses[0];
      if (status.error) {
        return { success: false, error: status.error };
      }
      const oid = status.filled?.oid ?? status.resting?.oid;
      return { success: true, orderId: oid?.toString() };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async cancelOrder(symbol: string, orderId: string): Promise<OrderResult> {
    if (!this.exchange)
      throw new Error("Exchange client not initialized — provide a private key");

    const assetIndex = await this.getAssetIndex(symbol);

    try {
      await this.exchange.cancel({
        cancels: [{ a: assetIndex, o: parseInt(orderId) }],
      });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async cancelAllOrders(): Promise<OrderResult> {
    if (!this.exchange || !this.walletAddress)
      throw new Error("Exchange client not initialized — provide a private key");

    try {
      const openOrders = await this.testnetInfo.openOrders({
        user: this.walletAddress as `0x${string}`,
      });

      if (openOrders.length === 0) {
        return { success: true };
      }

      const cancels = await Promise.all(
        openOrders.map(async (o: any) => ({
          a: await this.getAssetIndex(o.coin),
          o: o.oid,
        }))
      );

      await this.exchange.cancel({ cancels });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

let client: HyperliquidClient | null = null;

export function getHyperliquidClient(): HyperliquidClient {
  if (!client) {
    client = new HyperliquidClient(process.env.HYPERLIQUID_PRIVATE_KEY);
  }
  return client;
}
