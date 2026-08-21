import { Pool, PoolClient, QueryResult as PgQueryResult } from 'pg';
import fs from 'fs';
import path from 'path';
import { poolConfig } from '../config/db.config';
import { User } from '../models/User';
import { Stock, StockPrice } from '../models/Stock';
import { PortfolioItem, WatchlistItem } from '../models/Portfolio';
import { TransactionItem } from '../models/Transaction';

export interface MemoryStore {
  users: User[];
  stocks: Stock[];
  stock_prices: StockPrice[];
  watchlist: WatchlistItem[];
  portfolio: PortfolioItem[];
  orders: any[];
  transactions: TransactionItem[];
  algorithm_signals: any[];
  chat_history: any[];
}

export interface QueryResultWrapper {
  rows: any[];
  rowCount?: number;
}

export const pool = new Pool(poolConfig);

let useFallbackMemoryDB = false;

export const memoryStore: MemoryStore = {
  users: [
    { id: 1, name: 'Demo Trader', email: 'trader@algotrading.com', virtual_balance: 1000000.00 }
  ],
  stocks: [
    { id: 1, symbol: 'TCS', name: 'Tata Consultancy Services', sector: 'Information Technology', current_price: 3850.50 },
    { id: 2, symbol: 'INFY', name: 'Infosys Limited', sector: 'Information Technology', current_price: 1540.25 },
    { id: 3, symbol: 'RELIANCE', name: 'Reliance Industries Ltd', sector: 'Energy & Conglomerate', current_price: 2920.00 },
    { id: 4, symbol: 'HDFCBANK', name: 'HDFC Bank Limited', sector: 'Banking & Finance', current_price: 1680.75 },
    { id: 5, symbol: 'WIPRO', name: 'Wipro Limited', sector: 'Information Technology', current_price: 495.10 }
  ],
  stock_prices: [],
  watchlist: [],
  portfolio: [],
  orders: [],
  transactions: [],
  algorithm_signals: [],
  chat_history: []
};

export function seedMemoryPrices(): void {
  if (memoryStore.stock_prices.length > 0) return;
  
  const today = new Date();
  memoryStore.stocks.forEach(stock => {
    let currPrice = stock.current_price * 0.85;
    for (let offset = 60; offset >= 0; offset--) {
      const pDate = new Date(today);
      pDate.setDate(pDate.getDate() - offset);
      const dateStr = pDate.toISOString().split('T')[0];

      const change = (Math.sin(offset * 0.4 + stock.id * 1.5) * 1.8 + Math.cos(offset * 0.2) * 1.2 + 0.3);
      const openPrice = parseFloat(currPrice.toFixed(2));
      const closePrice = parseFloat((currPrice * (1 + change / 100.0)).toFixed(2));
      const lowPrice = parseFloat((Math.min(openPrice, closePrice) * (1 - Math.abs(Math.sin(offset)) * 0.008)).toFixed(2));
      const highPrice = parseFloat((Math.max(openPrice, closePrice) * (1 + Math.abs(Math.cos(offset)) * 0.012)).toFixed(2));
      const volume = Math.floor(1000000 + Math.abs(Math.sin(offset + stock.id)) * 2500000);

      memoryStore.stock_prices.push({
        id: memoryStore.stock_prices.length + 1,
        stock_id: stock.id,
        symbol: stock.symbol,
        open_price: openPrice,
        high_price: highPrice,
        low_price: lowPrice,
        close_price: closePrice,
        volume: volume,
        price_date: dateStr
      });
      currPrice = closePrice;
    }
    stock.current_price = currPrice;
  });
}

