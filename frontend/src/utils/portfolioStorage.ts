/**
 * 投資組合本地儲存工具
 * 使用 localStorage 儲存和載入投資組合配置
 */

import { PortfolioTemplate } from '../data/portfolioTemplates';

const STORAGE_KEY = 'etf_backtest_saved_portfolios';

export interface SavedPortfolio {
  id: string;
  name: string;
  description?: string;
  holdings: Array<{ symbol: string; weight: number }>;
  createdAt: string;
  updatedAt: string;
}

/**
 * 獲取所有儲存的投資組合
 */
export const getSavedPortfolios = (): SavedPortfolio[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to load saved portfolios:', error);
    return [];
  }
};

/**
 * 儲存投資組合
 */
export const savePortfolio = (
  name: string,
  holdings: Array<{ symbol: string; weight: number }>,
  description?: string
): SavedPortfolio => {
  const portfolios = getSavedPortfolios();
  
  const newPortfolio: SavedPortfolio = {
    id: `portfolio_${Date.now()}`,
    name,
    description,
    holdings,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  portfolios.push(newPortfolio);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(portfolios));
  
  return newPortfolio;
};

/**
 * 更新投資組合
 */
export const updatePortfolio = (
  id: string,
  updates: Partial<Omit<SavedPortfolio, 'id' | 'createdAt'>>
): SavedPortfolio | null => {
  const portfolios = getSavedPortfolios();
  const index = portfolios.findIndex((p) => p.id === id);
  
  if (index === -1) return null;
  
  portfolios[index] = {
    ...portfolios[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(portfolios));
  return portfolios[index];
};

/**
 * 刪除投資組合
 */
export const deletePortfolio = (id: string): boolean => {
  const portfolios = getSavedPortfolios();
  const filtered = portfolios.filter((p) => p.id !== id);
  
  if (filtered.length === portfolios.length) return false;
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return true;
};

/**
 * 根據 ID 獲取投資組合
 */
export const getPortfolioById = (id: string): SavedPortfolio | null => {
  const portfolios = getSavedPortfolios();
  return portfolios.find((p) => p.id === id) || null;
};

/**
 * 匯出所有投資組合為 JSON
 */
export const exportPortfoliosToJSON = (): string => {
  const portfolios = getSavedPortfolios();
  return JSON.stringify(portfolios, null, 2);
};

/**
 * 從 JSON 匯入投資組合
 */
export const importPortfoliosFromJSON = (jsonString: string): boolean => {
  try {
    const portfolios: SavedPortfolio[] = JSON.parse(jsonString);
    if (!Array.isArray(portfolios)) return false;
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(portfolios));
    return true;
  } catch (error) {
    console.error('Failed to import portfolios:', error);
    return false;
  }
};

/**
 * 將儲存的投資組合轉換為模板格式
 */
export const convertToTemplate = (portfolio: SavedPortfolio): PortfolioTemplate => {
  return {
    id: portfolio.id,
    name: portfolio.name,
    description: portfolio.description || '',
    category: '經典' as const,
    tags: ['custom'],
    holdings: portfolio.holdings.map(h => ({ ...h, name: h.symbol })),
  };
};

/**
 * 清除所有儲存的投資組合
 */
export const clearAllPortfolios = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

/**
 * 獲取投資組合數量
 */
export const getPortfolioCount = (): number => {
  return getSavedPortfolios().length;
};
