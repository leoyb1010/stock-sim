export const config = { runtime: 'edge' };

// Sina Finance API - free, real-time A-share data
// Symbol format: sh600519, sz000001, sh000001(index)

const SYMBOLS = [
  'sh000001',  // 上证指数
  'sz399001',  // 深证成指
  'sz399006',  // 创业板指
  'sh000688',  // 科创50
  'hkHSI',     // 恒生指数
  'sh600519',  // 贵州茅台
  'sz000858',  // 五粮液
  'sh601318',  // 中国平安
  'sz000001',  // 平安银行
  'sh600036',  // 招商银行
  'sz000333',  // 美的集团
  'sh601012',  // 隆基绿能
  'sz300750',  // 宁德时代
  'sh688981',  // 中芯国际
  'sz002415',  // 海康威视
  'sh600809',  // 山西汾酒
  'sh601888',  // 中国中免
  'sz300059',  // 东方财富
  'sh600276',  // 恒瑞医药
  'sz002594',  // 比亚迪
];

function parseSinaLine(text) {
  // Format: var hq_str_sh600519="贵州茅台,open,prev_close,...";
  const parts = text.split('="');
  if (parts.length < 2) return null;
  const symbol = parts[0].split('_').pop();
  const data = parts[1].replace('";', '').split(',');
  if (data.length < 32) return null;

  const name = data[0];
  const open = parseFloat(data[1]);
  const prevClose = parseFloat(data[2]);
  const current = parseFloat(data[3]);
  const high = parseFloat(data[4]);
  const low = parseFloat(data[5]);

  return {
    symbol, name,
    price: current || open,
    prevClose: prevClose || open,
    open: open,
    high: high || open,
    low: low || open,
    change: (current || open) - (prevClose || open),
    changePercent: prevClose ? (((current || open) - prevClose) / prevClose * 100) : 0,
  };
}

export default async function handler(req) {
  try {
    const resp = await fetch(
      `https://hq.sinajs.cn/list=${SYMBOLS.join(',')}`,
      {
        headers: {
          'Referer': 'https://finance.sina.com.cn',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        },
        // Cache for 5 seconds
        next: { revalidate: 5 }
      }
    );

    const text = await resp.text();
    const lines = text.trim().split('\n').filter(l => l.includes('"'));
    const quotes = {};

    lines.forEach(line => {
      const parsed = parseSinaLine(line);
      if (parsed) {
        quotes[parsed.symbol] = parsed;
      }
    });

    return new Response(
      JSON.stringify({ success: true, quotes, ts: Date.now() }),
      { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
