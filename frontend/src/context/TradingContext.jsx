import React, { createContext, useContext, useState } from 'react';

const TradingContext = createContext(null);

export function TradingProvider({ children }) {
  const [selectedSymbol, setSelectedSymbol] = useState('TCS');

  return (
    <TradingContext.Provider value={{ selectedSymbol, setSelectedSymbol }}>
      {children}
    </TradingContext.Provider>
  );
}

export function useTrading() {
  return useContext(TradingContext);
}
