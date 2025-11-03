
export type Quote = {
  symbol: string;
  price: number | null;
  changePct: number | null;
  currency?: string;
};

/**
 * Fetch quotes from Alpha Vantage API
 * Note: Free tier is heavily rate-limited (5 requests/minute)
 */
export async function fetchQuotesAlphaVantage(symbols: string[]): Promise<Quote[]> {
  const key = process.env.ALPHAVANTAGE_API_KEY;
  if (!key) {
    throw new Error('ALPHAVANTAGE_API_KEY not configured');
  }

  const out: Quote[] = [];
  
  for (const s of symbols) {
    try {
      const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(s)}&apikey=${key}`;
      const r = await fetch(url);
      const j = await r.json();
      
      const g = j['Global Quote'] || {};
      const priceStr = g['05. price'];
      const changePctStr = (g['10. change percent'] || '').replace('%', '');
      
      const price = priceStr ? parseFloat(priceStr) : NaN;
      const changePct = changePctStr ? parseFloat(changePctStr) : NaN;
      
      out.push({
        symbol: s,
        price: isFinite(price) ? price : null,
        changePct: isFinite(changePct) ? changePct : null,
        currency: 'USD'
      });
    } catch (error) {
      console.error(`Error fetching quote for ${s} from AlphaVantage:`, error);
      out.push({ symbol: s, price: null, changePct: null, currency: 'USD' });
    }
  }
  
  return out;
}

/**
 * Fetch quotes from Finnhub API
 * Generally more reliable for multiple symbols
 */
export async function fetchQuotesFinnhub(symbols: string[]): Promise<Quote[]> {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) {
    throw new Error('FINNHUB_API_KEY not configured');
  }

  const out: Quote[] = [];
  
  for (const s of symbols) {
    try {
      const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(s)}&token=${key}`;
      const r = await fetch(url);
      const j = await r.json();
      
      const price = typeof j?.c === 'number' ? j.c : null;
      const changePct = typeof j?.dp === 'number' ? j.dp : null;
      
      out.push({
        symbol: s,
        price,
        changePct,
        currency: 'USD'
      });
    } catch (error) {
      console.error(`Error fetching quote for ${s} from Finnhub:`, error);
      out.push({ symbol: s, price: null, changePct: null, currency: 'USD' });
    }
  }
  
  return out;
}

/**
 * Fetch quotes from Polygon.io API
 * Premium option with good rate limits
 */
export async function fetchQuotesPolygon(symbols: string[]): Promise<Quote[]> {
  const key = process.env.POLYGON_API_KEY;
  if (!key) {
    throw new Error('POLYGON_API_KEY not configured');
  }

  const out: Quote[] = [];
  
  for (const s of symbols) {
    try {
      const url = `https://api.polygon.io/v2/aggs/ticker/${encodeURIComponent(s)}/prev?adjusted=true&apiKey=${key}`;
      const r = await fetch(url);
      const j = await r.json();
      
      if (j.results && j.results.length > 0) {
        const result = j.results[0];
        const price = result.c; // close price
        const open = result.o;
        const changePct = open > 0 ? ((price - open) / open) * 100 : null;
        
        out.push({
          symbol: s,
          price: typeof price === 'number' ? price : null,
          changePct: typeof changePct === 'number' ? changePct : null,
          currency: 'USD'
        });
      } else {
        out.push({ symbol: s, price: null, changePct: null, currency: 'USD' });
      }
    } catch (error) {
      console.error(`Error fetching quote for ${s} from Polygon:`, error);
      out.push({ symbol: s, price: null, changePct: null, currency: 'USD' });
    }
  }
  
  return out;
}
