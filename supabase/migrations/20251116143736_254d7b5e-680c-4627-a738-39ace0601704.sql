-- Add welfare_message column to duty_rosters table
ALTER TABLE duty_rosters ADD COLUMN IF NOT EXISTS welfare_message TEXT;