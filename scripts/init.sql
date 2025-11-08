-- Ensure the notifications table exists, and add missing columns if needed

-- Create table if it does not exist
CREATE TABLE IF NOT EXISTS notifications (
    notification_id SERIAL PRIMARY KEY,
    account_id INTEGER,
    amount NUMERIC(15,2),
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add 'event_type' column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns 
        WHERE table_name='notifications' 
          AND column_name='event_type'
    ) THEN
        ALTER TABLE notifications
        ADD COLUMN event_type VARCHAR(255);
    END IF;
END
$$;
