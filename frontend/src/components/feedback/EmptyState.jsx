import React from 'react';
import { Inbox } from 'lucide-react';

export default function EmptyState({ 
  icon: Icon = Inbox, 
  title = 'No data available', 
  description = 'There are currently no items to display.',
  actionLabel,
  onAction 
}) {
  return (
    <div className="empty-state-box">
      <Icon size={44} className="empty-state-icon" />
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-subtext">{description}</p>
      {actionLabel && onAction && (
        <button 
          onClick={onAction}
          style={{
            marginTop: '16px',
            background: 'var(--accent-blue)',
            color: '#fff',
            padding: '9px 18px',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '0.85rem'
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
