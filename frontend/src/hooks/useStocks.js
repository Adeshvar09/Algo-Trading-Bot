import { useState, useEffect } from 'react';
import { getStocks } from '../services/api';

export function useStocks() {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getStocks()
      .then(data => setStocks(data))
      .catch(err => setError(err))
      .finally(() => setLoading(false));
  }, []);

  return { stocks, loading, error };
}
