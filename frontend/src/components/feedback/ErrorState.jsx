import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function ErrorState({ 
  title = 'Failed to load stock data from backend',
  message = "We couldn't connect to the backend. Please make sure the server is running and try again.",
  onRetry
}) {
  return (
    <div className="error-card-container">
      <div className="error-icon-box">
        <AlertTriangle size={28} />
      </div>
      <h3 className="error-title-text">{title}</h3>
      <p className="error-description-text">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="retry-action-btn">
          <RefreshCw size={16} /> Retry Connection
        </button>
      )}
    </div>
  );
}
