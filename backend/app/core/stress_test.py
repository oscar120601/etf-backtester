"""
壓力測試模組

模擬投資組合在歷史危機期間的表現，評估組合的韌性。
"""

from dataclasses import dataclass
from typing import Dict, List, Optional
from datetime import date, timedelta
from decimal import Decimal
import pandas as pd
import numpy as np
from sqlalchemy.orm import Session

from app.models.etf import ETFPrice


@dataclass
class CrisisScenario:
    """危機情境定義"""
    id: str
    name: str
    description: str
    start_date: date
    end_date: date
    benchmark_symbol: str = "SPY"  # 比較基準
    available: bool = True  # 是否可用（數據庫中有數據）


@dataclass
class StressTestResult:
    """壓力測試結果"""
    scenario: CrisisScenario
    portfolio_return: float
    benchmark_return: float
    excess_return: float  # 相對基準的超額報酬
    max_drawdown: float
    recovery_days: Optional[int]  # 恢復到危機前水準所需天數
    daily_returns: List[Dict]  # 每日報酬詳情


class StressTestEngine:
    """
    壓力測試引擎
    
    預設危機情境：
    - 2008 金融危機
    - 2020 疫情崩盤
    - 2022 通膨緊縮
    - 2022 債券熊市
    """
    
    # 預設危機情境
    DEFAULT_SCENARIOS: List[CrisisScenario] = [
        # 歷史情境（數據不可用，僅供參考）
        CrisisScenario(
            id="2008_financial_crisis",
            name="2008 金融危機",
            description="次貸危機、雷曼兄弟倒閉，全球金融市場崩盤",
            start_date=date(2007, 10, 1),
            end_date=date(2009, 3, 31),
            benchmark_symbol="SPY"
        ),
        # 可用情境（數據庫中 2020-2024）
        CrisisScenario(
            id="2020_covid_crash",
            name="2020 疫情崩盤",
            description="COVID-19 爆發，全球股市快速下跌後迅速反彈",
            start_date=date(2020, 2, 19),
            end_date=date(2020, 3, 23),
            benchmark_symbol="SPY"
        ),
        CrisisScenario(
            id="2020_covid_recovery",
            name="2020 疫情復甦",
            description="聯準會大規模 QE，股市從谷底強勁反彈",
            start_date=date(2020, 3, 23),
            end_date=date(2020, 12, 31),
            benchmark_symbol="SPY"
        ),
        CrisisScenario(
            id="2021_meme_stock",
            name="2021 散戶狂潮",
            description="GameStop 等迷因股引發市場劇烈波動，對沖基金軋空",
            start_date=date(2021, 1, 1),
            end_date=date(2021, 2, 28),
            benchmark_symbol="SPY"
        ),
        CrisisScenario(
            id="2021_growth_peak",
            name="2021 成長股高峰",
            description="科技股達到歷史高點，ARKK 等創新 ETF 瘋漲",
            start_date=date(2021, 1, 1),
            end_date=date(2021, 12, 31),
            benchmark_symbol="SPY"
        ),
        CrisisScenario(
            id="2022_inflation_crunch",
            name="2022 通膨緊縮",
            description="聯準會激進升息對抗通膨，股債雙殺",
            start_date=date(2022, 1, 1),
            end_date=date(2022, 10, 31),
            benchmark_symbol="SPY"
        ),
        CrisisScenario(
            id="2022_bear_market",
            name="2022 熊市",
            description="美國股市進入技術性熊市，科技股重創",
            start_date=date(2022, 1, 1),
            end_date=date(2022, 12, 31),
            benchmark_symbol="SPY"
        ),
        CrisisScenario(
            id="2023_banking_crisis",
            name="2023 銀行業危機",
            description="SVB 倒閉引發區域性銀行危機，市場短暫恐慌",
            start_date=date(2023, 3, 1),
            end_date=date(2023, 5, 1),
            benchmark_symbol="SPY"
        ),
        CrisisScenario(
            id="2023_ai_rally",
            name="2023 AI 狂潮",
            description="ChatGPT 引爆 AI 概念股瘋漲，科技股強劲反彈",
            start_date=date(2023, 1, 1),
            end_date=date(2023, 12, 31),
            benchmark_symbol="SPY"
        ),
    ]
    
    def __init__(self, db: Session):
        """
        初始化壓力測試引擎
        
        Args:
            db: 資料庫 Session
        """
        self.db = db
    
    def get_scenarios(self) -> List[CrisisScenario]:
        """
        取得所有可用的危機情境
        
        Returns:
            List[CrisisScenario]: 危機情境列表
        """
        return self.DEFAULT_SCENARIOS
    
    def run_stress_test(
        self,
        portfolio: Dict[str, float],  # {symbol: weight}
        scenario_id: Optional[str] = None,
        custom_scenario: Optional[CrisisScenario] = None
    ) -> StressTestResult:
        """
        執行單一情境壓力測試
        
        Args:
            portfolio: 投資組合 {symbol: weight}
            scenario_id: 預設情境 ID
            custom_scenario: 自定義情境（如果提供，優先使用）
            
        Returns:
            StressTestResult: 壓力測試結果
        """
        # 確定使用的情境
        if custom_scenario:
            scenario = custom_scenario
        elif scenario_id:
            scenario = next(
                (s for s in self.DEFAULT_SCENARIOS if s.id == scenario_id),
                None
            )
            if not scenario:
                raise ValueError(f"未知的情境 ID: {scenario_id}")
        else:
            raise ValueError("請提供 scenario_id 或 custom_scenario")
        
        # 獲取價格資料
        symbols = list(portfolio.keys())
        
        # 為了計算恢復時間，需要危機前後的資料
        extended_start = scenario.start_date - timedelta(days=30)
        extended_end = scenario.end_date + timedelta(days=365)  # 1年恢復期
        
        prices_df = self._fetch_prices(symbols + [scenario.benchmark_symbol], 
                                       extended_start, extended_end)
        
        if prices_df.empty:
            raise ValueError("無法獲取價格資料")
        
        # 計算組合價值
        portfolio_values = self._calculate_portfolio_value(prices_df, portfolio)
        benchmark_values = prices_df[scenario.benchmark_symbol]
        
        # 擷取危機期間的資料
        crisis_mask = (portfolio_values.index >= scenario.start_date) & \
                      (portfolio_values.index <= scenario.end_date)
        
        crisis_portfolio = portfolio_values[crisis_mask]
        crisis_benchmark = benchmark_values[crisis_mask]
        
        if len(crisis_portfolio) == 0:
            raise ValueError("危機期間無可用資料")
        
        # 計算報酬
        portfolio_start = crisis_portfolio.iloc[0]
        portfolio_end = crisis_portfolio.iloc[-1]
        portfolio_return = (portfolio_end / portfolio_start) - 1
        
        benchmark_start = crisis_benchmark.iloc[0]
        benchmark_end = crisis_benchmark.iloc[-1]
        benchmark_return = (benchmark_end / benchmark_start) - 1
        
        # 計算最大回撤
        max_drawdown = self._calculate_max_drawdown(crisis_portfolio)
        
        # 計算恢復時間
        recovery_days = self._calculate_recovery_days(
            portfolio_values, scenario.end_date, portfolio_start
        )
        
        # 計算每日報酬
        daily_returns = self._calculate_daily_returns(
            crisis_portfolio, crisis_benchmark, portfolio, scenario
        )
        
        return StressTestResult(
            scenario=scenario,
            portfolio_return=portfolio_return,
            benchmark_return=benchmark_return,
            excess_return=portfolio_return - benchmark_return,
            max_drawdown=max_drawdown,
            recovery_days=recovery_days,
            daily_returns=daily_returns
        )
    
    def run_all_scenarios(
        self,
        portfolio: Dict[str, float]
    ) -> List[StressTestResult]:
        """
        執行所有預設情境的壓力測試
        
        Args:
            portfolio: 投資組合
            
        Returns:
            List[StressTestResult]: 所有情境的測試結果
        """
        results = []
        
        for scenario in self.DEFAULT_SCENARIOS:
            try:
                result = self.run_stress_test(portfolio, scenario.id)
                results.append(result)
            except Exception as e:
                # 如果某個情境失敗，記錄錯誤但繼續
                print(f"情境 {scenario.name} 測試失敗: {e}")
                continue
        
        return results
    
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
    
    def _calculate_portfolio_value(
        self,
        prices_df: pd.DataFrame,
        portfolio: Dict[str, float]
    ) -> pd.Series:
        """
        計算投資組合價值
        
        Args:
            prices_df: 價格資料
            portfolio: 投資組合權重
            
        Returns:
            pd.Series: 組合價值
        """
        # 使用權重計算加權平均價格
        portfolio_value = pd.Series(0.0, index=prices_df.index)
        
        for symbol, weight in portfolio.items():
            if symbol in prices_df.columns:
                portfolio_value += prices_df[symbol] * weight
        
        return portfolio_value
    
    def _calculate_max_drawdown(self, values: pd.Series) -> float:
        """
        計算最大回撤
        
        Args:
            values: 價值序列
            
        Returns:
            float: 最大回撤（負數）
        """
        peak = values.expanding().max()
        drawdown = (values - peak) / peak
        return drawdown.min()
    
    def _calculate_recovery_days(
        self,
        portfolio_values: pd.Series,
        crisis_end: date,
        pre_crisis_value: float
    ) -> Optional[int]:
        """
        計算恢復到危機前水準所需天數
        
        Args:
            portfolio_values: 組合價值序列
            crisis_end: 危機結束日期
            pre_crisis_value: 危機前價值
            
        Returns:
            Optional[int]: 恢復天數，如果未恢復則返回 None
        """
        post_crisis = portfolio_values[portfolio_values.index > crisis_end]
        
        for i, value in enumerate(post_crisis):
            if value >= pre_crisis_value:
                return i
        
        return None  # 尚未恢復
    
    def _calculate_daily_returns(
        self,
        portfolio_values: pd.Series,
        benchmark_values: pd.Series,
        portfolio: Dict[str, float],
        scenario: CrisisScenario
    ) -> List[Dict]:
        """
        計算每日報酬詳情
        
        Args:
            portfolio_values: 組合價值
            benchmark_values: 基準價值
            portfolio: 投資組合
            scenario: 危機情境
            
        Returns:
            List[Dict]: 每日報酬
        """
        daily_returns = []
        
        portfolio_returns = portfolio_values.pct_change().dropna()
        benchmark_returns = benchmark_values.pct_change().dropna()
        
        for date in portfolio_returns.index:
            daily_returns.append({
                "date": date.isoformat(),
                "portfolio_return": round(portfolio_returns[date] * 100, 2),
                "benchmark_return": round(benchmark_returns[date] * 100, 2),
            })
        
        return daily_returns
    
    def get_summary(self, results: List[StressTestResult]) -> Dict:
        """
        取得壓力測試摘要
        
        Args:
            results: 測試結果列表
            
        Returns:
            Dict: 摘要資訊
        """
        if not results:
            return {"error": "無可用結果"}
        
        # 找出表現最好和最差的情境
        best_scenario = max(results, key=lambda r: r.portfolio_return)
        worst_scenario = min(results, key=lambda r: r.portfolio_return)
        
        # 計算平均表現
        avg_return = np.mean([r.portfolio_return for r in results])
        avg_excess = np.mean([r.excess_return for r in results])
        
        # 統計恢復時間
        recoveries = [r.recovery_days for r in results if r.recovery_days is not None]
        avg_recovery = np.mean(recoveries) if recoveries else None
        
        return {
            "total_scenarios": len(results),
            "best_scenario": {
                "id": best_scenario.scenario.id,
                "name": best_scenario.scenario.name,
                "return": round(best_scenario.portfolio_return * 100, 2),
            },
            "worst_scenario": {
                "id": worst_scenario.scenario.id,
                "name": worst_scenario.scenario.name,
                "return": round(worst_scenario.portfolio_return * 100, 2),
            },
            "average_return": round(avg_return * 100, 2),
            "average_excess_return": round(avg_excess * 100, 2),
            "average_recovery_days": round(avg_recovery, 0) if avg_recovery else None,
            "resilience_score": self._calculate_resilience_score(results),
        }
    
    def _calculate_resilience_score(self, results: List[StressTestResult]) -> Dict:
        """
        計算投資組合韌性分數
        
        Args:
            results: 測試結果
            
        Returns:
            Dict: 韌性評估
        """
        # 根據多個指標計算綜合韌性分數
        scores = []
        
        for result in results:
            score = 0
            
            # 報酬率評分（0-40分）
            if result.portfolio_return > 0:
                score += 40
            elif result.portfolio_return > -0.1:
                score += 30
            elif result.portfolio_return > -0.2:
                score += 20
            else:
                score += 10
            
            # 相對表現評分（0-30分）
            if result.excess_return > 0:
                score += 30
            elif result.excess_return > -0.05:
                score += 20
            else:
                score += 10
            
            # 最大回撤評分（0-30分）
            if result.max_drawdown > -0.1:
                score += 30
            elif result.max_drawdown > -0.2:
                score += 20
            else:
                score += 10
            
            scores.append(score)
        
        avg_score = np.mean(scores)
        
        if avg_score >= 80:
            rating = "極佳"
            description = "投資組合在歷史危機中表現優異，具有極強的韌性"
        elif avg_score >= 60:
            rating = "良好"
            description = "投資組合在大多數危機中表現穩健，具備良好的風險抵禦能力"
        elif avg_score >= 40:
            rating = "一般"
            description = "投資組合在某些危機中可能遭受較大損失，建議檢視資產配置"
        else:
            rating = "需關注"
            description = "投資組合在歷史危機中表現較弱，建議加強風險管理"
        
        return {
            "score": round(avg_score, 1),
            "rating": rating,
            "description": description,
            "max_possible": 100,
        }
