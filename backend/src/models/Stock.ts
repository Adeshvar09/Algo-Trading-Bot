export interface Stock {
  id: number;
  symbol: string;
  name: string;
  sector: string;
  current_price: number;
}

export interface StockPrice {
  id: number;
  stock_id: number;
  symbol: string;
  open_price: number;
  high_price: number;
  low_price: number;
  close_price: number;
  volume: number;
  price_date: string;
}
