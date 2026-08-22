import React from 'react';
import { RefreshCw } from 'lucide-react';

export default function VirtualBalance({ balance = 0, onRefresh, loading = false }) {
  const formattedBalance = Number(balance || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  return (
    <div className="virtual-balance-card" title="Current Virtual Cash Balance">
      <div className="balance-meta">
        <span className="balance-title">Virtual Balance</span>
        <span className="balance-val">₹{formattedBalance}</span>
      </div>
      {onRefresh && (
        <button 
          onClick={onRefresh} 
          className="balance-refresh-btn"
          title="Refresh Market & Balance Data"
          aria-label="Refresh Market Data"
          disabled={loading}
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      )}
    </div>
  );
}
