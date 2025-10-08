-- Migration: 004_household_invitations
-- Description: Create household_invitations table for invitation system
-- Date: 2025-10-07

-- Create household_invitations table
CREATE TABLE IF NOT EXISTS household_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID REFERENCES households(id) ON DELETE CASCADE NOT NULL,
    invited_by UUID REFERENCES auth.users(id) NOT NULL,
    email TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
    resend_count INTEGER NOT NULL DEFAULT 0 CHECK (resend_count <= 3),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE household_invitations ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_household_invitations_household_id ON household_invitations(household_id);
CREATE INDEX IF NOT EXISTS idx_household_invitations_token ON household_invitations(token);
CREATE INDEX IF NOT EXISTS idx_household_invitations_email ON household_invitations(email);
CREATE INDEX IF NOT EXISTS idx_household_invitations_status ON household_invitations(status);

-- Add RLS policies for household_invitations
-- Policy 1: Users can view invitations for households they are members of
CREATE POLICY "Users can view invitations for their households"
    ON household_invitations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM household_members
            WHERE household_members.household_id = household_invitations.household_id
            AND household_members.user_id = auth.uid()
        )
    );

-- Policy 2: Users can view invitations sent to their email
CREATE POLICY "Users can view invitations sent to their email"
    ON household_invitations FOR SELECT
    USING (
        email = (SELECT email FROM profiles WHERE id = auth.uid())
    );

-- Policy 3: Household members can create invitations
CREATE POLICY "Household members can create invitations"
    ON household_invitations FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM household_members
            WHERE household_members.household_id = household_invitations.household_id
            AND household_members.user_id = auth.uid()
        )
    );

-- Policy 4: Invited users can update their invitation status
CREATE POLICY "Invited users can update their invitation"
    ON household_invitations FOR UPDATE
    USING (
        email = (SELECT email FROM profiles WHERE id = auth.uid())
        OR EXISTS (
            SELECT 1 FROM household_members
            WHERE household_members.household_id = household_invitations.household_id
            AND household_members.user_id = auth.uid()
        )
    );