export async function initDatabase(): Promise<void> {
  try {
    const client = await pool.connect();
    console.log('Successfully connected to PostgreSQL database.');
    
    const res = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'stocks'
      );
    `);

    if (!res.rows[0].exists) {
      console.log('Tables not found. Initializing PostgreSQL schema...');
      const schemaPath = path.join(__dirname, '..', '..', '..', 'database', 'schema.sql');
      if (fs.existsSync(schemaPath)) {
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        await client.query(schemaSql);
        console.log('PostgreSQL database initialized successfully from schema.sql.');
      }
    }
    client.release();
  } catch (err: any) {
    console.warn('PostgreSQL connection failed/unavailable:', err.message);
    console.log('Switching to high-performance in-memory dataset fallback for zero-downtime execution.');
    useFallbackMemoryDB = true;
    seedMemoryPrices();
  }
}

export async function query(text: string, params?: any[]): Promise<QueryResultWrapper | PgQueryResult<any>> {
  if (useFallbackMemoryDB) {
    const normalizedText = text.trim().toLowerCase();
    const safeParams = params || [];
    
    if (normalizedText.includes('select * from stocks where symbol =') || normalizedText.includes('where upper(symbol) =')) {
      const sym = (safeParams[0] || '').toUpperCase();
      const stock = memoryStore.stocks.find(s => s.symbol === sym);
      return { rows: stock ? [stock] : [] };
    }

    if (normalizedText.includes('from stocks')) {
      return { rows: [...memoryStore.stocks] };
    }

    if (normalizedText.includes('from stock_prices') && (normalizedText.includes('order by price_date desc') || normalizedText.includes('order by price_date asc'))) {
      const sym = (safeParams[0] || '').toUpperCase();
      const limit = safeParams[1] || 1000;
      const isAsc = normalizedText.includes('order by price_date asc');
      const prices = memoryStore.stock_prices
        .filter(p => p.symbol.toUpperCase() === sym)
        .sort((a, b) => isAsc ? new Date(a.price_date).getTime() - new Date(b.price_date).getTime() : new Date(b.price_date).getTime() - new Date(a.price_date).getTime())
        .slice(0, limit);
      return { rows: prices };
    }

    if (normalizedText.includes('select * from users where id =')) {
      const uid = safeParams[0] || 1;
      const user = memoryStore.users.find(u => u.id === uid) || memoryStore.users[0];
      return { rows: [user] };
    }

    if (normalizedText.includes('from watchlist')) {
      const userWatchlist = memoryStore.watchlist.map(item => {
        const stock = memoryStore.stocks.find(s => s.symbol === item.symbol);
        return { ...item, ...stock };
      });
      return { rows: userWatchlist };
    }

    if (normalizedText.includes('insert into watchlist')) {
      const [userId, stockId, symbol] = safeParams;
      const exists = memoryStore.watchlist.some(w => w.user_id === userId && w.symbol === symbol);
      if (!exists) {
        const newWatch: WatchlistItem = { id: memoryStore.watchlist.length + 1, user_id: userId, stock_id: stockId, symbol: symbol };
        memoryStore.watchlist.push(newWatch);
        return { rows: [newWatch] };
      }
      return { rows: [] };
    }

    if (normalizedText.includes('delete from watchlist')) {
      const [userId, symbol] = safeParams;
      memoryStore.watchlist = memoryStore.watchlist.filter(w => !(w.user_id === userId && w.symbol === (symbol || '').toUpperCase()));
      return { rowCount: 1, rows: [] };
    }

    if (normalizedText.includes('select * from portfolio where user_id =')) {
      const [userId, symbol] = safeParams;
      const holding = memoryStore.portfolio.find(p => p.user_id === userId && p.symbol.toUpperCase() === (symbol || '').toUpperCase());
      return { rows: holding ? [holding] : [] };
    }

    if (normalizedText.includes('insert into portfolio')) {
      const [userId, stockId, symbol, quantity, averagePrice] = safeParams;
      const newHolding: PortfolioItem = {
        id: memoryStore.portfolio.length + 1,
        user_id: userId,
        stock_id: stockId,
        symbol: (symbol || '').toUpperCase(),
        quantity: parseInt(quantity, 10),
        average_price: parseFloat(averagePrice)
      };
      memoryStore.portfolio.push(newHolding);
      return { rows: [newHolding] };
    }

    if (normalizedText.includes('update portfolio set quantity =')) {
      const [quantity, averagePrice, holdingId] = safeParams.length === 3 ? safeParams : [safeParams[0], null, safeParams[1]];
      const holding = memoryStore.portfolio.find(p => p.id === (holdingId || safeParams[safeParams.length - 1]));
      if (holding) {
        holding.quantity = parseInt(quantity, 10);
        if (averagePrice !== null) holding.average_price = parseFloat(averagePrice);
      }
      return { rows: holding ? [holding] : [] };
    }

    if (normalizedText.includes('delete from portfolio')) {
      const holdingId = safeParams[0];
      memoryStore.portfolio = memoryStore.portfolio.filter(p => p.id !== holdingId);
      return { rowCount: 1, rows: [] };
    }

    if (normalizedText.includes('from portfolio')) {
      const userPortfolio = memoryStore.portfolio
        .filter(p => p.quantity > 0)
        .map(p => {
          const stock = memoryStore.stocks.find(s => s.symbol === p.symbol);
          return { ...p, current_price: stock ? stock.current_price : p.average_price, name: stock ? stock.name : p.symbol };
        });
      return { rows: userPortfolio };
    }

    if (normalizedText.includes('from transactions')) {
      const txs = [...memoryStore.transactions].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      return { rows: txs };
    }

    if (normalizedText.includes('update users set virtual_balance =')) {
      const newBal = safeParams[0];
      const uid = safeParams[1] || 1;
      const user = memoryStore.users.find(u => u.id === uid);
      if (user) user.virtual_balance = parseFloat(newBal);
      return { rows: user ? [user] : [] };
    }

    return { rows: [] };
  }

  return pool.query(text, params);
}

export function getMemoryStore(): MemoryStore {
  return memoryStore;
}

export function isMemoryDB(): boolean {
  return useFallbackMemoryDB;
}
