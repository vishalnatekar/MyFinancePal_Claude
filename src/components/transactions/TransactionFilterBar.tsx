'use client';

import { TransactionFilter, TransactionCategory } from '@/types/transaction';
import { Button } from '@/components/ui/button';
import { X, SlidersHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface TransactionFilterBarProps {
  filters: TransactionFilter;
  onRemoveFilter: (key: keyof TransactionFilter) => void;
  onClearAll: () => void;
  onOpenFilters: () => void;
}

/**
 * Component to display active filters and allow removal
 */
export function TransactionFilterBar({
  filters,
  onRemoveFilter,
  onClearAll,
  onOpenFilters,
}: TransactionFilterBarProps) {
  const hasActiveFilters =
    Object.keys(filters).filter((key) => key !== 'limit' && key !== 'cursor')
      .length > 0;

  if (!hasActiveFilters) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onOpenFilters}>
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="sm" onClick={onOpenFilters}>
        <SlidersHorizontal className="h-4 w-4 mr-2" />
        Filters
      </Button>

      {filters.categories && filters.categories.length > 0 && (
        <div className="flex items-center gap-1">
          <span className="text-sm text-gray-600">Categories:</span>
          {filters.categories.map((category) => (
            <Badge key={category} variant="secondary">
              {category}
              <button
                className="ml-1 hover:text-gray-900"
                onClick={() => {
                  const newCategories = filters.categories?.filter(
                    (c) => c !== category
                  );
                  if (newCategories && newCategories.length > 0) {
                    onRemoveFilter('categories');
                  } else {
                    onRemoveFilter('categories');
                  }
                }}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {filters.merchant_search && (
        <Badge variant="secondary">
          Merchant: {filters.merchant_search}
          <button
            className="ml-1 hover:text-gray-900"
            onClick={() => onRemoveFilter('merchant_search')}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}

      {filters.date_from && (
        <Badge variant="secondary">
          From: {filters.date_from}
          <button
            className="ml-1 hover:text-gray-900"
            onClick={() => onRemoveFilter('date_from')}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}

      {filters.date_to && (
        <Badge variant="secondary">
          To: {filters.date_to}
          <button
            className="ml-1 hover:text-gray-900"
            onClick={() => onRemoveFilter('date_to')}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}

      {(filters.amount_min !== undefined || filters.amount_max !== undefined) && (
        <Badge variant="secondary">
          Amount: {filters.amount_min ?? '0'} -{' '}
          {filters.amount_max ?? '∞'}
          <button
            className="ml-1 hover:text-gray-900"
            onClick={() => {
              onRemoveFilter('amount_min');
              onRemoveFilter('amount_max');
            }}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}

      <Button variant="ghost" size="sm" onClick={onClearAll}>
        Clear all
      </Button>
    </div>
  );
}
