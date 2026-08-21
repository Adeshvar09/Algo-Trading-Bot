-- ==================================================
-- ALGO TRADING BOT - DATABASE SCHEMA & SYNTHETIC SEED DATA
-- Database: PostgreSQL
-- ==================================================

-- Drop existing tables if re-initialising
DROP TABLE IF EXISTS chat_history CASCADE;
DROP TABLE IF EXISTS algorithm_signals CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS portfolio CASCADE;
DROP TABLE IF EXISTS watchlist CASCADE;
DROP TABLE IF EXISTS stock_prices CASCADE;
DROP TABLE IF EXISTS stocks CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    virtual_balance NUMERIC(15, 2) NOT NULL DEFAULT 1000000.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Stocks Table
CREATE TABLE stocks (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    sector VARCHAR(50) NOT NULL,
    current_price NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Stock Prices (Historical Data)
CREATE TABLE stock_prices (
    id SERIAL PRIMARY KEY,
    stock_id INTEGER REFERENCES stocks(id) ON DELETE CASCADE,
    symbol VARCHAR(20) NOT NULL,
    open_price NUMERIC(10, 2) NOT NULL,
    high_price NUMERIC(10, 2) NOT NULL,
    low_price NUMERIC(10, 2) NOT NULL,
    close_price NUMERIC(10, 2) NOT NULL,
    volume BIGINT NOT NULL,
    price_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_stock_date UNIQUE(symbol, price_date)
);

-- 4. Watchlist Table
CREATE TABLE watchlist (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    stock_id INTEGER REFERENCES stocks(id) ON DELETE CASCADE,
    symbol VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_watchlist UNIQUE(user_id, stock_id)
);

-- 5. Portfolio Table
CREATE TABLE portfolio (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    stock_id INTEGER REFERENCES stocks(id) ON DELETE CASCADE,
    symbol VARCHAR(20) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity >= 0),
    average_price NUMERIC(10, 2) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_portfolio UNIQUE(user_id, stock_id)
);

-- 6. Orders Table
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    stock_id INTEGER REFERENCES stocks(id) ON DELETE CASCADE,
    symbol VARCHAR(20) NOT NULL,
    order_type VARCHAR(10) NOT NULL CHECK (order_type IN ('BUY', 'SELL')),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price NUMERIC(10, 2) NOT NULL,
    total_amount NUMERIC(15, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Transactions Table
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    stock_id INTEGER REFERENCES stocks(id) ON DELETE CASCADE,
    symbol VARCHAR(20) NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('BUY', 'SELL')),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price NUMERIC(10, 2) NOT NULL,
    total_amount NUMERIC(15, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Algorithm Signals Table
CREATE TABLE algorithm_signals (
    id SERIAL PRIMARY KEY,
    stock_id INTEGER REFERENCES stocks(id) ON DELETE CASCADE,
    symbol VARCHAR(20) NOT NULL,
    signal VARCHAR(10) NOT NULL CHECK (signal IN ('BUY', 'HOLD', 'SELL')),
    score INTEGER NOT NULL,
    confidence NUMERIC(5, 2) NOT NULL,
    reasons TEXT[] NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Chat History Table
CREATE TABLE chat_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    response TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==================================================
-- SEED DATA
-- ==================================================

-- Insert Default Demo User (Starting balance: ₹10,00,000)
INSERT INTO users (id, name, email, virtual_balance)
VALUES (1, 'Demo Trader', 'trader@algotrading.com', 1000000.00);

-- Insert 5 Synthetic Stocks
INSERT INTO stocks (id, symbol, name, sector, current_price) VALUES
(1, 'TCS', 'Tata Consultancy Services', 'Information Technology', 3850.50),
(2, 'INFY', 'Infosys Limited', 'Information Technology', 1540.25),
(3, 'RELIANCE', 'Reliance Industries Ltd', 'Energy & Conglomerate', 2920.00),
(4, 'HDFCBANK', 'HDFC Bank Limited', 'Banking & Finance', 1680.75),
(5, 'WIPRO', 'Wipro Limited', 'Information Technology', 495.10);

-- Function to populate 60 days of synthetic price data dynamically
DO $$
DECLARE
    rec RECORD;
    d_offset INT;
    p_date DATE;
    base_p NUMERIC;
    curr_p NUMERIC;
    open_p NUMERIC;
    high_p NUMERIC;
    low_p NUMERIC;
    close_p NUMERIC;
    vol BIGINT;
    rand_change NUMERIC;
BEGIN
    FOR rec IN SELECT id, symbol, current_price FROM stocks LOOP
        curr_p := rec.current_price * 0.85; -- Start 60 days ago at ~85% of current price
        
        FOR d_offset IN REVERSE 60..0 LOOP
            p_date := CURRENT_DATE - d_offset;
            
            -- Deterministic pseudo-random variation based on offset and stock id
            rand_change := (SIN(d_offset * 0.4 + rec.id * 1.5) * 1.8 + COS(d_offset * 0.2) * 1.2 + 0.3);
            
            open_p := ROUND(curr_p::numeric, 2);
            close_p := ROUND((curr_p * (1 + rand_change / 100.0))::numeric, 2);
            
            IF open_p < close_p THEN
                low_p := ROUND((open_p * (1 - (ABS(SIN(d_offset)) * 0.008)))::numeric, 2);
                high_p := ROUND((close_p * (1 + (ABS(COS(d_offset)) * 0.012)))::numeric, 2);

            ELSE
                low_p := ROUND((close_p * (1 - (ABS(SIN(d_offset)) * 0.012)))::numeric, 2);
                high_p := ROUND((open_p * (1 + (ABS(COS(d_offset)) * 0.008)))::numeric, 2);
            END IF;
            
            vol := CAST(1000000 + (ABS(SIN(d_offset + rec.id)) * 2500000) AS BIGINT);
            
            INSERT INTO stock_prices (stock_id, symbol, open_price, high_price, low_price, close_price, volume, price_date)
            VALUES (rec.id, rec.symbol, open_p, high_p, low_p, close_p, vol, p_date)
            ON CONFLICT (symbol, price_date) DO UPDATE 
            SET open_price = EXCLUDED.open_price,
                high_price = EXCLUDED.high_price,
                low_price = EXCLUDED.low_price,
                close_price = EXCLUDED.close_price,
                volume = EXCLUDED.volume;
                
            curr_p := close_p;
        END LOOP;
        
        -- Update stock current_price to match the latest close_price
        UPDATE stocks SET current_price = close_p WHERE id = rec.id;
    END LOOP;
END $$;
