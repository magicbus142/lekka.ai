-- Add initial_stock column
ALTER TABLE products ADD COLUMN IF NOT EXISTS initial_stock INTEGER DEFAULT 0;

-- Backfill existing rows: set initial_stock to current stock
-- This serves as a baseline for existing data
UPDATE products SET initial_stock = stock WHERE initial_stock IS NULL OR initial_stock = 0;
