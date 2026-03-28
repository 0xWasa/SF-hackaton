export interface Market {
  symbol: string;
  price: number;
  volume24h: number;
  change24h?: number;      // percentage change from previous day close
  prevDayPx?: number;      // previous day close price
  funding?: number;        // current funding rate
  openInterest?: number;   // total open interest (USD)
}

export interface OrderbookLevel {
  price: number;
  size: number;
}

export interface Orderbook {
  coin: string;
  bids: OrderbookLevel[];
  asks: OrderbookLevel[];
}

export interface Position {
  symbol: string;
  side: "long" | "short";
  size: number;
  entryPrice: number;
  unrealizedPnl: number;
  leverage: number;
}

export interface Order {
  id: string;
  symbol: string;
  side: "buy" | "sell";
  size: number;
  price: number;
  type: "limit" | "market";
  status: string;
}

export interface AccountState {
  address: string;
  balance: number;
  totalMarginUsed: number;
  totalUnrealizedPnl: number;
  positions: Position[];
  openOrders: Order[];
}

export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface PlaceOrderParams {
  symbol: string;
  side: "buy" | "sell";
  size: number;
  price?: number;
  type: "limit" | "market";
  reduceOnly?: boolean;
}

export interface OrderResult {
  success: boolean;
  orderId?: string;
  error?: string;
}
