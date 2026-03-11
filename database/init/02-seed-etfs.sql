-- ETF 種子資料
-- Phase 1: 初始 13 檔 ETF

INSERT INTO etf_master (
    symbol, name, name_zh, issuer, asset_class, asset_subclass, 
    factor_type, region, expense_ratio, inception_date, exchange, 
    currency, is_active, is_recommended, min_data_year, risk_level, tags
) VALUES 
-- 美股 ETF (7檔)
(
    'VTI', 'Vanguard Total Stock Market ETF', 'Vanguard 全市場股票 ETF',
    'Vanguard', 'Equity', 'US Total Market', NULL, 'US',
    0.0003, '2001-05-24', 'NYSE', 'USD', TRUE, TRUE, 2001, 4,
    ARRAY['broad-market', 'large-cap', 'mid-cap', 'small-cap']
),
(
    'VOO', 'Vanguard S&P 500 ETF', 'Vanguard S&P 500 ETF',
    'Vanguard', 'Equity', 'US Large Cap', NULL, 'US',
    0.0003, '2010-09-07', 'NYSE', 'USD', TRUE, TRUE, 2010, 4,
    ARRAY['large-cap', 'sp500', 'core-holding']
),
(
    'VUAA', 'Vanguard S&P 500 UCITS ETF (USD) Accumulating', 'Vanguard S&P 500 UCITS ETF (美元累積型)',
    'Vanguard', 'Equity', 'US Large Cap', NULL, 'US',
    0.0007, '2019-05-14', 'LSE', 'USD', TRUE, FALSE, 2019, 4,
    ARRAY['large-cap', 'sp500', 'accumulating', 'ucits']
),
(
    'QQQ', 'Invesco QQQ Trust', 'Invesco 納斯達克 100 ETF',
    'Invesco', 'Equity', 'US Large Cap', 'Growth', 'US',
    0.0020, '1999-03-10', 'NASDAQ', 'USD', TRUE, TRUE, 1999, 4,
    ARRAY['large-cap', 'growth', 'technology', 'nasdaq-100']
),
(
    'AVUV', 'Avantis U.S. Small Cap Value ETF', 'Avantis 美國小型價值股 ETF',
    'Avantis Investors', 'Equity', 'US Small Cap', 'Value', 'US',
    0.0025, '2019-09-24', 'NYSE', 'USD', TRUE, TRUE, 2019, 5,
    ARRAY['small-cap', 'value', 'factor']
),
(
    'QMOM', 'Alpha Architect U.S. Quantitative Momentum ETF', 'Alpha Architect 美國量化動能 ETF',
    'Alpha Architect', 'Equity', 'US Mid Cap', 'Momentum', 'US',
    0.0079, '2015-12-03', 'NYSE', 'USD', TRUE, FALSE, 2015, 5,
    ARRAY['mid-cap', 'momentum', 'factor', 'quantitative']
),
(
    'SCHD', 'Schwab US Dividend Equity ETF', 'Schwab 美國股息股票 ETF',
    'Charles Schwab', 'Equity', 'US Large Cap', 'Dividend', 'US',
    0.0006, '2011-10-20', 'NYSE', 'USD', TRUE, TRUE, 2011, 4,
    ARRAY['large-cap', 'dividend', 'quality']
),

-- 英股/歐股 ETF (4檔)
(
    'CNDX', 'iShares NASDAQ 100 UCITS ETF', 'iShares 納斯達克 100 UCITS ETF',
    'iShares', 'Equity', 'US Large Cap', 'Growth', 'US',
    0.0033, '2010-01-29', 'LSE', 'GBX', TRUE, FALSE, 2010, 4,
    ARRAY['large-cap', 'growth', 'technology', 'nasdaq-100', 'ucits', 'gbp']
),
(
    'EQQQ', 'Invesco EQQQ NASDAQ-100 UCITS ETF', 'Invesco EQQQ 納斯達克 100 UCITS ETF',
    'Invesco', 'Equity', 'US Large Cap', 'Growth', 'US',
    0.0030, '2000-01-14', 'LSE', 'EUR', TRUE, FALSE, 2000, 4,
    ARRAY['large-cap', 'growth', 'technology', 'nasdaq-100', 'ucits', 'eur']
),
(
    'AVWS', 'Avantis International Small Cap Value ETF', 'Avantis 國際小型價值股 ETF',
    'Avantis Investors', 'Equity', 'International Small Cap', 'Value', 'Developed',
    0.0036, '2019-09-24', 'NYSE', 'USD', TRUE, FALSE, 2019, 5,
    ARRAY['small-cap', 'value', 'international', 'factor']
),
(
    'IUMO', 'iShares MSCI USA Momentum Factor UCITS ETF', 'iShares MSCI 美國動能因子 UCITS ETF',
    'iShares', 'Equity', 'US Large Cap', 'Momentum', 'US',
    0.0020, '2015-01-29', 'LSE', 'USD', TRUE, FALSE, 2015, 4,
    ARRAY['large-cap', 'momentum', 'factor', 'ucits']
),

-- 國際股票 ETF (1檔)
(
    'VXUS', 'Vanguard Total International Stock ETF', 'Vanguard 國際股票 ETF',
    'Vanguard', 'Equity', 'International Total Market', NULL, 'International',
    0.0008, '2011-01-26', 'NASDAQ', 'USD', TRUE, TRUE, 2011, 4,
    ARRAY['international', 'developed', 'emerging', 'broad-market']
),

-- 債券 ETF (1檔)
(
    'BND', 'Vanguard Total Bond Market ETF', 'Vanguard 總體債券市場 ETF',
    'Vanguard', 'Fixed Income', 'US Aggregate Bond', NULL, 'US',
    0.0003, '2007-04-03', 'NASDAQ', 'USD', TRUE, TRUE, 2007, 2,
    ARRAY['bonds', 'investment-grade', 'aggregate', 'core-holding']
);

-- 確認資料已插入
SELECT symbol, name, expense_ratio FROM etf_master ORDER BY symbol;
