import React from 'react';
import { 
  BarChart3, 
  Star, 
  BriefcaseBusiness, 
  ArrowLeftRight, 
  ChevronLeft, 
  ChevronRight,
  Zap
} from 'lucide-react';

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  watchlistCount = 0, 
  isCollapsed, 
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen
}) {
  const navItems = [
    { 
      id: 'dashboard', 
      label: 'Market & Charts', 
      icon: BarChart3 
    },
    { 
      id: 'watchlist', 
      label: `Watchlist${watchlistCount > 0 ? ` (${watchlistCount})` : ''}`, 
      icon: Star 
    },
    { 
      id: 'portfolio', 
      label: 'Portfolio', 
      icon: BriefcaseBusiness 
    },
    { 
      id: 'transactions', 
      label: 'Transactions', 
      icon: ArrowLeftRight 
    }
  ];

  return (
    <>
      <div 
        className={`mobile-sidebar-overlay ${isMobileOpen ? 'mobile-open' : ''}`}
        onClick={() => setIsMobileOpen(false)}
        aria-hidden="true"
      />

      <aside 
        className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}
        aria-label="Sidebar Navigation"
      >
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="brand-icon-wrapper">
              <Zap size={22} />
            </div>
            <div className="brand-text">
              <span className="brand-title">◈ ALGO</span>
              <span className="brand-subtitle">TRADING BOT</span>
            </div>
          </div>

          <button 
            className="sidebar-toggle-btn"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            aria-label={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileOpen(false);
                }}
                data-tooltip={isCollapsed ? item.label : undefined}
                aria-label={item.label}
              >
                <div className="nav-icon">
                  <Icon size={20} />
                </div>
                <span className="nav-label">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
