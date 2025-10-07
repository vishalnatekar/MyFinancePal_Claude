/**
 * Tests for Transaction Export Service
 */

import { TransactionExportService } from '@/services/transaction-export-service';
import { Transaction } from '@/types/transaction';

describe('TransactionExportService', () => {
  const mockTransactions: Transaction[] = [
    {
      id: 'tx-1',
      account_id: 'acc-1',
      truelayer_transaction_id: 'tl-1',
      amount: -50.00,
      merchant_name: 'Tesco',
      category: 'groceries',
      date: '2025-10-07',
      description: 'Weekly shopping',
      is_shared_expense: false,
      manual_override: false,
      created_at: '2025-10-07T10:00:00Z',
    },
    {
      id: 'tx-2',
      account_id: 'acc-1',
      amount: 3000.00,
      merchant_name: 'Employer Inc',
      category: 'income',
      date: '2025-10-01',
      description: 'Monthly salary',
      is_shared_expense: false,
      manual_override: false,
      created_at: '2025-10-01T09:00:00Z',
    },
  ];

  describe('generateCSV', () => {
    it('should generate CSV with headers and data', () => {
      const csv = TransactionExportService.generateCSV(mockTransactions);

      expect(csv).toContain('Date,Merchant,Amount,Category,Description');
      expect(csv).toContain('2025-10-07,Tesco,-50.00,groceries,Weekly shopping');
      expect(csv).toContain('2025-10-01,Employer Inc,3000.00,income,Monthly salary');
    });

    it('should handle empty transaction list', () => {
      const csv = TransactionExportService.generateCSV([]);
      expect(csv).toBe('');
    });

    it('should escape fields with commas', () => {
      const txWithComma: Transaction = {
        ...mockTransactions[0],
        merchant_name: 'Store, Inc',
        description: 'Item 1, Item 2',
      };

      const csv = TransactionExportService.generateCSV([txWithComma]);

      expect(csv).toContain('"Store, Inc"');
      expect(csv).toContain('"Item 1, Item 2"');
    });

    it('should escape fields with quotes', () => {
      const txWithQuote: Transaction = {
        ...mockTransactions[0],
        merchant_name: 'Joe\'s "Amazing" Store',
      };

      const csv = TransactionExportService.generateCSV([txWithQuote]);

      expect(csv).toContain('"Joe\'s ""Amazing"" Store"');
    });

    it('should handle transactions without descriptions', () => {
      const txNoDesc: Transaction = {
        ...mockTransactions[0],
        description: undefined,
      };

      const csv = TransactionExportService.generateCSV([txNoDesc]);

      expect(csv).toContain('Tesco,-50.00,groceries,');
    });

    it('should include manual override flag', () => {
      const txManual: Transaction = {
        ...mockTransactions[0],
        manual_override: true,
      };

      const csv = TransactionExportService.generateCSV([txManual]);

      expect(csv).toContain(',Yes');
    });
  });

  describe('generateFilename', () => {
    it('should generate filename with timestamp', () => {
      const filename = TransactionExportService.generateFilename();

      expect(filename).toMatch(/^transactions-\d{4}-\d{2}-\d{2}-\d{6}\.csv$/);
    });

    it('should use custom prefix', () => {
      const filename = TransactionExportService.generateFilename('my-exports');

      expect(filename).toMatch(/^my-exports-\d{4}-\d{2}-\d{2}-\d{6}\.csv$/);
    });
  });

  describe('exportTransactions', () => {
    beforeEach(() => {
      // Mock DOM methods for download
      document.body.appendChild = jest.fn();
      document.body.removeChild = jest.fn();
      URL.createObjectURL = jest.fn(() => 'blob:mock-url');
      URL.revokeObjectURL = jest.fn();
    });

    it('should throw error for empty transactions', async () => {
      await expect(
        TransactionExportService.exportTransactions([])
      ).rejects.toThrow('No transactions to export');
    });

    it('should export transactions successfully', async () => {
      await TransactionExportService.exportTransactions(mockTransactions);

      expect(URL.createObjectURL).toHaveBeenCalled();
      expect(document.body.appendChild).toHaveBeenCalled();
      expect(URL.revokeObjectURL).toHaveBeenCalled();
    });

    it('should use custom filename', async () => {
      await TransactionExportService.exportTransactions(mockTransactions, {
        filename: 'custom-export.csv',
      });

      expect(URL.createObjectURL).toHaveBeenCalled();
    });
  });
});
