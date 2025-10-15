-- Migration: 013_notifications_system.sql
-- Description: Create notifications and notification_preferences tables for household notification system
-- Story: 3.4 Household Notification System
-- Date: 2025-10-13

-- =====================================================
-- Table: notifications
-- Purpose: Store in-app notifications for household members
-- =====================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('transaction_shared', 'large_transaction', 'member_joined', 'member_left')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE NOT NULL,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_read BOOLEAN DEFAULT false NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE
);

-- Add indexes for efficient notification queries
CREATE INDEX idx_notifications_recipient_unread ON public.notifications(recipient_id, is_read, created_at DESC);
CREATE INDEX idx_notifications_household ON public.notifications(household_id, created_at DESC);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- Add comment
COMMENT ON TABLE public.notifications IS 'In-app notifications for household members about financial activity';

-- =====================================================
-- Table: notification_preferences
-- Purpose: Store user notification preferences per household
-- =====================================================

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE NOT NULL,
  email_notifications BOOLEAN DEFAULT true NOT NULL,
  in_app_notifications BOOLEAN DEFAULT true NOT NULL,
  large_transaction_threshold DECIMAL(10,2) DEFAULT 100.00 NOT NULL,
  weekly_digest_enabled BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,

  -- Ensure one preference record per user per household
  UNIQUE(user_id, household_id)
);

-- Add index for efficient preference lookups
CREATE INDEX idx_notification_preferences_user_household ON public.notification_preferences(user_id, household_id);

-- Add comment
COMMENT ON TABLE public.notification_preferences IS 'User notification preferences for each household they belong to';

-- =====================================================
-- RLS Policies for notifications
-- =====================================================

-- Enable RLS on notifications table
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (recipient_id = auth.uid());

-- Policy: Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
TO authenticated
USING (recipient_id = auth.uid())
WITH CHECK (recipient_id = auth.uid());

-- Policy: Allow system to insert notifications for household members
-- Note: This policy allows authenticated users to create notifications
-- The notification-service.ts will handle authorization checks
CREATE POLICY "Allow creating notifications for household members"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM household_members
    WHERE household_members.household_id = notifications.household_id
    AND household_members.user_id = auth.uid()
  )
);

-- =====================================================
-- RLS Policies for notification_preferences
-- =====================================================

-- Enable RLS on notification_preferences table
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own notification preferences
CREATE POLICY "Users can view their own notification preferences"
ON public.notification_preferences
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy: Users can insert their own notification preferences
CREATE POLICY "Users can insert their own notification preferences"
ON public.notification_preferences
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Policy: Users can update their own notification preferences
CREATE POLICY "Users can update their own notification preferences"
ON public.notification_preferences
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- =====================================================
-- Function: Update updated_at timestamp automatically
-- =====================================================

CREATE OR REPLACE FUNCTION update_notification_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER trigger_update_notification_preferences_updated_at
BEFORE UPDATE ON public.notification_preferences
FOR EACH ROW
EXECUTE FUNCTION update_notification_preferences_updated_at();

-- =====================================================
-- Grant permissions
-- =====================================================

-- Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.notification_preferences TO authenticated;
