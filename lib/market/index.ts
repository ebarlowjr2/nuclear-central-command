
import { fetchQuotesAlphaVantage, fetchQuotesFinnhub, fetchQuotesPolygon, Quote } from './providers';

/**
 * Fetch quotes using the configured market data provider
 * Priority: Finnhub > Polygon > AlphaVantage
 * 
 * @param symbols Array of stock symbols to fetch
 * @returns Array of quotes with price and change percentage
 * @throws Error if no API key is configured
 */
export async function fetchQuotes(symbols: string[]): Promise<Quote[]> {
  if (process.env.FINNHUB_API_KEY) {
    return fetchQuotesFinnhub(symbols);
  }
  
  if (process.env.POLYGON_API_KEY) {
    return fetchQuotesPolygon(symbols);
  }
  
  if (process.env.ALPHAVANTAGE_API_KEY) {
    return fetchQuotesAlphaVantage(symbols);
  }
  
  throw new Error(
    'No market data API key configured. Set one of: FINNHUB_API_KEY, POLYGON_API_KEY, or ALPHAVANTAGE_API_KEY'
  );
}

export type { Quote } from './providers';
