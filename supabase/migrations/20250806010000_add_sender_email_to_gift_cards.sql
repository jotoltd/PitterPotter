-- Add sender_email column to gift_cards table
ALTER TABLE gift_cards ADD COLUMN IF NOT EXISTS sender_email TEXT;
