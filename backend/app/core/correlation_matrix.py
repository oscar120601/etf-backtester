"""
相關性矩陣計算模組

計算 ETF 之間的價格相關係數，並提供視覺化用的熱力圖數據。
"""

from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple
from datetime import date, timedelta
import numpy as np
import pandas as pd
from sqlalchemy.orm import Session

from app.models.etf import ETFPrice


@dataclass
class CorrelationResult:
    """相關性計算結果"""
    symbols: List[str]
    correlation_matrix: pd.DataFrame
    lookback_period: str


class CorrelationMatrixCalculator:
    """
    相關性矩陣計算器
    
    計算多個 ETF 之間的價格相關係數。
    """
    
    # 相關性強度分類
    CORRELATION_LEVELS = {
        "very_strong_positive": (0.8, 1.0, "極強正相關", "#d32f2f"),
        "strong_positive": (0.5, 0.8, "強正相關", "#f44336"),
        "weak_positive": (0.2, 0.5, "弱正相關", "#ff7043"),
        "none": (-0.2, 0.2, "無相關", "#ffffff"),
        "weak_negative": (-0.5, -0.2, "弱負相關", "#64b5f6"),
        "strong_negative": (-0.8, -0.5, "強負相關", "#1976d2"),
        "very_strong_negative": (-1.0, -0.8, "極強負相關", "#0d47a1"),
    }
    
    def __init__(self, db: Session):
        """
        初始化計算器
        
        Args:
            db: 資料庫 Session
        """
        self.db = db
    
    def calculate(
        self,
        symbols: List[str],
        lookback_years: int = 3,
        end_date: Optional[date] = None,
        method: str = "pearson"
    ) -> CorrelationResult:
        """
        計算相關性矩陣
        
        Args:
            symbols: ETF 代碼列表
            lookback_years: 回溯年數
            end_date: 結束日期（預設為今天）
            method: 相關性計算方法 (pearson/spearman/kendall)
            
        Returns:
            CorrelationResult: 相關性計算結果
        """
        if len(symbols) < 2:
            raise ValueError("至少需要 2 檔 ETF 才能計算相關性")
        
        if end_date is None:
            end_date = date.today()
        
        start_date = end_date - timedelta(days=365 * lookback_years)
        
        # 獲取價格資料
        prices_df = self._fetch_prices(symbols, start_date, end_date)
        
        if prices_df.empty:
            raise ValueError("無法獲取價格資料")
        
        # 計算日報酬率
        returns_df = prices_df.pct_change().dropna()
        
        # 計算相關性矩陣
        correlation_matrix = returns_df.corr(method=method)
        
        return CorrelationResult(
            symbols=symbols,
            correlation_matrix=correlation_matrix,
            lookback_period=f"{lookback_years} years"
        )
    
    def _fetch_prices(
        self,
        symbols: List[str],
        start_date: date,
        end_date: date
    ) -> pd.DataFrame:
        """
        獲取歷史價格
        
        Args:
            symbols: ETF 代碼列表
            start_date: 開始日期
            end_date: 結束日期
            
        Returns:
            pd.DataFrame: 價格資料
        """
        prices = self.db.query(ETFPrice).filter(
            ETFPrice.symbol.in_(symbols),
            ETFPrice.date >= start_date,
            ETFPrice.date <= end_date
        ).all()
        
        if not prices:
            return pd.DataFrame()
        
        # 轉換為 DataFrame
        data = []
        for price in prices:
            data.append({
                "date": price.date,
                "symbol": price.symbol,
                "price": float(price.adjusted_close)
            })
        
        df = pd.DataFrame(data)
        df = df.pivot(index="date", columns="symbol", values="price")
        df = df.sort_index()
        
        return df
    
    def get_heatmap_data(
        self,
        result: CorrelationResult
    ) -> Dict:
        """
        取得熱力圖數據
        
        Args:
            result: 相關性計算結果
            
        Returns:
            Dict: 熱力圖用數據
        """
        matrix = result.correlation_matrix
        symbols = result.symbols
        
        # 轉換為前端可用的格式
        heatmap_data = []
        
        for i, symbol1 in enumerate(symbols):
            for j, symbol2 in enumerate(symbols):
                correlation = matrix.loc[symbol1, symbol2]
                
                heatmap_data.append({
                    "x": symbol1,
                    "y": symbol2,
                    "value": round(correlation, 4),
                    "color": self._get_correlation_color(correlation),
                    "level": self._get_correlation_level(correlation)
                })
        
        return {
            "symbols": symbols,
            "data": heatmap_data,
            "matrix": matrix.round(4).to_dict(),
            "lookback_period": result.lookback_period
        }
    
    def get_summary(
        self,
        result: CorrelationResult
    ) -> Dict:
        """
        取得相關性摘要
        
        Args:
            result: 相關性計算結果
            
        Returns:
            Dict: 摘要資訊
        """
        matrix = result.correlation_matrix
        symbols = result.symbols
        
        # 提取上三角矩陣（避免重複）
        correlations = []
        
        for i in range(len(symbols)):
            for j in range(i + 1, len(symbols)):
                corr = matrix.iloc[i, j]
                correlations.append({
                    "pair": f"{symbols[i]} - {symbols[j]}",
                    "symbol1": symbols[i],
                    "symbol2": symbols[j],
                    "correlation": round(corr, 4),
                    "level": self._get_correlation_level(corr)
                })
        
        # 排序：從最高相關到最低
        correlations.sort(key=lambda x: abs(x["correlation"]), reverse=True)
        
        # 統計
        corr_values = [c["correlation"] for c in correlations]
        
        return {
            "total_pairs": len(correlations),
            "highest_correlation": correlations[0] if correlations else None,
            "lowest_correlation": correlations[-1] if correlations else None,
            "average_correlation": round(np.mean(corr_values), 4) if corr_values else 0,
            "correlations": correlations,
            "diversification_score": self._calculate_diversification_score(correlations)
        }
    
    def _get_correlation_color(self, correlation: float) -> str:
        """
        取得相關性對應的顏色
        
        Args:
            correlation: 相關係數
            
        Returns:
            str: 顏色代碼
        """
        for level, (min_val, max_val, _, color) in self.CORRELATION_LEVELS.items():
            if min_val <= correlation <= max_val:
                return color
        return "#9e9e9e"
    
    def _get_correlation_level(self, correlation: float) -> Dict:
        """
        取得相關性等級描述
        
        Args:
            correlation: 相關係數
            
        Returns:
            Dict: 等級資訊
        """
        for level, (min_val, max_val, description, color) in self.CORRELATION_LEVELS.items():
            if min_val <= correlation <= max_val:
                return {
                    "key": level,
                    "description": description,
                    "color": color,
                    "strength": abs(correlation)
                }
        return {
            "key": "unknown",
            "description": "未知",
            "color": "#9e9e9e",
            "strength": 0
        }
    
    def _calculate_diversification_score(
        self,
        correlations: List[Dict]
    ) -> Dict:
        """
        計算分散化分數
        
        分數越高表示分散化效果越好（相關性越低）
        
        Args:
            correlations: 相關性列表
            
        Returns:
            Dict: 分散化評估
        """
        if not correlations:
            return {"score": 0, "rating": "N/A", "description": "無法計算"}
        
        corr_values = [abs(c["correlation"]) for c in correlations]
        avg_correlation = np.mean(corr_values)
        
        # 分散化分數 (0-100)
        # 平均相關性越低，分數越高
        score = int((1 - avg_correlation) * 100)
        
        # 評級
        if score >= 80:
            rating = "優秀"
            description = "投資組合分散化效果極佳"
        elif score >= 60:
            rating = "良好"
            description = "投資組合有適當的分散化"
        elif score >= 40:
            rating = "一般"
            description = "分散化效果尚可，可考慮加入更多低相關資產"
        else:
            rating = "需改進"
            description = "資產間相關性過高，建議加入不同類別的資產"
        
        return {
            "score": score,
            "rating": rating,
            "description": description,
            "average_correlation": round(avg_correlation, 4)
        }
    
    def find_diversification_opportunities(
        self,
        result: CorrelationResult,
        all_etfs: List[str],
        top_n: int = 5
    ) -> List[Dict]:
        """
        尋找分散化機會
        
        找出與現有投資組合相關性最低的 ETF，作為分散化建議。
        
        Args:
            result: 相關性計算結果
            all_etfs: 所有可用 ETF 列表
            top_n: 返回建議數量
            
        Returns:
            List[Dict]: 分散化建議
        """
        current_symbols = result.symbols
        matrix = result.correlation_matrix
        
        # 計算每個 ETF 與現有組合的平均相關性
        avg_correlations = []
        
        for symbol in current_symbols:
            if symbol in matrix.columns:
                # 計算該 ETF 與其他 ETF 的平均相關性
                other_symbols = [s for s in current_symbols if s != symbol]
                if other_symbols:
                    avg_corr = matrix.loc[symbol, other_symbols].mean()
                    avg_correlations.append({
                        "symbol": symbol,
                        "avg_correlation_with_others": round(avg_corr, 4)
                    })
        
        # 按相關性排序（越低越好）
        avg_correlations.sort(key=lambda x: x["avg_correlation_with_others"])
        
        return avg_correlations[:top_n]
