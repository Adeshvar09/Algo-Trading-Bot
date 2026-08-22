import { query } from '../db';

export class StockService {
  static async getAllStocks() {
    const result = await query('SELECT * FROM stocks ORDER BY symbol ASC');
    const stocks = result.rows;

    return Promise.all(stocks.map(async (stock) => {
      const priceRes = await query(
        'SELECT * FROM stock_prices WHERE symbol = $1 ORDER BY price_date DESC LIMIT 2',
        [stock.symbol]
      );
      
      const prices = priceRes.rows;
      const latest = prices[0] || {};
      const previous = prices[1] || latest;
      
      const currentPrice = parseFloat(stock.current_price);
      const prevPrice = parseFloat(previous.close_price || currentPrice);
      const priceChange = currentPrice - prevPrice;
      const percentageChange = prevPrice > 0 ? (priceChange / prevPrice) * 100 : 0;

      return {
        id: stock.id,
        symbol: stock.symbol,
        name: stock.name,
        sector: stock.sector,
        current_price: currentPrice,
        price_change: parseFloat(priceChange.toFixed(2)),
        percentage_change: parseFloat(percentageChange.toFixed(2)),
        high: parseFloat((latest.high_price || currentPrice * 1.02).toString()),
        low: parseFloat((latest.low_price || currentPrice * 0.98).toString()),
        volume: parseInt(latest.volume || 1500000, 10)
      };
    }));
  }

  static async getStockBySymbol(symbol: string) {
    const cleanSymbol = symbol.toUpperCase();
    const result = await query('SELECT * FROM stocks WHERE symbol = $1', [cleanSymbol]);
    if (result.rows.length === 0) return null;

    const stock = result.rows[0];
    const priceRes = await query(
      'SELECT * FROM stock_prices WHERE symbol = $1 ORDER BY price_date DESC LIMIT 2',
      [cleanSymbol]
    );

    const prices = priceRes.rows;
    const latest = prices[0] || {};
    const previous = prices[1] || latest;
    const currentPrice = parseFloat(stock.current_price);
    const prevPrice = parseFloat(previous.close_price || currentPrice);
    const priceChange = currentPrice - prevPrice;
    const percentageChange = prevPrice > 0 ? (priceChange / prevPrice) * 100 : 0;

    return {
      ...stock,
      current_price: currentPrice,
      price_change: parseFloat(priceChange.toFixed(2)),
      percentage_change: parseFloat(percentageChange.toFixed(2)),
      high: parseFloat((latest.high_price || currentPrice * 1.02).toString()),
      low: parseFloat((latest.low_price || currentPrice * 0.98).toString()),
      volume: parseInt(latest.volume || 1500000, 10)
    };
  }

  static async getStockHistory(symbol: string) {
    const cleanSymbol = symbol.toUpperCase();
    const result = await query(
      'SELECT * FROM stock_prices WHERE symbol = $1 ORDER BY price_date ASC',
      [cleanSymbol]
    );
    return result.rows;
  }
}
