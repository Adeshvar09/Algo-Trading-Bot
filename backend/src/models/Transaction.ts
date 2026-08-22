export interface TransactionItem {
  id: number;
  user_id?: number;
  stock_id?: number;
  symbol: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  total_amount: number;
  created_at: string;
}
