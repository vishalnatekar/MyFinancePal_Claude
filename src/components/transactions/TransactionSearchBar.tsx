'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface TransactionSearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  debounceMs?: number;
}

/**
 * Search bar component with debouncing for merchant name search
 */
export function TransactionSearchBar({
  onSearch,
  placeholder = 'Search transactions...',
  debounceMs = 300,
}: TransactionSearchBarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchQuery, debounceMs]);

  // Trigger search when debounced query changes
  useEffect(() => {
    if (debouncedQuery.length >= 2 || debouncedQuery.length === 0) {
      onSearch(debouncedQuery);
    }
  }, [debouncedQuery, onSearch]);

  const handleClear = useCallback(() => {
    setSearchQuery('');
    setDebouncedQuery('');
    onSearch('');
  }, [onSearch]);

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-gray-400" />
      </div>
      <Input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder={placeholder}
        className="pl-10 pr-10"
      />
      {searchQuery && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute inset-y-0 right-0 px-3"
          onClick={handleClear}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
