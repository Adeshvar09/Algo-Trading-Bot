import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Award, 
  Activity, 
  BarChart2, 
  PieChart, 
  RefreshCw, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight,
  ShieldAlert
} from 'lucide-react';
import { 
  getAnalyticsSummary, 
  getAnalyticsPerformance, 
  getAnalyticsStocks, 
  getAnalyticsActivity 
} from '../services/api';
import ErrorState from '../components/feedback/ErrorState';
import Skeleton from '../components/feedback/Skeleton';

export default function Analytics() {
  const [summary, setSummary] = useState(null);
  const [performance, setPerformance] = useState([]);
  const [stockData, setStockData] = useState({ stocks: [], top_performers: [], bottom_performers: [] });
  const [activity, setActivity] = useState(null);

  const [timeframe, setTimeframe] = useState('ALL');
  const [activityTimeframe, setActivityTimeframe] = useState('ALL');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    loadAnalyticsData();
  }, [timeframe, activityTimeframe]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    setError(false);
    try {
      const [sumRes, perfRes, stocksRes, actRes] = await Promise.all([
        getAnalyticsSummary(),
        getAnalyticsPerformance(timeframe),
        getAnalyticsStocks(),
        getAnalyticsActivity(activityTimeframe)
      ]);
      setSummary(sumRes);
      setPerformance(perfRes || []);
      setStockData(stocksRes || { stocks: [], top_performers: [], bottom_performers: [] });
      setActivity(actRes);
    } catch (err) {
      console.error('Failed to load analytics data:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <ErrorState 
        title="Unable to load analytics data"
        message="Failed to retrieve analytics metrics from PostgreSQL database. Please ensure backend server is running."
        onRetry={loadAnalyticsData}
      />
    );
  }

  if (loading && !summary) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <Skeleton height="100px" />
        <Skeleton height="300px" />
        <Skeleton height="200px" />
      </div>
    );
  }

  // Calculate SVG line points for performance chart
  const renderPerformanceChart = () => {
    if (!performance || performance.length === 0) {
      return (
        <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
          No historical snapshot data available for this timeframe.
        </div>
      );
    }

    const width = 800;
    const height = 220;
    const padding = 30;

    const values = performance.map(p => p.portfolio_value);
    const minVal = Math.min(...values) * 0.98;
    const maxVal = Math.max(...values) * 1.02;
    const range = maxVal - minVal || 1;

    const points = performance.map((p, idx) => {
      const x = padding + (idx / Math.max(performance.length - 1, 1)) * (width - 2 * padding);
      const y = height - padding - ((p.portfolio_value - minVal) / range) * (height - 2 * padding);
      return `${x},${y}`;
    }).join(' ');

    const fillPoints = `${padding},${height - padding} ${points} ${width - padding},${height - padding}`;

    const isPositive = performance.length > 1 ? performance[performance.length - 1].portfolio_value >= performance[0].portfolio_value : true;
    const strokeColor = isPositive ? '#198754' : '#DC3545';
    const fillColor = isPositive ? 'rgba(25, 135, 84, 0.08)' : 'rgba(220, 53, 69, 0.08)';

    return (
      <div style={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '240px' }}>
          <polygon points={fillPoints} fill={fillColor} />
          <polyline points={points} fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {performance.map((p, idx) => {
            const x = padding + (idx / Math.max(performance.length - 1, 1)) * (width - 2 * padding);
            const y = height - padding - ((p.portfolio_value - minVal) / range) * (height - 2 * padding);
            if (idx === 0 || idx === performance.length - 1 || idx % Math.ceil(performance.length / 5) === 0) {
              return (
                <g key={idx}>
                  <circle cx={x} cy={y} r="4" fill={strokeColor} stroke="#FFFFFF" strokeWidth="2" />
                  <text x={x} y={height - 5} fill="var(--text-secondary)" fontSize="10" textAnchor="middle">
                    {p.date.slice(5)}
                  </text>
                </g>
              );
            }
            return null;
          })}
        </svg>
      </div>
    );
  };

  const addStats = summary?.additional_analytics || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* 8 Primary Analytics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        
        <div className="metric-summary-card">
          <span className="metric-card-label">Total Trades</span>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
            <span className="metric-card-val">{summary?.total_trades || 0}</span>
            <Activity size={20} color="var(--accent-blue)" />
          </div>
        </div>

        <div className="metric-summary-card">
          <span className="metric-card-label">Winning Trades</span>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
            <span className="metric-card-val text-positive">{summary?.winning_trades || 0}</span>
            <TrendingUp size={20} color="#10B981" />
          </div>
        </div>

        <div className="metric-summary-card">
          <span className="metric-card-label">Losing Trades</span>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
            <span className="metric-card-val text-negative">{summary?.losing_trades || 0}</span>
            <TrendingDown size={20} color="#EF4444" />
          </div>
        </div>

        <div className="metric-summary-card">
          <span className="metric-card-label">Win Rate</span>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
            <span className="metric-card-val" style={{ color: 'var(--accent-purple)' }}>
              {summary?.win_rate || 0}%
            </span>
            <Award size={20} color="var(--accent-purple)" />
          </div>
        </div>

        <div className="metric-summary-card">
          <span className="metric-card-label">Total Investment</span>
          <span className="metric-card-val">
            ₹{(summary?.total_investment || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="metric-summary-card">
          <span className="metric-card-label">Current Portfolio Value</span>
          <span className="metric-card-val">
            ₹{(summary?.current_portfolio_value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="metric-summary-card">
          <span className="metric-card-label">Total Profit / Loss</span>
          <span className={`metric-card-val ${(summary?.total_profit_loss || 0) >= 0 ? 'text-positive' : 'text-negative'}`}>
            {(summary?.total_profit_loss || 0) >= 0 ? '+' : ''}₹{(summary?.total_profit_loss || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="metric-summary-card">
          <span className="metric-card-label">Return Percentage</span>
          <span className={`metric-card-val ${(summary?.return_percentage || 0) >= 0 ? 'text-positive' : 'text-negative'}`}>
            {(summary?.return_percentage || 0) >= 0 ? '+' : ''}{(summary?.return_percentage || 0).toFixed(2)}%
          </span>
        </div>

      </div>

      {/* Additional Trade Analytics Metrics Grid */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '20px' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BarChart2 size={18} color="var(--accent-blue)" /> Detailed Trade Analytics
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          
          <div style={{ background: 'var(--bg-surface)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Avg Profit / Win</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#10B981', marginTop: '4px' }}>
              +₹{addStats.avg_profit_per_winning_trade || '0.00'}
            </div>
          </div>

          <div style={{ background: 'var(--bg-surface)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Avg Loss / Loss</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#EF4444', marginTop: '4px' }}>
              -₹{addStats.avg_loss_per_losing_trade || '0.00'}
            </div>
          </div>

          <div style={{ background: 'var(--bg-surface)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Largest Winning Trade</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#10B981', marginTop: '4px' }}>
              +₹{addStats.largest_winning_trade || '0.00'}
            </div>
          </div>

          <div style={{ background: 'var(--bg-surface)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Largest Losing Trade</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#EF4444', marginTop: '4px' }}>
              -₹{addStats.largest_losing_trade || '0.00'}
            </div>
          </div>

          <div style={{ background: 'var(--bg-surface)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>BUY / SELL Count</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, marginTop: '4px' }}>
              <span style={{ color: '#10B981' }}>{addStats.total_buy_transactions || 0} BUY</span> / <span style={{ color: '#EF4444' }}>{addStats.total_sell_transactions || 0} SELL</span>
            </div>
          </div>

          <div style={{ background: 'var(--bg-surface)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Average Trade Value</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, marginTop: '4px' }}>
              ₹{(addStats.average_trade_value || 0).toLocaleString('en-IN')}
            </div>
          </div>

          <div style={{ background: 'var(--bg-surface)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total Trading Volume</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, marginTop: '4px' }}>
              ₹{(addStats.trading_volume || 0).toLocaleString('en-IN')}
            </div>
          </div>

          <div style={{ background: 'var(--bg-surface)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Most Traded Stock</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--accent-blue)', marginTop: '4px' }}>
              {addStats.most_traded_stock || 'N/A'}
            </div>
          </div>

        </div>
      </div>

      {/* Portfolio Performance Chart with Timeframe Filters */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Portfolio Performance History</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Track historical paper portfolio values, capital invested, and unrealized profit/loss</p>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            {['1D', '1W', '1M', '3M', '6M', '1Y', 'ALL'].map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                style={{
                  background: timeframe === tf ? 'var(--accent-blue)' : 'var(--bg-surface)',
                  color: timeframe === tf ? '#FFFFFF' : 'var(--text-secondary)',
                  border: '1px solid var(--border-color)',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {renderPerformanceChart()}
      </div>

      {/* Top 5 Best & Bottom 5 Worst Performers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
        
        {/* Top 5 Performers */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '20px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '16px', color: '#10B981', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ArrowUpRight size={18} /> Top 5 Performing Stocks
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {stockData.top_performers.map((st, idx) => (
              <div key={st.symbol} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div>
                  <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{idx + 1}. {st.symbol}</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginLeft: '8px' }}>{st.name}</span>
                </div>
                <span className="text-positive" style={{ fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                  +{st.return_percentage.toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom 5 Performers */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '20px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '16px', color: '#EF4444', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ArrowDownRight size={18} /> Bottom 5 Performing Stocks
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {stockData.bottom_performers.map((st, idx) => (
              <div key={st.symbol} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div>
                  <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{idx + 1}. {st.symbol}</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginLeft: '8px' }}>{st.name}</span>
                </div>
                <span className={st.return_percentage >= 0 ? 'text-positive' : 'text-negative'} style={{ fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                  {st.return_percentage >= 0 ? '+' : ''}{st.return_percentage.toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Stock-Wise Performance Table */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '24px' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '16px' }}>Stock-Wise Performance Matrix</h3>
        <div className="table-responsive-wrapper">
          <table className="fintech-table">
            <thead>
              <tr>
                <th>Stock</th>
                <th>Quantity</th>
                <th>Avg Buy Price</th>
                <th>Invested Value</th>
                <th>Current Price</th>
                <th>Current Value</th>
                <th>Profit / Loss</th>
                <th>Return %</th>
              </tr>
            </thead>
            <tbody>
              {stockData.stocks.map(st => (
                <tr key={st.symbol}>
                  <td style={{ fontWeight: 800 }}>
                    {st.symbol} <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 400 }}>({st.name})</span>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{st.quantity}</td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>₹{st.average_buy_price.toFixed(2)}</td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>₹{st.invested_value.toFixed(2)}</td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>₹{st.current_price.toFixed(2)}</td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>₹{st.current_value.toFixed(2)}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 800 }} className={st.profit_loss >= 0 ? 'text-positive' : 'text-negative'}>
                    {st.profit_loss >= 0 ? '+' : ''}₹{st.profit_loss.toFixed(2)}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 800 }} className={st.return_percentage >= 0 ? 'text-positive' : 'text-negative'}>
                    {st.return_percentage >= 0 ? '+' : ''}{st.return_percentage.toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Trading Activity Filter & Overview */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Trading Activity Breakdown</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Filter trading execution statistics by time window</p>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            {['Today', 'This Week', 'This Month', 'This Year', 'All Time'].map(actTf => (
              <button
                key={actTf}
                onClick={() => setActivityTimeframe(actTf)}
                style={{
                  background: activityTimeframe === actTf ? 'var(--accent-blue)' : 'var(--bg-surface)',
                  color: activityTimeframe === actTf ? '#FFFFFF' : 'var(--text-secondary)',
                  border: '1px solid var(--border-color)',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {actTf}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
          <div style={{ background: 'var(--bg-surface)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>BUY Count</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#10B981', marginTop: '4px' }}>{activity?.buy_count || 0}</div>
          </div>

          <div style={{ background: 'var(--bg-surface)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>SELL Count</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#EF4444', marginTop: '4px' }}>{activity?.sell_count || 0}</div>
          </div>

          <div style={{ background: 'var(--bg-surface)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Total Trades</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '4px' }}>{activity?.total_trades || 0}</div>
          </div>

          <div style={{ background: 'var(--bg-surface)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Transaction Value</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '4px' }}>₹{(activity?.total_transaction_value || 0).toLocaleString('en-IN')}</div>
          </div>

          <div style={{ background: 'var(--bg-surface)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Most Traded Stock</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-blue)', marginTop: '4px' }}>{activity?.most_traded_stock || 'N/A'}</div>
          </div>
        </div>

      </div>

    </div>
  );
}
