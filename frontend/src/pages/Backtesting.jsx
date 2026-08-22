import React, { useState, useEffect } from 'react';
import { 
  FlaskConical, 
  Play, 
  TrendingUp, 
  TrendingDown, 
  Award, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle,
  Clock,
  DollarSign
} from 'lucide-react';
import { getStocks, runBacktest } from '../services/api';
import ErrorState from '../components/feedback/ErrorState';
import Skeleton from '../components/feedback/Skeleton';

export default function Backtesting() {
  const [stocks, setStocks] = useState([]);
  const [selectedStock, setSelectedStock] = useState('TCS');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [initialCapital, setInitialCapital] = useState(100000);
  const [strategy, setStrategy] = useState('MA_CROSSOVER');

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setPageLoading(true);
    try {
      const stockList = await getStocks();
      setStocks(stockList || []);
      if (stockList && stockList.length > 0) {
        setSelectedStock(stockList[0].symbol);
      }
      
      // Default to backtest on launch
      await handleRunBacktest('TCS', 'MA_CROSSOVER', 100000, '', '');
    } catch (err) {
      console.error('Backtesting init error:', err);
    } finally {
      setPageLoading(false);
    }
  };

  const handleRunBacktest = async (sym = selectedStock, strat = strategy, cap = initialCapital, start = startDate, end = endDate) => {
    setLoading(true);
    setError(null);
    try {
      const data = await runBacktest({
        symbol: sym,
        strategy: strat,
        initialCapital: Number(cap),
        startDate: start || undefined,
        endDate: end || undefined
      });
      setResults(data);
    } catch (err) {
      console.error('Run backtest error:', err);
      setError(err.response?.data?.message || 'Failed to execute backtest simulation');
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <Skeleton height="120px" />
        <Skeleton height="350px" />
      </div>
    );
  }

  const renderEquityCurveChart = () => {
    if (!results || !results.equity_curve || results.equity_curve.length === 0) return null;

    const curve = results.equity_curve;
    const width = 800;
    const height = 240;
    const padding = 35;

    const stratVals = curve.map(c => c.strategy_capital);
    const bhVals = curve.map(c => c.buy_and_hold_capital);
    const allVals = [...stratVals, ...bhVals];

    const minVal = Math.min(...allVals) * 0.98;
    const maxVal = Math.max(...allVals) * 1.02;
    const range = maxVal - minVal || 1;

    const stratPoints = curve.map((c, idx) => {
      const x = padding + (idx / Math.max(curve.length - 1, 1)) * (width - 2 * padding);
      const y = height - padding - ((c.strategy_capital - minVal) / range) * (height - 2 * padding);
      return `${x},${y}`;
    }).join(' ');

    const bhPoints = curve.map((c, idx) => {
      const x = padding + (idx / Math.max(curve.length - 1, 1)) * (width - 2 * padding);
      const y = height - padding - ((c.buy_and_hold_capital - minVal) / range) * (height - 2 * padding);
      return `${x},${y}`;
    }).join(' ');

    const isPositive = results.metrics.total_return_percent >= 0;

    return (
      <div style={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '260px' }}>
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="var(--border-color)" />

          {/* Strategy Curve */}
          <polyline points={stratPoints} fill="none" stroke={isPositive ? '#198754' : '#DC3545'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          
          {/* Buy & Hold Benchmark Curve */}
          <polyline points={bhPoints} fill="none" stroke="#0EA5E9" strokeWidth="2" strokeDasharray="4,4" opacity="0.8" />

          {curve.map((c, idx) => {
            const x = padding + (idx / Math.max(curve.length - 1, 1)) * (width - 2 * padding);
            if (idx === 0 || idx === curve.length - 1 || idx % Math.ceil(curve.length / 5) === 0) {
              return (
                <text key={idx} x={x} y={height - 10} fill="var(--text-secondary)" fontSize="10" textAnchor="middle">
                  {c.date.slice(5)}
                </text>
              );
            }
            return null;
          })}
        </svg>

        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem' }}>
            <span style={{ width: '14px', height: '3px', background: isPositive ? '#198754' : '#DC3545', display: 'inline-block' }}></span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>Strategy Performance</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem' }}>
            <span style={{ width: '14px', height: '2px', background: '#0EA5E9', borderStyle: 'dashed', display: 'inline-block' }}></span>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Buy & Hold Benchmark</span>
          </div>
        </div>
      </div>
    );
  };

  const getStrategyDescription = () => {
    switch (strategy) {
      case 'MA_CROSSOVER':
        return {
          buy: 'Price 5-day SMA crosses above 20-day SMA',
          sell: 'Price 5-day SMA crosses below 20-day SMA'
        };
      case 'MOMENTUM':
        return {
          buy: '5-day price momentum exceeds +1.5%',
          sell: '5-day price momentum drops below -1.5%'
        };
      case 'RSI':
        return {
          buy: '14-day RSI drops below 35 (Oversold condition)',
          sell: '14-day RSI rises above 65 (Overbought condition)'
        };
      case 'BUY_AND_HOLD':
      default:
        return {
          buy: 'Purchase all available shares on start date',
          sell: 'Hold position throughout historical period'
        };
    }
  };

  const stratDesc = getStrategyDescription();
  const m = results?.metrics;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Simulation Configuration Control Panel */}
      <div style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
          <div style={{ background: 'var(--accent-blue-bg)', padding: '8px', borderRadius: '6px', color: 'var(--accent-blue)' }}>
            <FlaskConical size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Algorithmic Strategy Backtesting Studio</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Simulate quantitative trading rules against historical price data without executing real trades.
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          
          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700, display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>
              Target Stock
            </label>
            <select
              value={selectedStock}
              onChange={(e) => setSelectedStock(e.target.value)}
              style={{ width: '100%', background: '#FFFFFF', border: '1px solid var(--border-color)', color: '#212529', padding: '9px 12px', borderRadius: '6px', fontSize: '0.88rem' }}
            >
              {stocks.map(st => (
                <option key={st.symbol} value={st.symbol}>
                  {st.symbol} - {st.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700, display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>
              Trading Strategy
            </label>
            <select
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
              style={{ width: '100%', background: '#FFFFFF', border: '1px solid var(--border-color)', color: '#212529', padding: '9px 12px', borderRadius: '6px', fontSize: '0.88rem' }}
            >
              <option value="MA_CROSSOVER">Moving Average Crossover (5 vs 20 SMA)</option>
              <option value="MOMENTUM">Simple Momentum Strategy (+1.5%)</option>
              <option value="RSI">RSI Overbought/Oversold (35 / 65)</option>
              <option value="BUY_AND_HOLD">Buy & Hold Comparison</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700, display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>
              Initial Virtual Capital (₹)
            </label>
            <input
              type="number"
              value={initialCapital}
              onChange={(e) => setInitialCapital(e.target.value)}
              style={{ width: '100%', background: '#FFFFFF', border: '1px solid var(--border-color)', color: '#212529', padding: '9px 12px', borderRadius: '6px', fontSize: '0.88rem' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700, display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>
              Start Date (Optional)
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ width: '100%', background: '#FFFFFF', border: '1px solid var(--border-color)', color: '#212529', padding: '9px 12px', borderRadius: '6px', fontSize: '0.88rem' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700, display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>
              End Date (Optional)
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{ width: '100%', background: '#FFFFFF', border: '1px solid var(--border-color)', color: '#212529', padding: '9px 12px', borderRadius: '6px', fontSize: '0.88rem' }}
            />
          </div>

        </div>

        {/* Strategy Conditions Breakdown */}
        <div style={{ marginTop: '16px', background: '#F8F9FA', padding: '12px 16px', borderRadius: '6px', border: '1px solid var(--border-color)', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: '0.72rem', color: '#198754', fontWeight: 800, textTransform: 'uppercase' }}>● BUY Condition:</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginLeft: '8px' }}>{stratDesc.buy}</span>
          </div>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: '0.72rem', color: '#DC3545', fontWeight: 800, textTransform: 'uppercase' }}>● SELL Condition:</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginLeft: '8px' }}>{stratDesc.sell}</span>
          </div>
        </div>

        <button
          onClick={() => handleRunBacktest()}
          disabled={loading}
          style={{
            marginTop: '20px',
            width: '100%',
            background: 'var(--accent-blue)',
            color: '#FFFFFF',
            padding: '11px',
            borderRadius: '6px',
            fontWeight: 800,
            fontSize: '0.92rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          <Play size={18} fill="#FFF" /> {loading ? 'Simulating Strategy Against Historical Data...' : 'Run Historical Backtest'}
        </button>

      </div>

      {error && (
        <ErrorState 
          title="Backtest Simulation Error"
          message={error}
          onRetry={() => handleRunBacktest()}
        />
      )}

      {/* Backtest Results Dashboard */}
      {results && m && (
        <>
          {/* Key Metric Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            
            <div className="metric-summary-card">
              <span className="metric-card-label">Initial Capital</span>
              <span className="metric-card-val">₹{m.initial_capital.toLocaleString('en-IN')}</span>
            </div>

            <div className="metric-summary-card">
              <span className="metric-card-label">Final Capital</span>
              <span className="metric-card-val" style={{ color: m.total_return_percent >= 0 ? '#10B981' : '#EF4444' }}>
                ₹{m.final_capital.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="metric-summary-card">
              <span className="metric-card-label">Total Return %</span>
              <span className={`metric-card-val ${m.total_return_percent >= 0 ? 'text-positive' : 'text-negative'}`}>
                {m.total_return_percent >= 0 ? '+' : ''}{m.total_return_percent}%
              </span>
            </div>

            <div className="metric-summary-card">
              <span className="metric-card-label">Win Rate</span>
              <span className="metric-card-val" style={{ color: 'var(--accent-purple)' }}>
                {m.win_rate_percent}%
              </span>
            </div>

            <div className="metric-summary-card">
              <span className="metric-card-label">Max Drawdown</span>
              <span className="metric-card-val text-negative">
                -{m.max_drawdown_percent}%
              </span>
            </div>

            <div className="metric-summary-card">
              <span className="metric-card-label">Total Trades</span>
              <span className="metric-card-val">{m.total_trades} ({m.winning_trades}W / {m.losing_trades}L)</span>
            </div>

            <div className="metric-summary-card">
              <span className="metric-card-label">Best Trade</span>
              <span className="metric-card-val text-positive">+{m.best_trade_percent}%</span>
            </div>

            <div className="metric-summary-card">
              <span className="metric-card-label">Worst Trade</span>
              <span className="metric-card-val text-negative">{m.worst_trade_percent}%</span>
            </div>

          </div>

          {/* Equity Curve Comparison Chart */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Simulated Equity Growth Curve</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  Testing {results.symbol} ({results.date_range.total_days} days) — {results.strategy}
                </p>
              </div>
            </div>

            {renderEquityCurveChart()}
          </div>

          {/* Simulated Trade Execution History Table */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '24px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '16px' }}>Simulated Paper Trade Log</h3>
            
            {results.simulated_trades.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
                No trades were triggered for this strategy during the selected timeframe.
              </div>
            ) : (
              <div className="table-responsive-wrapper">
                <table className="fintech-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Symbol</th>
                      <th>Action</th>
                      <th>Execution Price</th>
                      <th>Quantity</th>
                      <th>Total Amount</th>
                      <th>Trade P&L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.simulated_trades.map((t, idx) => (
                      <tr key={idx}>
                        <td style={{ color: 'var(--text-secondary)' }}>{t.date}</td>
                        <td style={{ fontWeight: 800 }}>{t.symbol}</td>
                        <td>
                          <span className={t.type === 'BUY' ? 'badge-buy' : 'badge-sell'}>
                            {t.type}
                          </span>
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>₹{t.price.toFixed(2)}</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{t.quantity}</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>₹{t.total_amount.toFixed(2)}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 800 }} className={t.pnl ? (t.pnl >= 0 ? 'text-positive' : 'text-negative') : ''}>
                          {t.pnl !== undefined ? `${t.pnl >= 0 ? '+' : ''}₹${t.pnl.toFixed(2)} (${t.pnl_percent.toFixed(2)}%)` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

    </div>
  );
}
