/**
 * Tests for Transaction API endpoints
 * @jest-environment node
 */

import { GET } from '@/app/api/transactions/route';
import { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Mock Supabase SSR and cookies
jest.mock('@supabase/ssr');
jest.mock('next/headers');

describe('GET /api/transactions', () => {
  let mockSupabase: any;
  let mockCookieStore: any;
  let mockQueryBuilder: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock cookie store
    mockCookieStore = {
      get: jest.fn(),
      set: jest.fn(),
    };

    (cookies as jest.Mock).mockReturnValue(mockCookieStore);

    // Setup mock query builder that properly chains
    mockQueryBuilder = {
      select: jest.fn(),
      order: jest.fn(),
      limit: jest.fn(),
      or: jest.fn(),
      in: jest.fn(),
      ilike: jest.fn(),
      gte: jest.fn(),
      lte: jest.fn(),
    };

    // Make each method return the builder for chaining
    Object.keys(mockQueryBuilder).forEach((key) => {
      mockQueryBuilder[key].mockReturnValue(mockQueryBuilder);
    });

    // Setup mock Supabase client
    mockSupabase = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn(() => mockQueryBuilder),
    };

    (createServerClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  it('should return 401 if user is not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Not authenticated'),
    });

    const request = new NextRequest('http://localhost:3000/api/transactions');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should fetch transactions with default pagination', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    const mockTransactions = [
      {
        id: 'tx-1',
        account_id: 'acc-1',
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
        amount: -12.50,
        merchant_name: 'Starbucks',
        category: 'dining',
        date: '2025-10-06',
        description: 'Coffee',
        is_shared_expense: false,
        manual_override: false,
        created_at: '2025-10-06T09:00:00Z',
      },
    ];

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    // Set the final result on limit() which is the last method called
    mockQueryBuilder.limit.mockResolvedValueOnce({
      data: mockTransactions,
      error: null,
      count: 2,
    });

    const request = new NextRequest('http://localhost:3000/api/transactions');
    const response = await GET(request);
    const data = await response.json();

    if (response.status !== 200) {
      console.log('Error response:', data);
    }

    expect(response.status).toBe(200);
    expect(data.transactions).toHaveLength(2);
    expect(data.total_count).toBe(2);
    expect(data.has_more).toBe(false);
  });

  it('should return 400 for invalid query parameters', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const request = new NextRequest(
      'http://localhost:3000/api/transactions?merchant_search=a' // Too short
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid query parameters');
  });

  it('should handle database errors gracefully', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    mockQueryBuilder.limit.mockResolvedValueOnce({
      data: null,
      error: { message: 'Database error' },
      count: null,
    });

    const request = new NextRequest('http://localhost:3000/api/transactions');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch transactions');
  });
});
