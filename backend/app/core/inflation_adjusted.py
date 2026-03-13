"""
通膨調整報酬計算模組

計算投資組合的實質報酬（通膨調整後報酬）。
"""

from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple
from datetime import date
import pandas as pd
import numpy as np
from sqlalchemy.orm import Session


@dataclass
class InflationData:
    """通膨數據"""
    date: date
    cpi_value: float
    inflation_rate: float  # 年化通膨率


@dataclass
class InflationAdjustedResult:
    """通膨調整結果"""
    nominal_return: float  # 名目報酬率
    real_return: float  # 實質報酬率
    inflation_rate: float  # 期間平均通膨率
    purchasing_power_change: float  # 購買力變化
    nominal_cagr: float
    real_cagr: float
    nominal_values: List[Dict]  # 名目價值時間序列
    real_values: List[Dict]  # 實質價值時間序列


class InflationAdjustedCalculator:
    """
    通膨調整計算器
    
    使用美國 CPI (消費者物價指數) 數據計算實質報酬。
    """
    
    # 美國 CPI 歷史數據 (年度平均)
    # 來源: U.S. Bureau of Labor Statistics
    HISTORICAL_CPI = {
        2000: 172.2,
        2001: 177.1,
        2002: 179.9,
        2003: 184.0,
        2004: 188.9,
        2005: 195.3,
        2006: 201.6,
        2007: 207.3,
        2008: 215.3,
        2009: 214.5,
        2010: 218.1,
        2011: 224.9,
        2012: 229.6,
        2013: 233.0,
        2014: 236.7,
        2015: 237.0,
        2016: 240.0,
        2017: 245.1,
        2018: 251.1,
        2019: 255.7,
        2020: 258.8,
        2021: 271.0,
        2022: 292.7,
        2023: 304.7,
        2024: 310.0,  # 預估值
        2025: 315.0,  # 預估值
    }
    
    def __init__(self, db: Session = None):
        """
        初始化計算器
        
        Args:
            db: 資料庫 Session（可選，目前使用內建 CPI 數據）
        """
        self.db = db
        self.cpi_data = self._load_cpi_data()
    
    def _load_cpi_data(self) -> pd.Series:
        """
        載入 CPI 數據
        
        Returns:
            pd.Series: CPI 時間序列
        """
        dates = []
        values = []
        
        for year, cpi in self.HISTORICAL_CPI.items():
            dates.append(date(year, 6, 15))  # 年中
            values.append(cpi)
        
        return pd.Series(values, index=pd.to_datetime(dates))
    
    def get_cpi_for_date(self, target_date: date) -> float:
        """
        取得指定日期的 CPI 值
        
        使用線性插值估算月度 CPI。
        
        Args:
            target_date: 目標日期
            
        Returns:
            float: CPI 值
        """
        year = target_date.year
        
        # 如果剛好有該年數據
        if year in self.HISTORICAL_CPI:
            base_cpi = self.HISTORICAL_CPI[year]
            
            # 簡單的月度調整（假設通膨在年內均勻分布）
            month_factor = (target_date.month - 1) / 12
            
            # 取得下一年 CPI 計算變化
            next_year = year + 1
            if next_year in self.HISTORICAL_CPI:
                yearly_change = self.HISTORICAL_CPI[next_year] - base_cpi
                return base_cpi + (yearly_change * month_factor)
            else:
                return base_cpi
        
        # 如果超出範圍，使用最近年份
        available_years = sorted(self.HISTORICAL_CPI.keys())
        if year < available_years[0]:
            return self.HISTORICAL_CPI[available_years[0]]
        else:
            return self.HISTORICAL_CPI[available_years[-1]]
    
    def calculate_inflation_rate(
        self,
        start_date: date,
        end_date: date
    ) -> float:
        """
        計算期間的年化通膨率
        
        Args:
            start_date: 開始日期
            end_date: 結束日期
            
        Returns:
            float: 年化通膨率
        """
        start_cpi = self.get_cpi_for_date(start_date)
        end_cpi = self.get_cpi_for_date(end_date)
        
        # 計算年數
        years = (end_date - start_date).days / 365.25
        
        if years <= 0:
            return 0
        
        # 年化通膨率
        inflation_rate = (end_cpi / start_cpi) ** (1 / years) - 1
        
        return inflation_rate
    
    def calculate(
        self,
        nominal_values: List[Tuple[date, float]],
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> InflationAdjustedResult:
        """
        計算通膨調整後的報酬
        
        Args:
            nominal_values: 名目價值時間序列 [(date, value), ...]
            start_date: 開始日期（如果為 None，使用第一筆資料）
            end_date: 結束日期（如果為 None，使用最後一筆資料）
            
        Returns:
            InflationAdjustedResult: 通膨調整結果
        """
        if not nominal_values:
            raise ValueError("請提供價值數據")
        
        # 確定日期範圍
        if start_date is None:
            start_date = nominal_values[0][0]
        if end_date is None:
            end_date = nominal_values[-1][0]
        
        # 取得起始和結束的 CPI
        start_cpi = self.get_cpi_for_date(start_date)
        end_cpi = self.get_cpi_for_date(end_date)
        
        # 計算名目報酬
        start_value = nominal_values[0][1]
        end_value = nominal_values[-1][1]
        
        nominal_return = (end_value / start_value) - 1
        
        # 計算期間年數
        years = (end_date - start_date).days / 365.25
        nominal_cagr = (end_value / start_value) ** (1 / years) - 1 if years > 0 else 0
        
        # 計算通膨率
        inflation_rate = self.calculate_inflation_rate(start_date, end_date)
        
        # 計算實質報酬 (Fisher Equation approximation)
        # (1 + nominal) = (1 + real) * (1 + inflation)
        # real = (1 + nominal) / (1 + inflation) - 1
        real_return = (1 + nominal_return) / (1 + inflation_rate) - 1
        real_cagr = (1 + nominal_cagr) / (1 + inflation_rate) - 1
        
        # 計算購買力變化
        purchasing_power_change = (end_value / end_cpi) / (start_value / start_cpi) - 1
        
        # 計算實質價值時間序列
        nominal_series = []
        real_series = []
        
        for date_val, nominal_val in nominal_values:
            cpi = self.get_cpi_for_date(date_val)
            real_val = nominal_val * (start_cpi / cpi)  # 調整到起始日期的購買力
            
            nominal_series.append({
                "date": date_val.isoformat(),
                "value": round(nominal_val, 2),
            })
            real_series.append({
                "date": date_val.isoformat(),
                "value": round(real_val, 2),
            })
        
        return InflationAdjustedResult(
            nominal_return=round(nominal_return, 4),
            real_return=round(real_return, 4),
            inflation_rate=round(inflation_rate, 4),
            purchasing_power_change=round(purchasing_power_change, 4),
            nominal_cagr=round(nominal_cagr, 4),
            real_cagr=round(real_cagr, 4),
            nominal_values=nominal_series,
            real_values=real_series
        )
    
    def get_inflation_summary(
        self,
        start_date: date,
        end_date: date
    ) -> Dict:
        """
        取得期間通膨摘要
        
        Args:
            start_date: 開始日期
            end_date: 結束日期
            
        Returns:
            Dict: 通膨摘要
        """
        start_cpi = self.get_cpi_for_date(start_date)
        end_cpi = self.get_cpi_for_date(end_date)
        inflation_rate = self.calculate_inflation_rate(start_date, end_date)
        
        # 取得期間內的年度通膨
        years = list(range(start_date.year, end_date.year + 1))
        yearly_inflation = []
        
        for year in years:
            if year in self.HISTORICAL_CPI and (year - 1) in self.HISTORICAL_CPI:
                cpi_current = self.HISTORICAL_CPI[year]
                cpi_previous = self.HISTORICAL_CPI[year - 1]
                inflation = (cpi_current / cpi_previous) - 1
                yearly_inflation.append({
                    "year": year,
                    "inflation_rate": round(inflation * 100, 2),
                    "cpi": cpi_current
                })
        
        # 判斷通膨環境
        if inflation_rate > 0.05:
            environment = "高通膨"
            description = "期間處於高通膨環境，實質報酬可能明顯低於名目報酬"
        elif inflation_rate > 0.02:
            environment = "溫和通膨"
            description = "期間通膨處於正常水平"
        else:
            environment = "低通膨"
            description = "期間通膨較低，名目報酬與實質報酬差異較小"
        
        return {
            "start_cpi": start_cpi,
            "end_cpi": end_cpi,
            "total_inflation": round((end_cpi / start_cpi - 1) * 100, 2),
            "annual_inflation_rate": round(inflation_rate * 100, 2),
            "environment": environment,
            "description": description,
            "yearly_breakdown": yearly_inflation,
            "data_source": "U.S. Bureau of Labor Statistics (CPI-U)",
        }
    
    def calculate_purchasing_power(
        self,
        initial_amount: float,
        years: int,
        inflation_rate: Optional[float] = None
    ) -> Dict:
        """
        計算購買力隨時間的變化
        
        Args:
            initial_amount: 初始金額
            years: 年數
            inflation_rate: 通膨率（如果為 None，使用歷史平均）
            
        Returns:
            Dict: 購買力預測
        """
        if inflation_rate is None:
            # 使用歷史平均通膨率（約 2.5%）
            inflation_rate = 0.025
        
        purchasing_power = []
        current_pp = initial_amount
        
        for year in range(years + 1):
            purchasing_power.append({
                "year": year,
                "nominal_value": round(initial_amount, 2),
                "real_value": round(current_pp, 2),
                "purchasing_power_pct": round((current_pp / initial_amount) * 100, 1)
            })
            current_pp = current_pp / (1 + inflation_rate)
        
        final_pp = purchasing_power[-1]["purchasing_power_pct"]
        
        return {
            "initial_amount": initial_amount,
            "years": years,
            "assumed_inflation": round(inflation_rate * 100, 2),
            "final_purchasing_power_pct": final_pp,
            "projected_data": purchasing_power,
            "interpretation": f"{years} 年後，{initial_amount:,.0f} 元的購買力將相當於現值的 {final_pp}%"
        }
