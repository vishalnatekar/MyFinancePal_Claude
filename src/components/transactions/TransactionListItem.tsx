'use client';

import { Transaction } from '@/types/transaction';
import { formatCurrency } from '@/lib/currency-utils';
import { format } from 'date-fns';

interface TransactionListItemProps {
  transaction: Transaction;
  onEdit: (transaction: Transaction) => void;
  accountName?: string;
}

/**
 * Individual transaction list item component
 */
export function TransactionListItem({
  transaction,
  onEdit,
  accountName,
}: TransactionListItemProps) {
  const isIncome = transaction.amount > 0;

  return (
    <div
      className="flex items-center justify-between p-4 border-b border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
      onClick={() => onEdit(transaction)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onEdit(transaction);
        }
      }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900 truncate">
            {transaction.merchant_name || transaction.description || 'Unknown Merchant'}
          </span>
          {transaction.manual_override && (
            <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
              Edited
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span
            className={`px-2 py-0.5 text-xs rounded-full capitalize ${
              getCategoryColor(transaction.category)
            }`}
          >
            {transaction.category || 'other'}
          </span>
          <span className="text-sm text-gray-500">
            {format(new Date(transaction.date), 'MMM dd, yyyy')}
          </span>
          {accountName && (
            <span className="text-xs text-gray-400">• {accountName}</span>
          )}
        </div>
        {transaction.description && transaction.merchant_name && (
          <p className="text-sm text-gray-600 mt-1 truncate">
            {transaction.description}
          </p>
        )}
      </div>
      <div className="ml-4 text-right">
        <span
          className={`text-lg font-semibold ${
            isIncome ? 'text-green-600' : 'text-gray-900'
          }`}
        >
          {isIncome ? '+' : ''}
          {formatCurrency(Math.abs(transaction.amount), 'GBP')}
        </span>
      </div>
    </div>
  );
}

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    groceries: 'bg-green-100 text-green-800',
    utilities: 'bg-blue-100 text-blue-800',
    entertainment: 'bg-purple-100 text-purple-800',
    transport: 'bg-yellow-100 text-yellow-800',
    dining: 'bg-orange-100 text-orange-800',
    shopping: 'bg-pink-100 text-pink-800',
    healthcare: 'bg-red-100 text-red-800',
    housing: 'bg-indigo-100 text-indigo-800',
    income: 'bg-green-100 text-green-800',
    transfer: 'bg-gray-100 text-gray-800',
    other: 'bg-gray-100 text-gray-800',
  };

  return colors[category] || colors.other;
}
