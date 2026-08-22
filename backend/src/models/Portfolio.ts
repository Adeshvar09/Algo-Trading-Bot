export interface PortfolioItem {
  id: number;
  user_id: number;
  stock_id: number;
  symbol: string;
  quantity: number;
  average_price: number;
}

export interface WatchlistItem {
  id: number;
  user_id: number;
  stock_id: number;
  symbol: string;
}
