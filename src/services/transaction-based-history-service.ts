/**
 * Transaction-Based History Service
 * Calculates historical net worth by working backwards from current balance using transactions
 *
 * This service provides immediate historical trend data by analyzing transaction history
 * rather than waiting for daily balance snapshots to accumulate.
 */

import { supabaseAdmin } from '@/lib/supabase';
import type { NetWorthHistoryPoint } from '@/types/dashboard';
import { CurrencyService } from './currency-service';

interface Transaction {
  id: string;
  account_id: string;
  date: string;
  amount: number;
  currency: string;
  transaction_type: 'DEBIT' | 'CREDIT';
}

interface AccountBalance {
  accountId: string;
  accountType: string;
  currentBalance: number;
  currency: string;
  transactions: Transaction[];
}

export class TransactionBasedHistoryService {
  private currencyService = new CurrencyService();

  /**
   * Generate historical net worth trend from transaction data
   * Works backwards from current balance using transaction history
   */
  async generateHistoricalTrend(
    userId: string,
    daysBack: number,
    intervalDays: number = 1
  ): Promise<NetWorthHistoryPoint[]> {
    // Get all user accounts with current balances
    const { data: accounts, error: accountsError } = await supabaseAdmin
      .from('financial_accounts')
      .select('id, account_type, current_balance')
      .eq('user_id', userId);

    if (accountsError) {
      throw new Error(`Failed to fetch accounts: ${accountsError.message}`);
    }

    if (!accounts || accounts.length === 0) {
      return [];
    }

    // Get all transactions for these accounts within the date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    const accountIds = accounts.map(a => a.id);

    const { data: transactions, error: txnError } = await supabaseAdmin
      .from('transactions')
      .select('id, account_id, date, amount, transaction_type')
      .in('account_id', accountIds)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])
      .order('date', { ascending: false });

    if (txnError) {
      console.error('Error fetching transactions:', txnError);
      // If no transactions, return current balance only
      return await this.getCurrentNetWorthOnly(userId);
    }

    console.log(`[Transaction-Based History] Found ${transactions?.length || 0} transactions for ${accounts.length} accounts`);
    console.log(`[Transaction-Based History] Date range: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);

    // Group transactions by account
    const accountBalances: AccountBalance[] = accounts.map(account => ({
      accountId: account.id,
      accountType: account.account_type,
      currentBalance: account.current_balance,
      currency: 'GBP', // Default to GBP
      transactions: (transactions || [])
        .filter(txn => txn.account_id === account.id)
        .map(txn => ({
          id: txn.id,
          account_id: txn.account_id,
          date: txn.date,
          amount: txn.amount,
          currency: 'GBP', // Default to GBP
          transaction_type: txn.transaction_type
        }))
    }));

    // Generate data points at specified intervals
    const dataPoints: NetWorthHistoryPoint[] = [];
    const currentDate = new Date(endDate);

    for (let day = 0; day <= daysBack; day += intervalDays) {
      const targetDate = new Date(currentDate);
      targetDate.setDate(targetDate.getDate() - day);
      const dateStr = targetDate.toISOString().split('T')[0];

      const netWorth = await this.calculateNetWorthAtDate(
        accountBalances,
        dateStr
      );

      dataPoints.unshift({
        date: dateStr,
        net_worth: netWorth.total,
        assets: netWorth.assets,
        liabilities: netWorth.liabilities
      });
    }

    return dataPoints.filter(point => point.net_worth !== 0 || point.assets !== 0);
  }

  /**
   * Calculate net worth at a specific date by working backwards from current balance
   */
  private async calculateNetWorthAtDate(
    accountBalances: AccountBalance[],
    targetDate: string
  ): Promise<{ total: number; assets: number; liabilities: number }> {
    let assets = 0;
    let liabilities = 0;

    for (const account of accountBalances) {
      // Start with current balance
      let balanceAtDate = account.currentBalance;

      // Work backwards: subtract transactions that happened AFTER target date
      for (const txn of account.transactions) {
        if (txn.date > targetDate) {
          // Reverse the transaction's effect on balance
          if (txn.transaction_type === 'CREDIT') {
            // Money came in, so subtract it to go back in time
            balanceAtDate -= txn.amount;
          } else if (txn.transaction_type === 'DEBIT') {
            // Money went out, so add it back to go back in time
            balanceAtDate += txn.amount;
          }
        }
      }

      // Normalize to GBP if needed
      const normalizedBalance = await this.currencyService.normalizeToGBP(
        balanceAtDate,
        account.currency
      );

      // Categorize as asset or liability based on account type
      if (['checking', 'savings', 'investment'].includes(account.accountType)) {
        assets += Math.max(0, normalizedBalance);
      } else if (['credit', 'loan'].includes(account.accountType)) {
        liabilities += Math.abs(normalizedBalance);
      }
    }

    return {
      total: assets - liabilities,
      assets,
      liabilities
    };
  }

  /**
   * Fallback: Return only current net worth if no historical data available
   */
  private async getCurrentNetWorthOnly(userId: string): Promise<NetWorthHistoryPoint[]> {
    const { data: accounts, error } = await supabaseAdmin
      .from('financial_accounts')
      .select('account_type, current_balance, currency')
      .eq('user_id', userId);

    if (error || !accounts || accounts.length === 0) {
      return [];
    }

    let assets = 0;
    let liabilities = 0;

    for (const account of accounts) {
      const normalizedBalance = await this.currencyService.normalizeToGBP(
        account.current_balance,
        account.currency || 'GBP'
      );

      if (['checking', 'savings', 'investment'].includes(account.account_type)) {
        assets += Math.max(0, normalizedBalance);
      } else if (['credit', 'loan'].includes(account.account_type)) {
        liabilities += Math.abs(normalizedBalance);
      }
    }

    return [{
      date: new Date().toISOString().split('T')[0],
      net_worth: assets - liabilities,
      assets,
      liabilities
    }];
  }

  /**
   * Get appropriate interval days based on date range
   */
  static getIntervalForRange(daysBack: number): number {
    if (daysBack <= 30) return 1;      // Daily for 1 month
    if (daysBack <= 90) return 2;      // Every 2 days for 3 months
    if (daysBack <= 180) return 3;     // Every 3 days for 6 months
    if (daysBack <= 365) return 7;     // Weekly for 1 year
    return 14;                          // Bi-weekly for longer periods
  }
}
