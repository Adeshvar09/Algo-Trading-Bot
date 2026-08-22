/**
 * Formatting utilities for Currency & Numbers
 */

export const formatCurrency = (val: number): string => {
  return `₹${Number(val || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

export const formatPercent = (val: number): string => {
  const isPositive = val >= 0;
  return `${isPositive ? '+' : ''}${val ? val.toFixed(2) : '0.00'}%`;
};
