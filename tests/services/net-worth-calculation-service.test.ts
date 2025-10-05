import { NetWorthCalculationService } from '@/services/net-worth-calculation-service';
import { CurrencyService } from '@/services/currency-service';
import type { FinancialAccount } from '@/types/account';

// Mock Supabase client
const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  lte: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
};

// Mock currency service
jest.mock('@/services/currency-service');
const mockCurrencyService = {
  normalizeToGBP: jest.fn().mockResolvedValue(1000)
};

// Mock config
jest.mock('@/lib/config', () => ({
  config: {
    supabase: {
      url: 'test-url',
      anonKey: 'test-key'
    }
  }
}));

// Mock Supabase client creation
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabase)
}));

describe('NetWorthCalculationService', () => {
  let service: NetWorthCalculationService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new NetWorthCalculationService();
    // Mock the currency service instance
    (service as any).currencyService = mockCurrencyService;
  });

  describe('calculateNetWorth', () => {
    const mockAccounts: FinancialAccount[] = [
      {
        id: '1',
        user_id: 'user-1',
        account_type: 'checking',
        account_name: 'Current Account',
        institution_name: 'Test Bank',
        current_balance: 5000,
        currency: 'GBP',
        is_shared: false,
        is_manual: false,
        created_at: '2024-01-01'
      },
      {
        id: '2',
        user_id: 'user-1',
        account_type: 'savings',
        account_name: 'Savings Account',
        institution_name: 'Test Bank',
        current_balance: 10000,
        currency: 'GBP',
        is_shared: false,
        is_manual: false,
        created_at: '2024-01-01'
      },
      {
        id: '3',
        user_id: 'user-1',
        account_type: 'investment',
        account_name: 'ISA',
        institution_name: 'Investment Bank',
        current_balance: 25000,
        currency: 'GBP',
        is_shared: false,
        is_manual: false,
        created_at: '2024-01-01'
      },
      {
        id: '4',
        user_id: 'user-1',
        account_type: 'credit',
        account_name: 'Credit Card',
        institution_name: 'Credit Bank',
        current_balance: -1500,
        currency: 'GBP',
        is_shared: false,
        is_manual: false,
        created_at: '2024-01-01'
      }
    ];

    it('should calculate net worth correctly', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: mockAccounts,
            error: null
          })
        })
      });

      mockCurrencyService.normalizeToGBP
        .mockResolvedValueOnce(5000)  // checking
        .mockResolvedValueOnce(10000) // savings
        .mockResolvedValueOnce(25000) // investment
        .mockResolvedValueOnce(-1500); // credit

      const result = await service.calculateNetWorth('user-1');

      expect(result.total_assets).toBe(40000); // 5000 + 10000 + 25000
      expect(result.total_liabilities).toBe(1500); // abs(-1500)
      expect(result.total_net_worth).toBe(38500); // 40000 - 1500
      expect(result.currency).toBe('GBP');
    });

    it('should handle empty accounts list', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      });

      const result = await service.calculateNetWorth('user-1');

      expect(result.total_assets).toBe(0);
      expect(result.total_liabilities).toBe(0);
      expect(result.total_net_worth).toBe(0);
    });

    it('should categorize assets correctly', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: mockAccounts,
            error: null
          })
        })
      });

      mockCurrencyService.normalizeToGBP
        .mockResolvedValueOnce(5000)  // checking
        .mockResolvedValueOnce(10000) // savings
        .mockResolvedValueOnce(25000) // investment
        .mockResolvedValueOnce(-1500); // credit

      const result = await service.calculateNetWorth('user-1');

      expect(result.asset_breakdown.cash.amount).toBe(15000); // checking + savings
      expect(result.asset_breakdown.investments.amount).toBe(25000);
      expect(result.asset_breakdown.property.amount).toBe(0);
      expect(result.asset_breakdown.other.amount).toBe(0);

      // Check percentages
      expect(result.asset_breakdown.cash.percentage).toBeCloseTo(37.5, 1); // 15000/40000 * 100
      expect(result.asset_breakdown.investments.percentage).toBeCloseTo(62.5, 1); // 25000/40000 * 100
    });

    it('should handle database errors', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' }
          })
        })
      });

      await expect(service.calculateNetWorth('user-1')).rejects.toThrow('Failed to fetch accounts: Database error');
    });

    it('should handle accounts with zero balances', async () => {
      const zeroBalanceAccounts = [
        {
          ...mockAccounts[0],
          current_balance: 0
        }
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: zeroBalanceAccounts,
            error: null
          })
        })
      });

      mockCurrencyService.normalizeToGBP.mockResolvedValueOnce(0);

      const result = await service.calculateNetWorth('user-1');

      expect(result.total_assets).toBe(0);
      expect(result.total_net_worth).toBe(0);
    });

    it('should handle multiple currencies', async () => {
      const multiCurrencyAccounts = [
        {
          ...mockAccounts[0],
          currency: 'USD',
          current_balance: 1000
        },
        {
          ...mockAccounts[1],
          currency: 'EUR',
          current_balance: 800
        }
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: multiCurrencyAccounts,
            error: null
          })
        })
      });

      mockCurrencyService.normalizeToGBP
        .mockResolvedValueOnce(800)  // USD to GBP
        .mockResolvedValueOnce(720); // EUR to GBP

      const result = await service.calculateNetWorth('user-1');

      expect(result.total_assets).toBe(1520); // 800 + 720
      expect(mockCurrencyService.normalizeToGBP).toHaveBeenCalledWith(1000, 'USD');
      expect(mockCurrencyService.normalizeToGBP).toHaveBeenCalledWith(800, 'EUR');
    });
  });

  describe('getAccountsBreakdown', () => {
    it('should return processed accounts', async () => {
      const mockAccounts = [
        {
          id: '1',
          user_id: 'user-1',
          account_type: 'checking',
          account_name: 'Current Account',
          institution_name: 'Test Bank',
          current_balance: 1000,
          currency: 'GBP',
          is_shared: false,
          is_manual: false,
          created_at: '2024-01-01'
        }
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: mockAccounts,
            error: null
          })
        })
      });

      mockCurrencyService.normalizeToGBP.mockResolvedValueOnce(1000);

      const result = await service.getAccountsBreakdown('user-1');

      expect(result).toHaveLength(1);
      expect(result[0].current_balance).toBe(1000);
    });
  });

  describe('calculateNetWorthForDate', () => {
    it('should calculate net worth for historical date', async () => {
      const mockHistoricalData = [
        {
          balance: 1000,
          currency: 'GBP',
          financial_accounts: {
            id: 'account-1',
            account_type: 'checking',
            user_id: 'user-1'
          }
        },
        {
          balance: -500,
          currency: 'GBP',
          financial_accounts: {
            id: 'account-2',
            account_type: 'credit',
            user_id: 'user-1'
          }
        }
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            lte: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: mockHistoricalData,
                error: null
              })
            })
          })
        })
      });

      mockCurrencyService.normalizeToGBP
        .mockResolvedValueOnce(1000)
        .mockResolvedValueOnce(-500);

      const result = await service.calculateNetWorthForDate('user-1', '2024-01-01');

      expect(result).toBe(500); // 1000 - abs(-500)
    });

    it('should return 0 for no historical data', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            lte: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: [],
                error: null
              })
            })
          })
        })
      });

      const result = await service.calculateNetWorthForDate('user-1', '2024-01-01');

      expect(result).toBe(0);
    });
  });
});