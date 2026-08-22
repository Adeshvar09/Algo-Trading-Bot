import React from 'react';
import { Menu } from 'lucide-react';
import VirtualBalance from '../ui/VirtualBalance';

export default function Header({ 
  activeTab, 
  virtualBalance, 
  onRefresh, 
  loading,
  isMobileOpen,
  setIsMobileOpen 
}) {
  const getHeaderDetails = () => {
    switch (activeTab) {
      case 'dashboard':
        return {
          title: 'Market & Charts',
          subtitle: 'Analyze synthetic stocks and monitor algorithmic trade signals'
        };
      case 'watchlist':
        return {
          title: 'Watchlist',
          subtitle: 'Track your bookmarked stocks and live signals in real-time'
        };
      case 'portfolio':
        return {
          title: 'Portfolio Overview',
          subtitle: 'Monitor paper holdings, invested capital, and net unrealized P&L'
        };
      case 'transactions':
        return {
          title: 'Transaction History',
          subtitle: 'Review completed paper buy and sell orders'
        };
      default:
        return {
          title: 'Dashboard',
          subtitle: 'Algorithmic Stock Analysis'
        };
    }
  };

  const { title, subtitle } = getHeaderDetails();

  return (
    <header className="top-header">
      <div className="header-left-group">
        <button 
          className="mobile-drawer-btn"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          title="Toggle Navigation Menu"
          aria-label="Toggle Navigation Menu"
        >
          <Menu size={20} />
        </button>
        
        <div className="header-titles">
          <h1 className="header-page-title">{title}</h1>
          <p className="header-page-subtitle">{subtitle}</p>
        </div>
      </div>

      <div className="header-right-group">
        <div className="status-badge-connected" title="Connected to Backend Synthetic Data Engine">
          <span className="status-dot-pulse"></span>
          <span>Backend Connected</span>
        </div>

        <VirtualBalance 
          balance={virtualBalance} 
          onRefresh={onRefresh} 
          loading={loading} 
        />
      </div>
    </header>
  );
}
