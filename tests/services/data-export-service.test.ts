import { DataExportService } from '@/services/data-export-service';

// Mock Supabase
const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  in: jest.fn().mockReturnThis(),
  gte: jest.fn().mockReturnThis(),
  lte: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
};

jest.mock('@/lib/supabase', () => ({
  supabaseAdmin: mockSupabase,
}));

describe('DataExportService', () => {
  let service: DataExportService;
  const userId = 'test-user-id';

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DataExportService(userId);
  });

  const mockAccounts = [
    {
      id: '1',
      account_name: 'Checking Account',
      account_type: 'checking',
      institution_name: 'Test Bank',
      current_balance_gbp: 5000,
      currency: 'GBP',
      last_synced_at: '2024-01-01T12:00:00Z',
    },
    {
      id: '2',
      account_name: 'Savings Account',
      account_type: 'savings',
      institution_name: 'Test Bank',
      current_balance_gbp: 10000,
      currency: 'GBP',
      last_synced_at: '2024-01-01T12:00:00Z',
    },
  ];

  const mockBalanceHistory = [
    {
      account_id: '1',
      user_id: userId,
      recorded_at: '2024-01-01T00:00:00Z',
      balance_gbp: 5000,
      account_type: 'checking',
    },
    {
      account_id: '2',
      user_id: userId,
      recorded_at: '2024-01-01T00:00:00Z',
      balance_gbp: 10000,
      account_type: 'savings',
    },
  ];

  describe('exportData', () => {
    beforeEach(() => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'financial_accounts') {
          mockSupabase.select.mockResolvedValue({
            data: mockAccounts,
            error: null,
          });
        } else if (table === 'account_balance_history') {
          mockSupabase.select.mockResolvedValue({
            data: mockBalanceHistory,
            error: null,
          });
        }
        return mockSupabase;
      });
    });

    it('should export data in CSV format', async () => {
      const result = await service.exportData({ format: 'csv' });

      expect(result.filename).toContain('.csv');
      expect(result.mimeType).toBe('text/csv');
      expect(result.data).toContain('Account Name,Type,Institution');
      expect(result.data).toContain('Checking Account');
      expect(result.data).toContain('Savings Account');
      expect(result.data).toContain('Net Worth History');
    });

    it('should export data in JSON format', async () => {
      const result = await service.exportData({ format: 'json' });

      expect(result.filename).toContain('.json');
      expect(result.mimeType).toBe('application/json');

      const parsedData = JSON.parse(result.data);
      expect(parsedData.accounts).toHaveLength(2);
      expect(parsedData.accounts[0].accountName).toBe('Checking Account');
      expect(parsedData.history).toBeDefined();
    });

    it('should filter by date range', async () => {
      const dateFrom = '2024-01-01';
      const dateTo = '2024-12-31';

      await service.exportData({
        format: 'json',
        dateFrom,
        dateTo,
      });

      expect(mockSupabase.gte).toHaveBeenCalledWith('recorded_at', dateFrom);
      expect(mockSupabase.lte).toHaveBeenCalledWith('recorded_at', dateTo);
    });

    it('should filter by account IDs', async () => {
      const accountIds = ['1'];

      await service.exportData({
        format: 'json',
        accountIds,
      });

      expect(mockSupabase.in).toHaveBeenCalledWith('id', accountIds);
    });

    it('should handle export errors gracefully', async () => {
      mockSupabase.select.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      await expect(
        service.exportData({ format: 'csv' })
      ).rejects.toThrow('Failed to fetch accounts');
    });
  });

  describe('CSV generation', () => {
    beforeEach(() => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'financial_accounts') {
          mockSupabase.select.mockResolvedValue({
            data: mockAccounts,
            error: null,
          });
        } else if (table === 'account_balance_history') {
          mockSupabase.select.mockResolvedValue({
            data: mockBalanceHistory,
            error: null,
          });
        }
        return mockSupabase;
      });
    });

    it('should include proper CSV headers', async () => {
      const result = await service.exportData({ format: 'csv' });

      expect(result.data).toContain('Account Name,Type,Institution,Current Balance,Currency,Last Synced');
      expect(result.data).toContain('Date,Net Worth,Assets,Liabilities');
    });

    it('should format numbers correctly in CSV', async () => {
      const result = await service.exportData({ format: 'csv' });

      expect(result.data).toContain('5000.00');
      expect(result.data).toContain('10000.00');
    });

    it('should include export metadata', async () => {
      const result = await service.exportData({ format: 'csv' });

      expect(result.data).toContain('# Export Information');
      expect(result.data).toContain('Exported At');
      expect(result.data).toContain('Date Range');
    });
  });

  describe('JSON generation', () => {
    beforeEach(() => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'financial_accounts') {
          mockSupabase.select.mockResolvedValue({
            data: mockAccounts,
            error: null,
          });
        } else if (table === 'account_balance_history') {
          mockSupabase.select.mockResolvedValue({
            data: mockBalanceHistory,
            error: null,
          });
        }
        return mockSupabase;
      });
    });

    it('should generate valid JSON', async () => {
      const result = await service.exportData({ format: 'json' });

      expect(() => JSON.parse(result.data)).not.toThrow();
    });

    it('should include all required fields', async () => {
      const result = await service.exportData({ format: 'json' });
      const data = JSON.parse(result.data);

      expect(data).toHaveProperty('accounts');
      expect(data).toHaveProperty('history');
      expect(data).toHaveProperty('exportedAt');
      expect(data).toHaveProperty('dateRange');
    });
  });
});
