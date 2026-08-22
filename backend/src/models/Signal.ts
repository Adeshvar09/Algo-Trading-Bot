export interface PriceHistoryItem {
  id?: number;
  stock_id?: number;
  symbol?: string;
  open_price?: number | string;
  high_price?: number | string;
  low_price?: number | string;
  close_price: number | string;
  volume: number | string;
  price_date: string;
}

export interface AlgorithmIndicators {
  latest_price: number;
  sma20: number;
  momentum_5d_percent: number;
  volume_trend_percent: number;
}

export interface AlgorithmSignalResult {
  symbol: string;
  signal: 'BUY' | 'HOLD' | 'SELL';
  score: number;
  confidence: number;
  reasons: string[];
  indicators?: AlgorithmIndicators;
}
