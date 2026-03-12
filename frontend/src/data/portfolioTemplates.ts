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
      { symbol: 'VOO', weight: 0.60, name: 'S&P 500 ETF' },
      { symbol: 'BND', weight: 0.40, name: 'Total Bond Market' },
    ],
    tags: ['穩健', '保守', '退休規劃'],
  },
  {
    id: 'all-weather',
    name: '全天候組合',
    description: '橋水基金達里奧推薦的風險平價策略，各種經濟環境都能表現穩定',
    category: '股債平衡',
    holdings: [
      { symbol: 'VTI', weight: 0.30, name: 'Total Stock Market' },
      { symbol: 'VXUS', weight: 0.20, name: 'International Stock' },
      { symbol: 'BND', weight: 0.40, name: 'Total Bond Market' },
      { symbol: 'VT', weight: 0.10, name: 'World Stock' },
    ],
    tags: ['風險平價', '全天候', '分散'],
  },
  {
    id: 'tech-focused',
    name: '科技股集中',
    description: '70% 科技股指數 + 30% 全市場，適合看好科技產業的積極投資者',
    category: '因子投資',
    holdings: [
      { symbol: 'QQQ', weight: 0.70, name: 'NASDAQ-100' },
      { symbol: 'VTI', weight: 0.30, name: 'Total Stock Market' },
    ],
    tags: ['科技', '積極', '成長'],
  },
  {
    id: 'global-diversified',
    name: '全球分散',
    description: '100% 全球股市，最簡單的全球化配置',
    category: '全球配置',
    holdings: [
      { symbol: 'VT', weight: 1.00, name: 'World Stock ETF' },
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
      { symbol: 'VTI', weight: 0.30, name: 'Total Stock Market' },
      { symbol: 'BND', weight: 0.20, name: 'Total Bond Market' },
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
      { symbol: 'VTI', weight: 0.40, name: 'Total Stock Market' },
      { symbol: 'BND', weight: 0.20, name: 'Total Bond Market' },
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
      { symbol: 'VTI', weight: 0.40, name: 'Total Stock Market' },
      { symbol: 'BND', weight: 0.20, name: 'Total Bond Market' },
    ],
    tags: ['動能', '因子', '趨勢'],
  },
  {
    id: 'three-fund',
    name: '三基金組合',
    description: '極簡主義配置，美股 + 國際股 + 債券，低費用率',
    category: '股債平衡',
    holdings: [
      { symbol: 'VTI', weight: 0.48, name: 'Total Stock Market' },
      { symbol: 'VXUS', weight: 0.24, name: 'International Stock' },
      { symbol: 'BND', weight: 0.28, name: 'Total Bond Market' },
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
