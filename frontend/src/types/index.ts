export interface Stock {
  id: number;
  symbol: string;
  name: string;
  sector: string;
  current_price: number;
  price_change: number;
  percentage_change: number;
  high: number;
  low: number;
  volume: number;
}

export interface WatchlistItem {
  id: number;
  symbol: string;
  name: string;
  sector: string;
  current_price: number;
  signal: 'BUY' | 'SELL' | 'HOLD';
  score: number;
}

export interface Portfolio {
  virtual_balance: number;
  total_investment: number;
  current_value: number;
  profit_loss: number;
  return_percentage: number;
  holdings: Array<{
    id: number;
    symbol: string;
    name: string;
    quantity: number;
    average_price: number;
    current_price: number;
    total_invested: number;
    current_value: number;
    pnl: number;
    pnl_percent: number;
  }>;
}

export interface Transaction {
  id: number;
  created_at: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  total_amount: number;
}
