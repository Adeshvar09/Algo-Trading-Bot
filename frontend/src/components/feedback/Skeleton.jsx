import React from 'react';

export default function Skeleton({ width = '100%', height = '20px', borderRadius = '8px', className = '' }) {
  return (
    <div 
      className={`skeleton-box ${className}`}
      style={{
        width,
        height,
        borderRadius
      }}
    />
  );
}

export function SkeletonStockList({ count = 5 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--bg-surface)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <Skeleton width="60px" height="16px" />
            <Skeleton width="120px" height="12px" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
            <Skeleton width="70px" height="16px" />
            <Skeleton width="45px" height="12px" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonPanel() {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Skeleton width="140px" height="28px" />
          <Skeleton width="220px" height="16px" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
          <Skeleton width="120px" height="32px" />
          <Skeleton width="80px" height="16px" />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        <Skeleton height="60px" />
        <Skeleton height="60px" />
        <Skeleton height="60px" />
        <Skeleton height="60px" />
      </div>
      <Skeleton height="260px" />
    </div>
  );
}
