import { query, isMemoryDB, getMemoryStore } from '../db';
import { config } from '../config/env.config';

export class PortfolioService {
  static async getPortfolio(userId: number = config.defaultUserId) {
    const userRes = await query('SELECT * FROM users WHERE id = $1', [userId]);
    const user = userRes.rows[0] || { virtual_balance: 1000000.00 };
    const virtualBalance = parseFloat(user.virtual_balance);

    const holdingsRes = await query(
      `SELECT p.id, p.stock_id, p.symbol, p.quantity, p.average_price, s.name, s.current_price 
       FROM portfolio p 
       JOIN stocks s ON UPPER(p.symbol) = UPPER(s.symbol) 
       WHERE p.user_id = $1 AND p.quantity > 0`,
      [userId]
    );

    let totalInvestment = 0;
    let currentPortfolioValue = 0;

    const holdings = holdingsRes.rows.map(item => {
      const qty = parseInt(item.quantity, 10);
      const avgPrice = parseFloat(item.average_price);
      const currentPrice = parseFloat(item.current_price);
      const invested = qty * avgPrice;
      const currentValue = qty * currentPrice;
      const pnl = currentValue - invested;
      const pnlPercent = invested > 0 ? (pnl / invested) * 100 : 0;

      totalInvestment += invested;
      currentPortfolioValue += currentValue;

      return {
        id: item.id,
        stock_id: item.stock_id,
        symbol: item.symbol,
        name: item.name,
        quantity: qty,
        average_price: parseFloat(avgPrice.toFixed(2)),
        current_price: parseFloat(currentPrice.toFixed(2)),
        total_invested: parseFloat(invested.toFixed(2)),
        current_value: parseFloat(currentValue.toFixed(2)),
        pnl: parseFloat(pnl.toFixed(2)),
        pnl_percent: parseFloat(pnlPercent.toFixed(2))
      };
    });

    const totalProfitLoss = currentPortfolioValue - totalInvestment;
    const returnPercentage = totalInvestment > 0 ? (totalProfitLoss / totalInvestment) * 100 : 0;

    return {
      virtual_balance: parseFloat(virtualBalance.toFixed(2)),
      total_investment: parseFloat(totalInvestment.toFixed(2)),
      current_value: parseFloat(currentPortfolioValue.toFixed(2)),
      total_account_value: parseFloat((virtualBalance + currentPortfolioValue).toFixed(2)),
      profit_loss: parseFloat(totalProfitLoss.toFixed(2)),
      return_percentage: parseFloat(returnPercentage.toFixed(2)),
      holdings
    };
  }

