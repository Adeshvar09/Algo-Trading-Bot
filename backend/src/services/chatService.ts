import { query } from '../db';
import { generateAlgorithmSignal } from './algorithmService';
import { config } from '../config/env.config';

export class ChatService {
  static async processMessage(message: string, userId: number = config.defaultUserId) {
    const queryText = message.trim();
    const lowerQuery = queryText.toLowerCase();

    let botResponse = '';
    const stocksRes = await query('SELECT * FROM stocks');
    const availableStocks = stocksRes.rows;

    const foundStock = availableStocks.find(s => 
      lowerQuery.includes(s.symbol.toLowerCase()) || lowerQuery.includes(s.name.toLowerCase())
    );

    if (foundStock) {
      const symbol = foundStock.symbol;
      const currentPrice = parseFloat(foundStock.current_price);
      
      const priceRes = await query(
        'SELECT * FROM stock_prices WHERE symbol = $1 ORDER BY price_date ASC',
        [symbol]
      );
      const signalData = generateAlgorithmSignal(symbol, priceRes.rows);

      if (lowerQuery.includes('price') || lowerQuery.includes('cost') || lowerQuery.includes('how much')) {
        botResponse = `The current synthetic market price for **${symbol}** (${foundStock.name}) is **₹${currentPrice.toFixed(2)}**.`;
      } else if (lowerQuery.includes('why') || lowerQuery.includes('reason')) {
        botResponse = `**${symbol}** has an Algorithmic Signal of **${signalData.signal}** (Score: ${signalData.score}/5, Confidence: ${Math.round(signalData.confidence * 100)}%).\n\nKey Reasons:\n` +
          signalData.reasons.map(r => `• ${r}`).join('\n');
      } else if (lowerQuery.includes('signal') || lowerQuery.includes('buy') || lowerQuery.includes('sell') || lowerQuery.includes('recommend')) {
        botResponse = `Algorithmic Signal for **${symbol}**: **${signalData.signal}**\n- Score: ${signalData.score}/5\n- Confidence: ${Math.round(signalData.confidence * 100)}%\n\nIndicators:\n• 20-Day SMA: ₹${signalData.indicators?.sma20}\n• 5-Day Momentum: ${signalData.indicators?.momentum_5d_percent}%\n• Volume Trend: ${signalData.indicators?.volume_trend_percent}%`;
      } else {
        botResponse = `Here is the current summary for **${symbol}**:\n• Price: ₹${currentPrice.toFixed(2)}\n• Signal: **${signalData.signal}** (${signalData.score}/5 score)\n• Sector: ${foundStock.sector}`;
      }
    } else if (lowerQuery.includes('portfolio') || lowerQuery.includes('balance') || lowerQuery.includes('my money') || lowerQuery.includes('pnl') || lowerQuery.includes('profit')) {
      const userRes = await query('SELECT * FROM users WHERE id = $1', [userId]);
      const user = userRes.rows[0] || { virtual_balance: 1000000.00 };
      const balance = parseFloat(user.virtual_balance);

      const holdingsRes = await query(
        `SELECT p.quantity, p.average_price, s.current_price 
         FROM portfolio p JOIN stocks s ON UPPER(p.symbol) = UPPER(s.symbol) 
         WHERE p.user_id = $1 AND p.quantity > 0`,
        [userId]
      );

      let invested = 0;
      let currVal = 0;
      holdingsRes.rows.forEach(item => {
        const q = parseInt(item.quantity, 10);
        invested += q * parseFloat(item.average_price);
        currVal += q * parseFloat(item.current_price);
      });

      const pnl = currVal - invested;

      botResponse = `**Your Portfolio Summary**:\n• Virtual Cash Balance: ₹${balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n• Total Investment: ₹${invested.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n• Current Market Value: ₹${currVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n• Total Account Value: ₹${(balance + currVal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n• Net Profit/Loss: ₹${pnl.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    } else if (lowerQuery.includes('list') || lowerQuery.includes('stocks') || lowerQuery.includes('available')) {
      botResponse = `Available Synthetic Stocks:\n` + availableStocks.map(s => `• **${s.symbol}**: ${s.name} (₹${parseFloat(s.current_price).toFixed(2)})`).join('\n');
    } else if (lowerQuery.includes('help') || lowerQuery.includes('hi') || lowerQuery.includes('hello')) {
      botResponse = `Hello! I am your Algo Trading Bot Assistant. You can ask me:\n• "What is TCS price?"\n• "What is INFY signal?"\n• "Why is RELIANCE BUY?"\n• "What is my portfolio value?"\n• "List available stocks"`;
    } else {
      botResponse = `I can help you analyze synthetic stocks and track your paper portfolio! Try asking:\n• "What is TCS price?"\n• "What is TCS signal?"\n• "Why is RELIANCE BUY?"\n• "What is my portfolio value?"`;
    }

    await query(
      'INSERT INTO chat_history (user_id, query, response) VALUES ($1, $2, $3)',
      [userId, queryText, botResponse]
    );

    return {
      query: queryText,
      response: botResponse,
      timestamp: new Date().toISOString()
    };
  }
}
