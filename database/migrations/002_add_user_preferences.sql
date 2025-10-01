-- Migration: 002_add_user_preferences
-- Description: Add notification preferences to profiles table
-- Date: 2025-09-26

-- Add notification_preferences column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
    "email_notifications": true,
    "shared_expense_alerts": true,
    "settlement_reminders": true,
    "timezone": "America/New_York"
}'::jsonb;

-- Create an index on the JSONB column for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_notification_preferences ON profiles USING gin(notification_preferences);

-- Update existing profiles to have default preferences if they don't already have them
UPDATE profiles
SET notification_preferences = '{
    "email_notifications": true,
    "shared_expense_alerts": true,
    "settlement_reminders": true,
    "timezone": "America/New_York"
}'::jsonb
WHERE notification_preferences IS NULL;