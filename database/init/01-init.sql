-- 資料庫初始化腳本
-- 建立必要的擴充功能

-- 啟用 UUID 擴充
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 啟用陣列操作
CREATE EXTENSION IF NOT EXISTS "intarray";

-- 建立更新時間戳函數
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
