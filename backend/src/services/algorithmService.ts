import { PriceHistoryItem, AlgorithmSignalResult } from '../models/Signal';

export function generateAlgorithmSignal(
  symbol: string,
  priceHistory: PriceHistoryItem[]
): AlgorithmSignalResult {
  if (!priceHistory || priceHistory.length === 0) {
    return {
      symbol: symbol.toUpperCase(),
      signal: 'HOLD',
      score: 2,
      confidence: 0.50,
      reasons: ['Insufficient historical data to calculate technical indicators']
    };
  }

  const sortedPrices = [...priceHistory].sort(
    (a, b) => new Date(a.price_date).getTime() - new Date(b.price_date).getTime()
  );
  const latestPrice = parseFloat(sortedPrices[sortedPrices.length - 1].close_price.toString());

  const period20 = sortedPrices.slice(-20);
  const sum20 = period20.reduce((acc, curr) => acc + parseFloat(curr.close_price.toString()), 0);
  const sma20 = sum20 / period20.length;

  const period5 = sortedPrices.slice(-5);
  const price5DaysAgo = parseFloat(period5[0].close_price.toString());
  const momentumPercent = ((latestPrice - price5DaysAgo) / price5DaysAgo) * 100;

  const vol5Sum = period5.reduce((acc, curr) => acc + parseInt(curr.volume.toString(), 10), 0);
  const avgVol5 = vol5Sum / period5.length;

  const vol20Sum = period20.reduce((acc, curr) => acc + parseInt(curr.volume.toString(), 10), 0);
  const avgVol20 = vol20Sum / period20.length;

  const volumeIncreasePercent = ((avgVol5 - avgVol20) / avgVol20) * 100;

  let score = 0;
  const reasons: string[] = [];

  if (latestPrice > sma20) {
    score += 2;
    reasons.push(`Price (₹${latestPrice.toFixed(2)}) is above 20-day moving average (₹${sma20.toFixed(2)})`);
  } else {
    reasons.push(`Price (₹${latestPrice.toFixed(2)}) is below 20-day moving average (₹${sma20.toFixed(2)})`);
  }

  if (momentumPercent > 0) {
    score += 2;
    reasons.push(`Positive price momentum (+${momentumPercent.toFixed(2)}% over 5 days)`);
  } else if (momentumPercent > -2.0) {
    score += 1;
    reasons.push(`Stable price momentum (${momentumPercent.toFixed(2)}% over 5 days)`);
  } else {
    reasons.push(`Negative price momentum (${momentumPercent.toFixed(2)}% over 5 days)`);
  }

  if (avgVol5 > avgVol20) {
    score += 1;
    reasons.push(`High trading volume (+${volumeIncreasePercent.toFixed(1)}% vs 20-day average)`);
  }

  let signal: 'BUY' | 'HOLD' | 'SELL' = 'HOLD';
  if (score >= 4) signal = 'BUY';
  else if (score <= 1) signal = 'SELL';

  const maxScore = 5;
  const confidence = parseFloat((score / maxScore).toFixed(2));

  return {
    symbol: symbol.toUpperCase(),
    signal,
    score,
    confidence,
    reasons,
    indicators: {
      latest_price: parseFloat(latestPrice.toFixed(2)),
      sma20: parseFloat(sma20.toFixed(2)),
      momentum_5d_percent: parseFloat(momentumPercent.toFixed(2)),
      volume_trend_percent: parseFloat(volumeIncreasePercent.toFixed(2))
    }
  };
}
