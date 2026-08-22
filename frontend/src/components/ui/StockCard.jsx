import React from 'react';

export default function StockCard({ stock, isSelected, onSelect }) {
  if (!stock) return null;

  const isPositive = stock.price_change >= 0;
  const priceFormatted = Number(stock.current_price || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  const changeFormatted = `${isPositive ? '+' : ''}${stock.percentage_change ? stock.percentage_change.toFixed(2) : '0.00'}%`;

  return (
    <div 
      className={`stock-card-item ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(stock.symbol)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect(stock.symbol)}
    >
      <div className="stock-info-meta">
        <span className="stock-symbol-code">{stock.symbol}</span>
        <span className="stock-full-name">{stock.name}</span>
      </div>

      <div className="stock-pricing-meta">
        <span className="stock-current-price">₹{priceFormatted}</span>
        <span className={`stock-change-badge ${isPositive ? 'text-positive' : 'text-negative'}`}>
          {changeFormatted}
        </span>
      </div>
    </div>
  );
}
