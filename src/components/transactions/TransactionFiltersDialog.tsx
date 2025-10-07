'use client';

import { useState, useEffect } from 'react';
import { TransactionFilter, TransactionCategory } from '@/types/transaction';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface TransactionFiltersDialogProps {
  open: boolean;
  onClose: () => void;
  filters: TransactionFilter;
  onApply: (filters: TransactionFilter) => void;
}

const CATEGORIES: TransactionCategory[] = [
  'groceries',
  'utilities',
  'entertainment',
  'transport',
  'dining',
  'shopping',
  'healthcare',
  'housing',
  'income',
  'transfer',
  'other',
];

/**
 * Dialog for advanced transaction filtering
 */
export function TransactionFiltersDialog({
  open,
  onClose,
  filters,
  onApply,
}: TransactionFiltersDialogProps) {
  const [localFilters, setLocalFilters] = useState<TransactionFilter>({});

  // Sync local filters only when dialog opens
  useEffect(() => {
    if (open) {
      setLocalFilters(filters);
    }
  }, [open]); // Only depend on 'open', not 'filters'

  const handleCategoryToggle = (category: TransactionCategory) => {
    const currentCategories = localFilters.categories || [];
    const newCategories = currentCategories.includes(category)
      ? currentCategories.filter((c) => c !== category)
      : [...currentCategories, category];

    setLocalFilters({
      ...localFilters,
      categories: newCategories.length > 0 ? newCategories : undefined,
    });
  };

  const handleApply = () => {
    // Only apply if filters actually changed
    if (JSON.stringify(localFilters) !== JSON.stringify(filters)) {
      onApply(localFilters);
    }
    onClose();
  };

  const handleClear = () => {
    setLocalFilters({});
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Filter Transactions</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Categories */}
          <div>
            <Label className="text-base mb-3 block">Categories</Label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((category) => {
                const isSelected =
                  localFilters.categories?.includes(category) ?? false;
                return (
                  <Badge
                    key={category}
                    variant={isSelected ? 'default' : 'outline'}
                    className="cursor-pointer capitalize"
                    onClick={() => handleCategoryToggle(category)}
                  >
                    {category}
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* Amount Range */}
          <div>
            <Label className="text-base mb-3 block">Amount Range</Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount_min" className="text-sm">
                  Min Amount
                </Label>
                <Input
                  id="amount_min"
                  type="number"
                  min="0"
                  step="0.01"
                  value={localFilters.amount_min ?? ''}
                  onChange={(e) =>
                    setLocalFilters({
                      ...localFilters,
                      amount_min: e.target.value
                        ? parseFloat(e.target.value)
                        : undefined,
                    })
                  }
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="amount_max" className="text-sm">
                  Max Amount
                </Label>
                <Input
                  id="amount_max"
                  type="number"
                  min="0"
                  step="0.01"
                  value={localFilters.amount_max ?? ''}
                  onChange={(e) =>
                    setLocalFilters({
                      ...localFilters,
                      amount_max: e.target.value
                        ? parseFloat(e.target.value)
                        : undefined,
                    })
                  }
                  placeholder="No limit"
                />
              </div>
            </div>
          </div>

          {/* Date Range */}
          <div>
            <Label className="text-base mb-3 block">Date Range</Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date_from" className="text-sm">
                  From Date
                </Label>
                <Input
                  id="date_from"
                  type="date"
                  value={localFilters.date_from ?? ''}
                  onChange={(e) =>
                    setLocalFilters({
                      ...localFilters,
                      date_from: e.target.value || undefined,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="date_to" className="text-sm">
                  To Date
                </Label>
                <Input
                  id="date_to"
                  type="date"
                  value={localFilters.date_to ?? ''}
                  onChange={(e) =>
                    setLocalFilters({
                      ...localFilters,
                      date_to: e.target.value || undefined,
                    })
                  }
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClear}>
            Clear All
          </Button>
          <Button onClick={handleApply}>Apply Filters</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
