export interface PortfolioTemplate {
  id: string;
  name: string;
  description: string;
  category: '經典' | '股債平衡' | '因子投資' | '全球配置' | '收益型';
  holdings: Array<{ symbol: string; weight: number; name: string }>;
  tags: string[];
}

export const portfolioTemplates: PortfolioTemplate[] = [
  {
    id: 'classic-60-40',
    name: '經典 60/40',
    description: '最傳統的資產配置，60% 股票 + 40% 債券，適合長期穩健投資者',
    category: '經典',
    holdings: [
      { symbol: 'SPY', weight: 0.60, name: 'S&P 500 ETF' },
      { symbol: 'VXUS', weight: 0.40, name: 'Total International Stock' },
    ],
    tags: ['穩健', '保守', '退休規劃'],
  },
  {
    id: 'all-weather',
    name: '全天候組合',
    description: '分散配置於美股、國際股和價值股，適合各種經濟環境',
    category: '股債平衡',
    holdings: [
      { symbol: 'VUAA', weight: 0.30, name: 'S&P 500 UCITS' },
      { symbol: 'VXUS', weight: 0.30, name: 'International Stock' },
      { symbol: 'VTV', weight: 0.25, name: 'Value ETF' },
      { symbol: 'VYM', weight: 0.15, name: 'High Dividend Yield' },
    ],
    tags: ['風險平價', '全天候', '分散'],
  },
  {
    id: 'tech-focused',
    name: '科技股集中',
    description: '70% 科技股指數 + 30% 全市場，適合看好科技產業的積極投資者',
    category: '因子投資',
    holdings: [
      { symbol: 'CNDX', weight: 0.70, name: 'NASDAQ-100 UCITS' },
      { symbol: 'VUAA', weight: 0.30, name: 'S&P 500 UCITS' },
    ],
    tags: ['科技', '積極', '成長'],
  },
  {
    id: 'global-diversified',
    name: '全球分散',
    description: '100% 全球股市，最簡單的全球化配置',
    category: '全球配置',
    holdings: [
      { symbol: 'VXUS', weight: 0.60, name: 'International Stock' },
      { symbol: 'VUAA', weight: 0.40, name: 'S&P 500 UCITS' },
    ],
    tags: ['全球', '簡單', '被動'],
  },
  {
    id: 'dividend-income',
    name: '股息收益',
    description: '高股息策略，適合追求現金流的投資者',
    category: '收益型',
    holdings: [
      { symbol: 'SCHD', weight: 0.50, name: 'US Dividend Equity' },
      { symbol: 'VYM', weight: 0.30, name: 'High Dividend Yield' },
      { symbol: 'HDV', weight: 0.20, name: 'Core High Dividend' },
    ],
    tags: ['股息', '收益', '現金流'],
  },
  {
    id: 'small-cap-value',
    name: '小型價值',
    description: '專注於小型價值股，長期歷史績效優於大盤，但波動較大',
    category: '因子投資',
    holdings: [
      { symbol: 'AVUV', weight: 0.40, name: 'US Small Cap Value' },
      { symbol: 'VBR', weight: 0.30, name: 'Small-Cap Value' },
      { symbol: 'VTV', weight: 0.30, name: 'Large-Cap Value' },
    ],
    tags: ['價值', '小型股', '因子'],
  },
  {
    id: 'momentum-factor',
    name: '動能因子',
    description: '追蹤市場動能股，適合動能策略投資者',
    category: '因子投資',
    holdings: [
      { symbol: 'QMOM', weight: 0.40, name: 'Quantitative Momentum' },
      { symbol: 'IUMO', weight: 0.35, name: 'MSCI USA Momentum' },
      { symbol: 'VUAA', weight: 0.25, name: 'S&P 500 UCITS' },
    ],
    tags: ['動能', '因子', '趨勢'],
  },
  {
    id: 'three-fund',
    name: '三基金組合',
    description: '極簡主義配置，美股 + 國際股 + 價值股，低費用率',
    category: '股債平衡',
    holdings: [
      { symbol: 'VUAA', weight: 0.48, name: 'S&P 500 UCITS' },
      { symbol: 'VXUS', weight: 0.32, name: 'International Stock' },
      { symbol: 'VTV', weight: 0.20, name: 'Value ETF' },
    ],
    tags: ['極簡', '低費用', '被動'],
  },
  {
    id: 'uk-investor',
    name: '英國投資者組合',
    description: '適合英國投資者的 UCITS ETF 配置',
    category: '全球配置',
    holdings: [
      { symbol: 'VUAA', weight: 0.50, name: 'S&P 500 UCITS' },
      { symbol: 'CNDX', weight: 0.30, name: 'NASDAQ 100 UCITS' },
      { symbol: 'VXUS', weight: 0.20, name: 'International Stock' },
    ],
    tags: ['UCITS', '英國', '累積型'],
  },
  {
    id: 'growth-focused',
    name: '成長股集中',
    description: '專注於成長型股票，適合追求資本增值的投資者',
    category: '因子投資',
    holdings: [
      { symbol: 'VUG', weight: 0.50, name: 'Growth ETF' },
      { symbol: 'VBK', weight: 0.30, name: 'Small-Cap Growth' },
      { symbol: 'CNDX', weight: 0.20, name: 'NASDAQ 100 UCITS' },
    ],
    tags: ['成長', '積極', '資本增值'],
  },
  {
    id: 'international-value',
    name: '國際價值',
    description: '專注於國際市場的價值投資',
    category: '全球配置',
    holdings: [
      { symbol: 'AVWS', weight: 0.40, name: 'International Small Cap Value' },
      { symbol: 'VXUS', weight: 0.35, name: 'Total International Stock' },
      { symbol: 'VTV', weight: 0.25, name: 'US Value ETF' },
    ],
    tags: ['國際', '價值', '分散'],
  },
  {
    id: 'dividend-growth',
    name: '股息成長',
    description: '專注於持續增加股息的優質公司',
    category: '收益型',
    holdings: [
      { symbol: 'VIG', weight: 0.40, name: 'Dividend Appreciation' },
      { symbol: 'DGRO', weight: 0.35, name: 'Core Dividend Growth' },
      { symbol: 'SCHD', weight: 0.25, name: 'US Dividend Equity' },
    ],
    tags: ['股息成長', '質量', '穩健'],
  },
];

// 依類別分組
export const templatesByCategory = portfolioTemplates.reduce((acc, template) => {
  if (!acc[template.category]) {
    acc[template.category] = [];
  }
  acc[template.category].push(template);
  return acc;
}, {} as Record<string, PortfolioTemplate[]>);

// 取得所有類別
export const templateCategories = Array.from(
  new Set(portfolioTemplates.map((t) => t.category))
);