  static async getTransactions(userId: number = config.defaultUserId) {
    const result = await query(
      'SELECT * FROM transactions WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    return result.rows.map(t => ({
      id: t.id,
      symbol: t.symbol,
      type: t.type,
      quantity: parseInt(t.quantity, 10),
      price: parseFloat(t.price),
      total_amount: parseFloat(t.total_amount),
      created_at: t.created_at
    }));
  }

  static async executeOrder(symbol: string, orderType: string, quantity: number, userId: number = config.defaultUserId) {
    const cleanSymbol = symbol.toUpperCase().trim();
    const cleanType = orderType.toUpperCase().trim();
    const qty = parseInt(quantity.toString(), 10);

    const stockRes = await query('SELECT * FROM stocks WHERE symbol = $1', [cleanSymbol]);
    if (stockRes.rows.length === 0) {
      throw new Error(`Stock symbol '${cleanSymbol}' not found`);
    }

    const stock = stockRes.rows[0];
    const currentPrice = parseFloat(stock.current_price);
    const totalAmount = qty * currentPrice;

    const userRes = await query('SELECT * FROM users WHERE id = $1', [userId]);
    const user = userRes.rows[0];
    let currentBalance = parseFloat(user.virtual_balance);

    if (cleanType === 'BUY') {
      if (currentBalance < totalAmount) {
        throw new Error(`Insufficient virtual balance. Required: ₹${totalAmount.toFixed(2)}, Available: ₹${currentBalance.toFixed(2)}`);
      }

      const newBalance = currentBalance - totalAmount;
      await query('UPDATE users SET virtual_balance = $1 WHERE id = $2', [newBalance, userId]);

      const portfolioRes = await query(
        'SELECT * FROM portfolio WHERE user_id = $1 AND symbol = $2',
        [userId, cleanSymbol]
      );

      if (portfolioRes.rows.length > 0) {
        const holding = portfolioRes.rows[0];
        const existingQty = parseInt(holding.quantity, 10);
        const existingAvgPrice = parseFloat(holding.average_price);
        const newQty = existingQty + qty;
        const newAvgPrice = ((existingQty * existingAvgPrice) + totalAmount) / newQty;

        await query(
          'UPDATE portfolio SET quantity = $1, average_price = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
          [newQty, newAvgPrice, holding.id]
        );
      } else {
        await query(
          'INSERT INTO portfolio (user_id, stock_id, symbol, quantity, average_price) VALUES ($1, $2, $3, $4, $5)',
          [userId, stock.id, cleanSymbol, qty, currentPrice]
        );
      }

      await query(
        'INSERT INTO orders (user_id, stock_id, symbol, order_type, quantity, price, total_amount, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [userId, stock.id, cleanSymbol, 'BUY', qty, currentPrice, totalAmount, 'COMPLETED']
      );

      await query(
        'INSERT INTO transactions (user_id, stock_id, symbol, type, quantity, price, total_amount) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [userId, stock.id, cleanSymbol, 'BUY', qty, currentPrice, totalAmount]
      );

      if (isMemoryDB()) {
        const memStore = getMemoryStore();
        memStore.transactions.push({
          id: memStore.transactions.length + 1,
          symbol: cleanSymbol,
          type: 'BUY',
          quantity: qty,
          price: currentPrice,
          total_amount: totalAmount,
          created_at: new Date().toISOString()
        });
      }

      return {
        message: `Successfully bought ${qty} shares of ${cleanSymbol} at ₹${currentPrice.toFixed(2)}`,
        transaction: {
          symbol: cleanSymbol,
          type: 'BUY',
          quantity: qty,
          price: currentPrice,
          total_amount: totalAmount,
          remaining_balance: newBalance
        }
      };
    } else {
      const portfolioRes = await query(
        'SELECT * FROM portfolio WHERE user_id = $1 AND symbol = $2',
        [userId, cleanSymbol]
      );

      if (portfolioRes.rows.length === 0 || parseInt(portfolioRes.rows[0].quantity, 10) < qty) {
        const ownedQty = portfolioRes.rows.length > 0 ? parseInt(portfolioRes.rows[0].quantity, 10) : 0;
        throw new Error(`Insufficient holdings. You own ${ownedQty} shares of ${cleanSymbol}, cannot sell ${qty}`);
      }

      const holding = portfolioRes.rows[0];
      const existingQty = parseInt(holding.quantity, 10);
      const newQty = existingQty - qty;
      const newBalance = currentBalance + totalAmount;

      await query('UPDATE users SET virtual_balance = $1 WHERE id = $2', [newBalance, userId]);

      if (newQty === 0) {
        await query('DELETE FROM portfolio WHERE id = $1', [holding.id]);
        if (isMemoryDB()) {
          const memStore = getMemoryStore();
          memStore.portfolio = memStore.portfolio.filter(p => p.symbol !== cleanSymbol);
        }
      } else {
        await query(
          'UPDATE portfolio SET quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [newQty, holding.id]
        );
      }

      await query(
        'INSERT INTO orders (user_id, stock_id, symbol, order_type, quantity, price, total_amount, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [userId, stock.id, cleanSymbol, 'SELL', qty, currentPrice, totalAmount, 'COMPLETED']
      );

      await query(
        'INSERT INTO transactions (user_id, stock_id, symbol, type, quantity, price, total_amount) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [userId, stock.id, cleanSymbol, 'SELL', qty, currentPrice, totalAmount]
      );

      if (isMemoryDB()) {
        const memStore = getMemoryStore();
        memStore.transactions.push({
          id: memStore.transactions.length + 1,
          symbol: cleanSymbol,
          type: 'SELL',
          quantity: qty,
          price: currentPrice,
          total_amount: totalAmount,
          created_at: new Date().toISOString()
        });
      }

      return {
        message: `Successfully sold ${qty} shares of ${cleanSymbol} at ₹${currentPrice.toFixed(2)}`,
        transaction: {
          symbol: cleanSymbol,
          type: 'SELL',
          quantity: qty,
          price: currentPrice,
          total_amount: totalAmount,
          new_balance: newBalance
        }
      };
    }
  }
}
