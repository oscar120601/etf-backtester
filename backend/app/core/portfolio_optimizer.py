"""
投資組合優化器

基於現代投資組合理論 (Modern Portfolio Theory, MPT) 的投資組合優化模組。
使用 scipy.optimize 求解效率前緣和最佳組合配置。

參考:
- Markowitz, H. (1952). Portfolio Selection
- Sharpe, W. (1964). Capital Asset Prices
"""

from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple
from datetime import date, timedelta
import numpy as np
import pandas as pd
from scipy import optimize
from sqlalchemy.orm import Session

from app.models.etf import ETFPrice


@dataclass
class OptimizationResult:
    """優化結果"""
    weights: Dict[str, float]           # 最佳權重配置
    expected_return: float              # 預期年化報酬率
    volatility: float                   # 預期年化波動率
    sharpe_ratio: float                 # 夏普比率
    objective: str                      # 優化目標


@dataclass
class EfficientFrontierPoint:
    """效率前緣上的點"""
    volatility: float                   # 波動率 (x軸)
    expected_return: float              # 預期報酬 (y軸)
    sharpe_ratio: float                 # 夏普比率
    weights: Dict[str, float]           # 權重配置


class PortfolioOptimizer:
    """
    投資組合優化器
    
    基於歷史資料計算效率前緣，並找出最佳投資組合配置。
    """
    
    def __init__(self, db: Session):
        """
        初始化優化器
        
        Args:
            db: 資料庫 Session
        """
        self.db = db
        self.returns_df = None
        self.symbols = None
        self.mean_returns = None
        self.cov_matrix = None
        self.risk_free_rate = 0.045  # 預設無風險利率 4.5%
    
    def load_historical_data(
        self,
        symbols: List[str],
        lookback_years: int = 5,
        end_date: Optional[date] = None
    ) -> None:
        """
        載入歷史價格資料
        
        Args:
            symbols: ETF 代碼列表
            lookback_years: 回溯年數
            end_date: 結束日期（預設為今天）
        """
        if end_date is None:
            end_date = date.today()
        
        start_date = end_date - timedelta(days=365 * lookback_years)
        
        # 查詢資料庫
        prices = self.db.query(ETFPrice).filter(
            ETFPrice.symbol.in_(symbols),
            ETFPrice.date >= start_date,
            ETFPrice.date <= end_date
        ).all()
        
        if not prices:
            raise ValueError("無法獲取歷史價格資料")
        
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
        
        # 計算日報酬率
        self.returns_df = df.pct_change().dropna()
        self.symbols = symbols
        
        # 計算年化報酬率和共變異數矩陣
        trading_days = 252
        self.mean_returns = self.returns_df.mean() * trading_days
        self.cov_matrix = self.returns_df.cov() * trading_days
    
    def calculate_portfolio_performance(
        self,
        weights: np.ndarray
    ) -> Tuple[float, float]:
        """
        計算投資組合的績效
        
        Args:
            weights: 權重陣列
            
        Returns:
            Tuple[預期報酬率, 波動率]
        """
        weights = np.array(weights)
        expected_return = np.sum(self.mean_returns * weights)
        volatility = np.sqrt(np.dot(weights.T, np.dot(self.cov_matrix, weights)))
        return expected_return, volatility
    
    def negative_sharpe_ratio(self, weights: np.ndarray) -> float:
        """
        計算負夏普比率（用於最小化）
        
        Args:
            weights: 權重陣列
            
        Returns:
            負夏普比率
        """
        expected_return, volatility = self.calculate_portfolio_performance(weights)
        if volatility == 0:
            return 0
        return -(expected_return - self.risk_free_rate) / volatility
    
    def portfolio_volatility(self, weights: np.ndarray) -> float:
        """
        計算投資組合波動率
        
        Args:
            weights: 權重陣列
            
        Returns:
            波動率
        """
        return self.calculate_portfolio_performance(weights)[1]
    
    def optimize_max_sharpe(
        self,
        weight_constraints: Optional[Dict] = None
    ) -> OptimizationResult:
        """
        優化最大夏普比率
        
        找出夏普比率最高的投資組合配置。
        
        Args:
            weight_constraints: 權重限制，例如 {"min": 0.05, "max": 0.40}
            
        Returns:
            OptimizationResult: 優化結果
        """
        if weight_constraints is None:
            weight_constraints = {"min": 0.0, "max": 1.0}
        
        min_weight = weight_constraints.get("min", 0.0)
        max_weight = weight_constraints.get("max", 1.0)
        
        num_assets = len(self.symbols)
        
        # 初始權重：均等配置
        initial_weights = np.array([1.0 / num_assets] * num_assets)
        
        # 限制條件
        constraints = ({"type": "eq", "fun": lambda x: np.sum(x) - 1})  # 權重總和為 1
        
        # 權重範圍
        bounds = tuple((min_weight, max_weight) for _ in range(num_assets))
        
        # 執行優化
        result = optimize.minimize(
            self.negative_sharpe_ratio,
            initial_weights,
            method="SLSQP",
            bounds=bounds,
            constraints=constraints
        )
        
        if not result.success:
            raise ValueError(f"優化失敗: {result.message}")
        
        # 計算結果績效
        optimal_weights = result.x
        expected_return, volatility = self.calculate_portfolio_performance(optimal_weights)
        sharpe_ratio = (expected_return - self.risk_free_rate) / volatility if volatility > 0 else 0
        
        return OptimizationResult(
            weights=dict(zip(self.symbols, optimal_weights.round(4))),
            expected_return=round(expected_return, 4),
            volatility=round(volatility, 4),
            sharpe_ratio=round(sharpe_ratio, 4),
            objective="max_sharpe"
        )
    
    def optimize_min_volatility(
        self,
        target_return: Optional[float] = None,
        weight_constraints: Optional[Dict] = None
    ) -> OptimizationResult:
        """
        優化最小波動率
        
        找出波動率最低的投資組合配置。
        可選擇給定目標報酬率限制。
        
        Args:
            target_return: 目標報酬率（可選）
            weight_constraints: 權重限制
            
        Returns:
            OptimizationResult: 優化結果
        """
        if weight_constraints is None:
            weight_constraints = {"min": 0.0, "max": 1.0}
        
        min_weight = weight_constraints.get("min", 0.0)
        max_weight = weight_constraints.get("max", 1.0)
        
        num_assets = len(self.symbols)
        initial_weights = np.array([1.0 / num_assets] * num_assets)
        
        # 限制條件
        constraints = [{"type": "eq", "fun": lambda x: np.sum(x) - 1}]
        
        # 如果有目標報酬率，加入限制
        if target_return is not None:
            constraints.append({
                "type": "eq",
                "fun": lambda x: np.sum(self.mean_returns * x) - target_return
            })
        
        bounds = tuple((min_weight, max_weight) for _ in range(num_assets))
        
        # 執行優化
        result = optimize.minimize(
            self.portfolio_volatility,
            initial_weights,
            method="SLSQP",
            bounds=bounds,
            constraints=constraints
        )
        
        if not result.success:
            raise ValueError(f"優化失敗: {result.message}")
        
        optimal_weights = result.x
        expected_return, volatility = self.calculate_portfolio_performance(optimal_weights)
        sharpe_ratio = (expected_return - self.risk_free_rate) / volatility if volatility > 0 else 0
        
        return OptimizationResult(
            weights=dict(zip(self.symbols, optimal_weights.round(4))),
            expected_return=round(expected_return, 4),
            volatility=round(volatility, 4),
            sharpe_ratio=round(sharpe_ratio, 4),
            objective="min_volatility" if target_return is None else "target_return"
        )
    
    def calculate_efficient_frontier(
        self,
        num_portfolios: int = 100,
        weight_constraints: Optional[Dict] = None
    ) -> List[EfficientFrontierPoint]:
        """
        計算效率前緣
        
        生成效率前緣曲線上的多個投資組合點。
        
        Args:
            num_portfolios: 效率前緣上的點數量
            weight_constraints: 權重限制
            
        Returns:
            List[EfficientFrontierPoint]: 效率前緣點列表
        """
        if weight_constraints is None:
            weight_constraints = {"min": 0.0, "max": 1.0}
        
        min_weight = weight_constraints.get("min", 0.0)
        max_weight = weight_constraints.get("max", 1.0)
        
        # 先找出最小風險組合
        min_vol_result = self.optimize_min_volatility(weight_constraints=weight_constraints)
        min_return = min_vol_result.expected_return
        
        # 找出最大報酬（單一資產最大報酬）
        max_return = self.mean_returns.max()
        
        # 在目標報酬範圍內生成多個點
        target_returns = np.linspace(min_return, max_return, num_portfolios)
        
        efficient_portfolios = []
        
        for target in target_returns:
            try:
                result = self.optimize_min_volatility(
                    target_return=target,
                    weight_constraints=weight_constraints
                )
                
                efficient_portfolios.append(EfficientFrontierPoint(
                    volatility=result.volatility,
                    expected_return=result.expected_return,
                    sharpe_ratio=result.sharpe_ratio,
                    weights=result.weights
                ))
            except:
                # 如果某個目標報酬無法達成，跳過
                continue
        
        # 按波動率排序
        efficient_portfolios.sort(key=lambda x: x.volatility)
        
        return efficient_portfolios
    
    def get_optimization_summary(
        self,
        weight_constraints: Optional[Dict] = None
    ) -> Dict:
        """
        取得優化摘要
        
        計算多種優化目標的結果，供用戶選擇。
        
        Args:
            weight_constraints: 權重限制
            
        Returns:
            Dict: 包含多種優化結果的摘要
        """
        results = {}
        
        # 1. 最大夏普比率組合
        try:
            max_sharpe = self.optimize_max_sharpe(weight_constraints)
            results["max_sharpe"] = {
                "name": "最大夏普比率組合",
                "description": "風險調整後報酬最高的組合",
                "weights": max_sharpe.weights,
                "expected_return": max_sharpe.expected_return,
                "volatility": max_sharpe.volatility,
                "sharpe_ratio": max_sharpe.sharpe_ratio,
            }
        except Exception as e:
            results["max_sharpe"] = {"error": str(e)}
        
        # 2. 最小波動率組合
        try:
            min_vol = self.optimize_min_volatility(weight_constraints)
            results["min_volatility"] = {
                "name": "最小風險組合",
                "description": "波動率最低的組合",
                "weights": min_vol.weights,
                "expected_return": min_vol.expected_return,
                "volatility": min_vol.volatility,
                "sharpe_ratio": min_vol.sharpe_ratio,
            }
        except Exception as e:
            results["min_volatility"] = {"error": str(e)}
        
        # 3. 效率前緣
        try:
            frontier = self.calculate_efficient_frontier(
                num_portfolios=50,
                weight_constraints=weight_constraints
            )
            results["efficient_frontier"] = [
                {
                    "volatility": p.volatility,
                    "expected_return": p.expected_return,
                    "sharpe_ratio": p.sharpe_ratio,
                }
                for p in frontier
            ]
        except Exception as e:
            results["efficient_frontier"] = {"error": str(e)}
        
        # 4. 單一資產資訊（作為參考）
        results["individual_assets"] = []
        for symbol in self.symbols:
            ret = self.mean_returns[symbol]
            vol = np.sqrt(self.cov_matrix.loc[symbol, symbol])
            sharpe = (ret - self.risk_free_rate) / vol if vol > 0 else 0
            
            results["individual_assets"].append({
                "symbol": symbol,
                "expected_return": round(ret, 4),
                "volatility": round(vol, 4),
                "sharpe_ratio": round(sharpe, 4),
            })
        
        # 5. 元數據
        results["metadata"] = {
            "risk_free_rate": self.risk_free_rate,
            "symbols": self.symbols,
            "lookback_period": "5 years",
            "optimization_method": "SLSQP",
        }
        
        return results
