export const config = { runtime: 'edge' };

export default async function handler(req) {
  const symbols = [
    '^SSEC','^SZSC','^HSI',
    '600519.SS','000858.SZ','601318.SS','000001.SZ','600036.SS',
    '000333.SZ','601012.SS','300750.SZ','688981.SS','002415.SZ',
    '600809.SS','601888.SS','300059.SZ','600276.SS','002594.SZ'
  ];

  try {
    const resp = await fetch(
      `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols.join(',')}&fields=regularMarketPrice,regularMarketChange,regularMarketChangePercent,regularMarketPreviousClose,regularMarketDayHigh,regularMarketDayLow,regularMarketOpen,shortName`,
      { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' } }
    );
    const data = await resp.json();
    const results = (data.quoteResponse && data.quoteResponse.result) || [];
    const quotes = {};
    results.forEach(q => {
      quotes[q.symbol] = {
        price: q.regularMarketPrice,
        change: q.regularMarketChange,
        changePercent: q.regularMarketChangePercent,
        prevClose: q.regularMarketPreviousClose,
        high: q.regularMarketDayHigh,
        low: q.regularMarketDayLow,
        open: q.regularMarketOpen,
        name: q.shortName || q.symbol
      };
    });
    return new Response(JSON.stringify({ success: true, quotes, ts: Date.now() }), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
