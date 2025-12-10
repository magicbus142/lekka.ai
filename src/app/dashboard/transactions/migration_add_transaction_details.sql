-- Add payment_method and payment_status columns
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS payment_method TEXT CHECK (payment_method IN ('Cash', 'UPI', 'Other')) DEFAULT 'Cash',
ADD COLUMN IF NOT EXISTS payment_status TEXT CHECK (payment_status IN ('Paid', 'Pending')) DEFAULT 'Paid';
