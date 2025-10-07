import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth-middleware';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * Get Account Sync Status
 * GET /api/dashboard/accounts-status
 *
 * Returns sync status for all user accounts including:
 * - Last sync timestamp
 * - Next scheduled sync
 * - Connection status
 * - Error states
 */
export async function GET(request: NextRequest) {
  try {
    const { user } = await authenticateRequest(request);

    // Fetch accounts with sync history
    const { data: accounts, error: accountsError } = await supabaseAdmin
      .from('financial_accounts')
      .select(`
        id,
        account_name,
        institution_name,
        account_type,
        connection_status,
        current_balance
      `)
      .eq('user_id', user.id)
      .order('account_name', { ascending: true });

    if (accountsError) {
      throw new Error(`Failed to fetch accounts: ${accountsError.message}`);
    }

    if (!accounts || accounts.length === 0) {
      return NextResponse.json({
        syncStatus: [],
        managedAccounts: [],
      });
    }

    // Build sync status response
    const syncStatus = accounts.map(account => ({
      accountId: account.id,
      accountName: account.account_name,
      lastSynced: null, // Field not available in DB
      nextSync: null, // Field not available in DB
      status: determineSyncStatus(account.connection_status, null),
      error: null,
    }));

    // Build managed accounts response
    const managedAccounts = accounts.map(account => ({
      id: account.id,
      accountName: account.account_name,
      accountType: account.account_type,
      institution: account.institution_name || 'Unknown',
      connectionStatus: account.connection_status as 'active' | 'expired' | 'error',
      currentBalance: account.current_balance || 0,
      currency: 'GBP', // Default to GBP
    }));

    return NextResponse.json({
      syncStatus,
      managedAccounts,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Failed to fetch accounts status:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch account status',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Calculate next sync time based on last sync and connection status
 */
function calculateNextSync(lastSyncedAt: string | null, connectionStatus: string): string | null {
  if (!lastSyncedAt || connectionStatus !== 'active') {
    return null;
  }

  // Default sync interval: 6 hours
  const SYNC_INTERVAL_HOURS = 6;
  const lastSync = new Date(lastSyncedAt);
  const nextSync = new Date(lastSync.getTime() + SYNC_INTERVAL_HOURS * 60 * 60 * 1000);

  return nextSync.toISOString();
}

/**
 * Determine sync status from connection status and errors
 */
function determineSyncStatus(connectionStatus: string, syncError: string | null): 'active' | 'syncing' | 'error' | 'pending' {
  if (syncError) {
    return 'error';
  }

  switch (connectionStatus) {
    case 'active':
      return 'active';
    case 'syncing':
      return 'syncing';
    case 'expired':
    case 'error':
      return 'error';
    default:
      return 'pending';
  }
}
