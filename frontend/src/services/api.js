import axios from 'axios';

const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getStocks = async () => {
  const response = await api.get('/stocks');
  return response.data.data;
};

export const getStockDetails = async (symbol) => {
  const response = await api.get(`/stocks/${symbol}`);
  return response.data.data;
};

export const getStockHistory = async (symbol) => {
  const response = await api.get(`/stocks/${symbol}/history`);
  return response.data.data;
};

export const getStockSignal = async (symbol) => {
  const response = await api.get(`/stocks/${symbol}/signal`);
  return response.data.data;
};

export const getWatchlist = async () => {
  const response = await api.get('/watchlist');
  return response.data.data;
};

export const addToWatchlist = async (symbol) => {
  const response = await api.post('/watchlist', { symbol });
  return response.data.data;
};

export const removeFromWatchlist = async (symbol) => {
  const response = await api.delete(`/watchlist/${symbol}`);
  return response.data.data;
};

export const getPortfolio = async () => {
  const response = await api.get('/portfolio');
  return response.data.data;
};

export const getTransactions = async () => {
  const response = await api.get('/transactions');
  return response.data.data;
};

export const placeOrder = async (orderData) => {
  const response = await api.post('/orders', orderData);
  return response.data.data;
};

export const sendChatMessage = async (message) => {
  const response = await api.post('/chat', { message });
  return response.data.data;
};

export default api;
