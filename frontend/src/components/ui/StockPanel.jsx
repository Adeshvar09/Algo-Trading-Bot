import React, { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Star, 
  Activity, 
  ShoppingCart, 
  Info, 
  X
} from 'lucide-react';
import { 
  getStockDetails, 
  getStockHistory, 
  getStockSignal, 
  addToWatchlist, 
  removeFromWatchlist, 
  placeOrder 
} from '../../services/api';
import ErrorState from '../feedback/ErrorState';
import { SkeletonPanel } from '../feedback/Skeleton';

export default function StockPanel({ symbol, watchlist = [], onWatchlistUpdate, onOrderSuccess }) {
  const [stock, setStock] = useState(null);
  const [history, setHistory] = useState([]);
  const [signal, setSignal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Paper Trade Modal State
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [tradeType, setTradeType] = useState('BUY');
  const [quantity, setQuantity] = useState(1);
  const [tradeMessage, setTradeMessage] = useState(null);
  const [tradeError, setTradeError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isInWatchlist = watchlist.some(w => w.symbol.toUpperCase() === symbol.toUpperCase());

  useEffect(() => {
    if (!symbol) return;
    fetchStockData();
  }, [symbol]);

  const fetchStockData = async () => {
    setLoading(true);
    setError('');
    try {
      const [detailsData, historyData, signalData] = await Promise.all([
        getStockDetails(symbol),
        getStockHistory(symbol),
        getStockSignal(symbol)
      ]);

      setStock(detailsData);
      setHistory(historyData || []);
      setSignal(signalData);
    } catch (err) {
      console.error('Error loading stock panel:', err);
      setError('Failed to load stock data from backend');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleWatchlist = async () => {
    try {
      if (isInWatchlist) {
        await removeFromWatchlist(symbol);
      } else {
        await addToWatchlist(symbol);
      }
      if (onWatchlistUpdate) onWatchlistUpdate();
    } catch (err) {
      console.error('Watchlist toggle error:', err);
    }
  };

  const handleOpenTrade = (type) => {
    setTradeType(type);
    setQuantity(1);
    setTradeError('');
    setTradeMessage(null);
    setShowTradeModal(true);
  };

  const handleExecuteTrade = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setTradeError('');
    setTradeMessage(null);

    try {
      const res = await placeOrder({
        symbol,
        order_type: tradeType,
        quantity: parseInt(quantity, 10)
      });
      setTradeMessage(res.message);
      if (onOrderSuccess) onOrderSuccess();
      setTimeout(() => {
        setShowTradeModal(false);
      }, 1500);
    } catch (err) {
      setTradeError(err.response?.data?.error || 'Trade execution failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <SkeletonPanel />;
  }

  if (error || !stock) {
    return (
      <ErrorState 
        title={error || 'Failed to load stock data from backend'} 
        onRetry={fetchStockData} 
      />
    );
  }

  const isPositive = stock.price_change >= 0;
  const totalCost = (quantity * stock.current_price).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  const chartData = history.map(item => ({
    date: new Date(item.price_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    price: parseFloat(item.close_price)
  }));

  const getSignalBadgeClass = (sig) => {
    if (sig === 'BUY') return 'badge-buy';
    if (sig === 'SELL') return 'badge-sell';
    return 'badge-hold';
  };

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '24px' }}>
      
      {/* Stock Detail Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>{stock.symbol}</h1>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', padding: '3px 10px', borderRadius: '6px', fontWeight: 600 }}>
              {stock.sector}
            </span>
            <button 
              onClick={handleToggleWatchlist} 
              style={{ background: 'transparent', color: isInWatchlist ? '#F59E0B' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', padding: '4px', borderRadius: '6px' }}
              title={isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
              aria-label={isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
            >
              <Star size={20} fill={isInWatchlist ? '#F59E0B' : 'none'} color={isInWatchlist ? '#F59E0B' : 'currentColor'} />
            </button>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>{stock.name}</p>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
            ₹{Number(stock.current_price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', fontSize: '0.92rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }} className={isPositive ? 'text-positive' : 'text-negative'}>
            {isPositive ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
            {isPositive ? '+' : ''}{stock.price_change.toFixed(2)} ({stock.percentage_change.toFixed(2)}%)
          </div>
        </div>
      </div>

      {/* Buy / Sell Trading Action Buttons */}
      <div style={{ display: 'flex', gap: '14px', marginBottom: '24px' }}>
        <button 
          onClick={() => handleOpenTrade('BUY')}
          style={{ flex: 1, background: 'var(--color-positive)', color: '#fff', padding: '12px 16px', borderRadius: '10px', fontWeight: 800, fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(34, 197, 94, 0.25)' }}
        >
          <ShoppingCart size={18} /> Buy {stock.symbol}
        </button>
        <button 
          onClick={() => handleOpenTrade('SELL')}
          style={{ flex: 1, background: 'var(--color-negative)', color: '#fff', padding: '12px 16px', borderRadius: '10px', fontWeight: 800, fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(239, 68, 68, 0.25)' }}
        >
          <ShoppingCart size={18} /> Sell {stock.symbol}
        </button>
      </div>

      {/* Market Statistics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '24px', background: 'var(--bg-surface)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
        <div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>Day High</div>
          <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '0.95rem', marginTop: '3px' }}>₹{stock.high.toFixed(2)}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>Day Low</div>
          <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '0.95rem', marginTop: '3px' }}>₹{stock.low.toFixed(2)}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>Volume</div>
          <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '0.95rem', marginTop: '3px' }}>{stock.volume.toLocaleString('en-IN')}</div>
        </div>
        {signal && signal.indicators && (
          <>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>20D SMA</div>
              <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '0.95rem', marginTop: '3px' }}>₹{signal.indicators.sma20.toFixed(2)}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>5D Momentum</div>
              <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '0.95rem', marginTop: '3px' }} className={signal.indicators.momentum_5d_percent >= 0 ? 'text-positive' : 'text-negative'}>
                {signal.indicators.momentum_5d_percent >= 0 ? '+' : ''}{signal.indicators.momentum_5d_percent}%
              </div>
            </div>
          </>
        )}
      </div>

      {/* Algorithmic Signal Card */}
      {signal && (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '18px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity style={{ color: 'var(--accent-blue)' }} size={20} />
              <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>Algorithmic Signal</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className={getSignalBadgeClass(signal.signal)}>{signal.signal}</span>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                Score: <strong style={{ color: 'var(--text-primary)' }}>{signal.score}/5</strong> | Confidence: <strong style={{ color: 'var(--text-primary)' }}>{Math.round(signal.confidence * 100)}%</strong>
              </span>
            </div>
          </div>

          <div style={{ background: 'var(--bg-card)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', letterSpacing: '0.5px' }}>
              <Info size={14} /> Analysis Rationale
            </div>
            <ul style={{ listStyle: 'none', paddingLeft: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {signal.reasons.map((reason, idx) => (
                <li key={idx} style={{ fontSize: '0.86rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ color: 'var(--accent-blue)', fontWeight: 'bold' }}>•</span> {reason}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Historical Price Trend Chart */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Historical Price Trend (60 Days)</h3>
        </div>
        <div style={{ height: '300px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="date" stroke="#64748B" tick={{ fontSize: 11 }} tickLine={false} />
              <YAxis domain={['auto', 'auto']} stroke="#64748B" tick={{ fontSize: 11 }} tickFormatter={val => `₹${val}`} tickLine={false} />
              <Tooltip 
                contentStyle={{ background: '#0B1426', borderColor: 'rgba(255,255,255,0.12)', borderRadius: '10px', color: '#FFFFFF', boxShadow: '0 8px 20px rgba(0,0,0,0.5)' }}
                formatter={(val) => [`₹${val.toFixed(2)}`, 'Close Price']}
              />
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke={isPositive ? '#22C55E' : '#EF4444'} 
                strokeWidth={2.5} 
                dot={false}
                activeDot={{ r: 6, fill: isPositive ? '#22C55E' : '#EF4444', stroke: '#FFFFFF', strokeWidth: 2 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Paper Trade Modal */}
      {showTradeModal && (
        <div className="modal-backdrop-overlay">
          <div className="modal-dialog-card">
            <div className="modal-card-header">
              <h3 className="modal-card-title">Paper Trade - {tradeType} {stock.symbol}</h3>
              <button className="modal-close-btn" onClick={() => setShowTradeModal(false)} aria-label="Close modal">
                <X size={20} />
              </button>
            </div>

            {tradeMessage && (
              <div style={{ background: 'var(--color-positive-bg)', color: 'var(--color-positive)', padding: '10px', borderRadius: '8px', marginBottom: '14px', fontSize: '0.88rem', textAlign: 'center', border: '1px solid rgba(34,197,94,0.3)' }}>
                {tradeMessage}
              </div>
            )}

            {tradeError && (
              <div style={{ background: 'var(--color-negative-bg)', color: 'var(--color-negative)', padding: '10px', borderRadius: '8px', marginBottom: '14px', fontSize: '0.88rem', textAlign: 'center', border: '1px solid rgba(239,68,68,0.3)' }}>
                {tradeError}
              </div>
            )}

            <form onSubmit={handleExecuteTrade}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 700 }}>Execution Price</label>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>₹{stock.current_price.toFixed(2)}</div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 700 }}>Quantity (Shares)</label>
                <input 
                  type="number" 
                  min="1"
                  max="10000"
                  value={quantity} 
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: '#fff', padding: '10px 14px', borderRadius: '10px', fontSize: '1rem', fontFamily: 'var(--font-mono)' }}
                  required
                />
              </div>

              <div style={{ background: 'var(--bg-surface)', padding: '14px', borderRadius: '10px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Order Cost</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-positive)', fontFamily: 'var(--font-mono)' }}>₹{totalCost}</span>
              </div>

              <button 
                type="submit" 
                disabled={submitting}
                className={tradeType === 'BUY' ? 'trade-submit-buy' : 'trade-submit-sell'}
              >
                {submitting ? 'Executing Order...' : `Confirm ${tradeType} Order`}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
