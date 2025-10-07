import { Transaction, TransactionFilter, PaginatedTransactions, TransactionUpdateData } from '@/types/transaction';

/**
 * Transaction API service
 * Handles all transaction-related API communication
 */

export class TransactionService {
  /**
   * Fetch transactions with filters and pagination
   */
  static async fetchTransactions(
    filters: TransactionFilter = {}
  ): Promise<PaginatedTransactions> {
    const params = new URLSearchParams();

    if (filters.account_ids && filters.account_ids.length > 0) {
      params.set('account_ids', filters.account_ids.join(','));
    }

    if (filters.categories && filters.categories.length > 0) {
      params.set('categories', filters.categories.join(','));
    }

    if (filters.merchant_search) {
      params.set('merchant_search', filters.merchant_search);
    }

    if (filters.amount_min !== undefined) {
      params.set('amount_min', filters.amount_min.toString());
    }

    if (filters.amount_max !== undefined) {
      params.set('amount_max', filters.amount_max.toString());
    }

    if (filters.date_from) {
      params.set('date_from', filters.date_from);
    }

    if (filters.date_to) {
      params.set('date_to', filters.date_to);
    }

    if (filters.limit) {
      params.set('limit', filters.limit.toString());
    }

    if (filters.cursor) {
      params.set('cursor', filters.cursor);
    }

    const response = await fetch(`/api/transactions?${params.toString()}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch transactions');
    }

    return response.json();
  }

  /**
   * Fetch a single transaction by ID
   */
  static async fetchTransactionById(id: string): Promise<Transaction> {
    const response = await fetch(`/api/transactions/${id}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch transaction');
    }

    return response.json();
  }

  /**
   * Update a transaction
   */
  static async updateTransaction(
    id: string,
    data: TransactionUpdateData
  ): Promise<Transaction> {
    const response = await fetch(`/api/transactions/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update transaction');
    }

    return response.json();
  }
}
