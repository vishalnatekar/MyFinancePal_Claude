import { supabaseAdmin } from '@/lib/supabase';
import type { FinancialAccount } from '@/types/account';
import type { NetWorthSummary, AssetBreakdown, AssetCategory } from '@/types/dashboard';
import { CurrencyService } from './currency-service';

export class NetWorthCalculationService {
  private supabase = supabaseAdmin;
  private currencyService = new CurrencyService();

  async calculateNetWorth(userId: string): Promise<NetWorthSummary> {
    const accounts = await this.getProcessedAccounts(userId);

    // Calculate assets (positive values for checking, savings, investment)
    const assets = accounts
      .filter(account => ['checking', 'savings', 'investment'].includes(account.account_type))
      .reduce((sum, account) => sum + account.current_balance, 0);

    // Calculate liabilities (absolute values for credit, loan)
    const liabilities = accounts
      .filter(account => ['credit', 'loan'].includes(account.account_type))
      .reduce((sum, account) => sum + Math.abs(account.current_balance), 0);

    const assetBreakdown = this.categorizeAssets(accounts);

    return {
      total_net_worth: assets - liabilities,
      total_assets: assets,
      total_liabilities: liabilities,
      asset_breakdown: assetBreakdown,
      currency: 'GBP', // All amounts normalized to GBP
      last_updated: new Date().toISOString()
    };
  }

  private async getProcessedAccounts(userId: string): Promise<FinancialAccount[]> {
    const { data: accounts, error } = await this.supabase
      .from('financial_accounts')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to fetch accounts: ${error.message}`);
    }

    // Normalize all balances to GBP
    const normalizedAccounts = await Promise.all(
      (accounts || []).map(async (account) => {
        const normalizedBalance = await this.currencyService.normalizeToGBP(
          account.current_balance,
          account.currency || 'GBP'
        );

        return {
          ...account,
          current_balance: normalizedBalance
        };
      })
    );

    return normalizedAccounts;
  }

  private categorizeAssets(accounts: FinancialAccount[]): AssetBreakdown {
    const cash = this.calculateCashAssets(accounts);
    const investments = this.calculateInvestmentAssets(accounts);
    const property = this.calculatePropertyAssets(accounts);
    const other = this.calculateOtherAssets(accounts);

    const totalAssets = cash.amount + investments.amount + property.amount + other.amount;

    return {
      cash: {
        ...cash,
        percentage: totalAssets > 0 ? (cash.amount / totalAssets) * 100 : 0
      },
      investments: {
        ...investments,
        percentage: totalAssets > 0 ? (investments.amount / totalAssets) * 100 : 0
      },
      property: {
        ...property,
        percentage: totalAssets > 0 ? (property.amount / totalAssets) * 100 : 0
      },
      other: {
        ...other,
        percentage: totalAssets > 0 ? (other.amount / totalAssets) * 100 : 0
      }
    };
  }

  private calculateCashAssets(accounts: FinancialAccount[]): AssetCategory {
    const cashAccounts = accounts.filter(account =>
      ['checking', 'savings'].includes(account.account_type) && account.current_balance > 0
    );

    return {
      amount: cashAccounts.reduce((sum, account) => sum + account.current_balance, 0),
      percentage: 0, // Will be calculated in categorizeAssets
      accounts: cashAccounts.map(account => account.id)
    };
  }

  private calculateInvestmentAssets(accounts: FinancialAccount[]): AssetCategory {
    const investmentAccounts = accounts.filter(account =>
      account.account_type === 'investment' && account.current_balance > 0
    );

    return {
      amount: investmentAccounts.reduce((sum, account) => sum + account.current_balance, 0),
      percentage: 0, // Will be calculated in categorizeAssets
      accounts: investmentAccounts.map(account => account.id)
    };
  }

  private calculatePropertyAssets(accounts: FinancialAccount[]): AssetCategory {
    // For now, no specific property accounts - could be added later
    // Property values would typically be manually entered or from property APIs
    return {
      amount: 0,
      percentage: 0,
      accounts: []
    };
  }

  private calculateOtherAssets(accounts: FinancialAccount[]): AssetCategory {
    // Any other asset types not covered above
    const otherAccounts = accounts.filter(account =>
      !['checking', 'savings', 'investment', 'credit', 'loan'].includes(account.account_type) &&
      account.current_balance > 0
    );

    return {
      amount: otherAccounts.reduce((sum, account) => sum + account.current_balance, 0),
      percentage: 0, // Will be calculated in categorizeAssets
      accounts: otherAccounts.map(account => account.id)
    };
  }

  /**
   * Get accounts breakdown for display
   */
  async getAccountsBreakdown(userId: string): Promise<FinancialAccount[]> {
    return this.getProcessedAccounts(userId);
  }

  /**
   * Calculate net worth for a specific date (for historical data)
   */
  async calculateNetWorthForDate(userId: string, date: string): Promise<number> {
    // This would use historical balance data from account_balance_history table
    const { data: balanceHistory, error } = await this.supabase
      .from('account_balance_history')
      .select(`
        balance,
        currency,
        financial_accounts!inner(account_type, user_id)
      `)
      .eq('financial_accounts.user_id', userId)
      .lte('recorded_at', date)
      .order('recorded_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch historical data: ${error.message}`);
    }

    if (!balanceHistory || balanceHistory.length === 0) {
      return 0;
    }

    // Group by account and get the latest balance for each account on or before the date
    const accountBalances = new Map<string, { balance: number; accountType: string; currency: string }>();

    for (const record of balanceHistory) {
      const accountId = record.financial_accounts?.id;
      if (accountId && !accountBalances.has(accountId)) {
        accountBalances.set(accountId, {
          balance: record.balance,
          accountType: record.financial_accounts.account_type,
          currency: record.currency || 'GBP'
        });
      }
    }

    // Calculate net worth from historical balances
    let assets = 0;
    let liabilities = 0;

    for (const [_, accountData] of accountBalances) {
      const normalizedBalance = await this.currencyService.normalizeToGBP(
        accountData.balance,
        accountData.currency
      );

      if (['checking', 'savings', 'investment'].includes(accountData.accountType)) {
        assets += normalizedBalance;
      } else if (['credit', 'loan'].includes(accountData.accountType)) {
        liabilities += Math.abs(normalizedBalance);
      }
    }

    return assets - liabilities;
  }
}