import React, { useState, useEffect } from 'react';
import { Star, Briefcase, History } from 'lucide-react';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import SearchBar from './components/ui/SearchBar';
import StockCard from './components/ui/StockCard';
import StockPanel from './components/ui/StockPanel';
import Chatbot from './features/chatbot/Chatbot';
import ErrorState from './components/feedback/ErrorState';
import EmptyState from './components/feedback/EmptyState';
import Skeleton, { SkeletonStockList } from './components/feedback/Skeleton';
import { 
  getStocks, 
  getWatchlist, 
  getPortfolio, 
  getTransactions, 
  removeFromWatchlist
} from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stocks, setStocks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSymbol, setSelectedSymbol] = useState('TCS');
  const [watchlist, setWatchlist] = useState([]);
  const [portfolio, setPortfolio] = useState({
    virtual_balance: 1000000.00,
    total_investment: 0,
    current_value: 0,
    profit_loss: 0,
    return_percentage: 0,
    holdings: []
  });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  // Sidebar responsive & collapse state
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsCollapsed(true);
      } else {
        setIsCollapsed(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    setFetchError(false);
    try {
      const [stocksData, watchlistData, portfolioData, txsData] = await Promise.all([
        getStocks(),
        getWatchlist(),
        getPortfolio(),
        getTransactions()
      ]);

      setStocks(stocksData || []);
      setWatchlist(watchlistData || []);
      setPortfolio(portfolioData || {
        virtual_balance: 1000000.00,
        total_investment: 0,
        current_value: 0,
        profit_loss: 0,
        return_percentage: 0,
        holdings: []
      });
      setTransactions(txsData || []);

      if (stocksData && stocksData.length > 0 && !selectedSymbol) {
        setSelectedSymbol(stocksData[0].symbol);
      }
    } catch (err) {
      console.error('Error loading application data:', err);
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  };

  const filteredStocks = stocks.filter(s => 
    s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleWatchlistUpdate = async () => {
    try {
      const updatedWatchlist = await getWatchlist();
      setWatchlist(updatedWatchlist || []);
    } catch (err) {
      console.error('Watchlist update error:', err);
    }
  };

  const handleOrderSuccess = async () => {
    try {
      const [updatedPortfolio, updatedTxs, updatedStocks] = await Promise.all([
        getPortfolio(),
        getTransactions(),
        getStocks()
      ]);
      setPortfolio(updatedPortfolio || portfolio);
      setTransactions(updatedTxs || transactions);
      setStocks(updatedStocks || stocks);
    } catch (err) {
      console.error('Order success sync error:', err);
    }
  };

  const getSignalBadgeClass = (sig) => {
    if (sig === 'BUY') return 'badge-buy';
    if (sig === 'SELL') return 'badge-sell';
    return 'badge-hold';
  };

  return (
    <div className="app-layout">
      
      {/* Left Vertical Navigation Sidebar */}
      <Sidebar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        watchlistCount={watchlist.length}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main Layout Area */}
      <div className={`main-content-wrapper ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
        
        {/* Sticky Header Bar */}
        <Header 
          activeTab={activeTab}
          virtualBalance={portfolio.virtual_balance}
          onRefresh={loadAllData}
          loading={loading}
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
        />

        {/* Dynamic Page Content */}
        <main className="page-body-container">

          {/* Global Backend Error State */}
          {fetchError ? (
            <ErrorState 
              title="Failed to load stock data from backend"
              message="We couldn't connect to the backend server. Please verify that the server is running on port 5000 and click retry."
              onRetry={loadAllData}
            />
          ) : loading ? (
            /* Loading Skeleton State */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px' }}>
                <div className="stock-search-panel">
                  <Skeleton height="36px" />
                  <SkeletonStockList count={6} />
                </div>
                <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
                  <Skeleton height="30px" width="40%" />
                  <Skeleton height="20px" width="60%" className="mt-2" />
                  <Skeleton height="280px" className="mt-4" />
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* MARKET & CHARTS TAB */}
              {activeTab === 'dashboard' && (
                <div className="market-dashboard-grid">
                  
                  {/* Stock List & Search Panel */}
                  <aside className="stock-search-panel">
                    <div className="panel-header-row">
                      <h2 className="panel-title-text">Synthetic Stocks</h2>
                      <span className="stock-count-tag">
                        {stocks.length} Available
                      </span>
                    </div>

                    <SearchBar 
                      value={searchQuery} 
                      onChange={setSearchQuery} 
                    />

                    <div className="stock-list-container">
                      {filteredStocks.length === 0 ? (
                        <EmptyState 
                          title="No stocks found" 
                          description={`No stock matches your search "${searchQuery}"`}
                        />
                      ) : (
                        filteredStocks.map((st) => (
                          <StockCard 
                            key={st.id}
                            stock={st}
                            isSelected={selectedSymbol === st.symbol}
                            onSelect={setSelectedSymbol}
                          />
                        ))
                      )}
                    </div>
                  </aside>

                  {/* Stock Chart & Technical Analysis Panel */}
                  <div style={{ minWidth: 0 }}>
                    <StockPanel 
                      symbol={selectedSymbol} 
                      watchlist={watchlist}
                      onWatchlistUpdate={handleWatchlistUpdate}
                      onOrderSuccess={handleOrderSuccess}
                    />
                  </div>

                </div>
              )}

              {/* WATCHLIST TAB */}
              {activeTab === 'watchlist' && (
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div>
                      <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Watchlist</h2>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                        Track live prices and algorithmic signals for your bookmarked stocks
                      </p>
                    </div>
                  </div>

                  {watchlist.length === 0 ? (
                    <EmptyState 
                      icon={Star}
                      title="Your watchlist is empty"
                      description="Select stocks in Market & Charts tab and click the star icon to track them here."
                      actionLabel="Explore Market Stocks"
                      onAction={() => setActiveTab('dashboard')}
                    />
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                      {watchlist.map((item) => (
                        <div key={item.id} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                              <div>
                                <div style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--text-primary)' }}>{item.symbol}</div>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{item.name}</div>
                              </div>
                              <button 
                                onClick={async () => {
                                  await removeFromWatchlist(item.symbol);
                                  handleWatchlistUpdate();
                                }}
                                style={{ background: 'transparent', color: '#F59E0B', padding: '4px' }}
                                title="Remove from Watchlist"
                                aria-label="Remove from Watchlist"
                              >
                                <Star size={20} fill="#F59E0B" color="#F59E0B" />
                              </button>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                              <div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>Price</div>
                                <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '0.95rem' }}>
                                  ₹{Number(item.current_price || 0).toFixed(2)}
                                </div>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '2px' }}>Signal</div>
                                <span className={getSignalBadgeClass(item.signal)}>{item.signal} ({item.score}/5)</span>
                              </div>
                            </div>
                          </div>

                          <button 
                            onClick={() => {
                              setSelectedSymbol(item.symbol);
                              setActiveTab('dashboard');
                            }}
                            style={{ width: '100%', marginTop: '16px', background: 'var(--bg-card-hover)', color: '#fff', padding: '10px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700, border: '1px solid var(--border-color)' }}
                          >
                            View Chart & Trade
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* PORTFOLIO TAB */}
              {activeTab === 'portfolio' && (
                <div>
                  {/* Summary Metric Cards */}
                  <div className="portfolio-summary-row">
                    <div className="metric-summary-card">
                      <span className="metric-card-label">Virtual Cash Balance</span>
                      <span className="metric-card-val" style={{ color: 'var(--color-positive)' }}>
                        ₹{portfolio.virtual_balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="metric-summary-card">
                      <span className="metric-card-label">Total Invested</span>
                      <span className="metric-card-val">
                        ₹{portfolio.total_investment.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="metric-summary-card">
                      <span className="metric-card-label">Current Portfolio Value</span>
                      <span className="metric-card-val">
                        ₹{portfolio.current_value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="metric-summary-card">
                      <span className="metric-card-label">Net Profit / Loss</span>
                      <span className={`metric-card-val ${portfolio.profit_loss >= 0 ? 'text-positive' : 'text-negative'}`}>
                        {portfolio.profit_loss >= 0 ? '+' : ''}₹{portfolio.profit_loss.toLocaleString('en-IN', { minimumFractionDigits: 2 })} ({portfolio.return_percentage.toFixed(2)}%)
                      </span>
                    </div>
                  </div>

                  {/* Stock Holdings Table Container */}
                  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '24px' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '16px' }}>Active Stock Holdings</h3>

                    {portfolio.holdings.length === 0 ? (
                      <EmptyState 
                        icon={Briefcase}
                        title="No active stock holdings"
                        description="Execute paper trades in the Market & Charts tab to build your investment portfolio."
                        actionLabel="Trade Stocks Now"
                        onAction={() => setActiveTab('dashboard')}
                      />
                    ) : (
                      <div className="table-responsive-wrapper">
                        <table className="fintech-table">
                          <thead>
                            <tr>
                              <th>Symbol</th>
                              <th>Stock Name</th>
                              <th>Quantity</th>
                              <th>Avg Buy Price</th>
                              <th>Current Price</th>
                              <th>Invested Value</th>
                              <th>Current Value</th>
                              <th>Unrealized P/L</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {portfolio.holdings.map((h) => (
                              <tr key={h.id}>
                                <td style={{ fontWeight: 800 }}>{h.symbol}</td>
                                <td style={{ color: 'var(--text-secondary)' }}>{h.name}</td>
                                <td style={{ fontFamily: 'var(--font-mono)' }}>{h.quantity}</td>
                                <td style={{ fontFamily: 'var(--font-mono)' }}>₹{h.average_price.toFixed(2)}</td>
                                <td style={{ fontFamily: 'var(--font-mono)' }}>₹{h.current_price.toFixed(2)}</td>
                                <td style={{ fontFamily: 'var(--font-mono)' }}>₹{h.total_invested.toFixed(2)}</td>
                                <td style={{ fontFamily: 'var(--font-mono)' }}>₹{h.current_value.toFixed(2)}</td>
                                <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 800 }} className={h.pnl >= 0 ? 'text-positive' : 'text-negative'}>
                                  {h.pnl >= 0 ? '+' : ''}₹{h.pnl.toFixed(2)} ({h.pnl_percent.toFixed(2)}%)
                                </td>
                                <td>
                                  <button 
                                    onClick={() => {
                                      setSelectedSymbol(h.symbol);
                                      setActiveTab('dashboard');
                                    }}
                                    style={{ background: 'var(--accent-blue)', color: '#fff', padding: '6px 14px', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 700 }}
                                  >
                                    Trade
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TRANSACTIONS TAB */}
              {activeTab === 'transactions' && (
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '24px' }}>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '16px' }}>Paper Trading Transaction Log</h2>

                  {transactions.length === 0 ? (
                    <EmptyState 
                      icon={History}
                      title="No transaction history recorded"
                      description="Your completed paper buy and sell orders will be logged here."
                    />
                  ) : (
                    <div className="table-responsive-wrapper">
                      <table className="fintech-table">
                        <thead>
                          <tr>
                            <th>Date & Time</th>
                            <th>Symbol</th>
                            <th>Type</th>
                            <th>Quantity</th>
                            <th>Execution Price</th>
                            <th>Total Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {transactions.map((tx) => (
                            <tr key={tx.id}>
                              <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                {new Date(tx.created_at).toLocaleString('en-IN')}
                              </td>
                              <td style={{ fontWeight: 800 }}>{tx.symbol}</td>
                              <td>
                                <span className={tx.type === 'BUY' ? 'badge-buy' : 'badge-sell'}>
                                  {tx.type}
                                </span>
                              </td>
                              <td style={{ fontFamily: 'var(--font-mono)' }}>{tx.quantity}</td>
                              <td style={{ fontFamily: 'var(--font-mono)' }}>₹{tx.price.toFixed(2)}</td>
                              <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 800 }}>₹{tx.total_amount.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

        </main>
      </div>

      {/* Persistent Floating AI Chatbot */}
      <Chatbot />

    </div>
  );
}
