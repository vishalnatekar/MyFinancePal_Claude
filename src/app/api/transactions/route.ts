import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { config } from '@/lib/config';
import type { Database } from '@/types/database';
import { z } from 'zod';

/**
 * Transaction list API endpoint with filtering and pagination
 * GET /api/transactions
 */

export const dynamic = 'force-dynamic';

const transactionFilterSchema = z.object({
  account_ids: z.string().optional().transform((val) => val ? val.split(',') : undefined),
  categories: z.string().optional().transform((val) => val ? val.split(',') : undefined),
  merchant_search: z.string().min(2).max(100).optional(),
  amount_min: z.coerce.number().min(0).optional(),
  amount_max: z.coerce.number().min(0).optional(),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  limit: z.coerce.number().min(10).max(100).default(50),
  cursor: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    // Create Supabase client with server-side cookie handling
    const cookieStore = cookies();
    const supabase = createServerClient<Database>(
      config.supabase.url,
      config.supabase.anonKey,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: Record<string, unknown>) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: Record<string, unknown>) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const rawParams: Record<string, string | undefined> = {};

    // Only include parameters that are actually present
    const accountIds = searchParams.get('account_ids');
    if (accountIds) rawParams.account_ids = accountIds;

    const categories = searchParams.get('categories');
    if (categories) rawParams.categories = categories;

    const merchantSearch = searchParams.get('merchant_search');
    if (merchantSearch) rawParams.merchant_search = merchantSearch;

    const amountMin = searchParams.get('amount_min');
    if (amountMin) rawParams.amount_min = amountMin;

    const amountMax = searchParams.get('amount_max');
    if (amountMax) rawParams.amount_max = amountMax;

    const dateFrom = searchParams.get('date_from');
    if (dateFrom) rawParams.date_from = dateFrom;

    const dateTo = searchParams.get('date_to');
    if (dateTo) rawParams.date_to = dateTo;

    const limit = searchParams.get('limit');
    rawParams.limit = limit || '50';

    const cursor = searchParams.get('cursor');
    if (cursor) rawParams.cursor = cursor;

    const validationResult = transactionFilterSchema.safeParse(rawParams);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const filters = validationResult.data;

    // Build base query - only get transactions for user's accounts
    let query = supabase
      .from('transactions')
      .select('*', { count: 'exact' })
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(filters.limit + 1); // Fetch one extra to check if more exist

    // Apply cursor-based pagination
    if (filters.cursor) {
      const [cursorDate, cursorCreatedAt] = filters.cursor.split('|');
      query = query.or(
        `date.lt.${cursorDate},and(date.eq.${cursorDate},created_at.lt.${cursorCreatedAt})`
      );
    }

    // Apply filters
    if (filters.account_ids && filters.account_ids.length > 0) {
      query = query.in('account_id', filters.account_ids);
    }

    if (filters.categories && filters.categories.length > 0) {
      query = query.in('category', filters.categories);
    }

    if (filters.merchant_search) {
      // Search in both merchant_name and description fields
      query = query.or(
        `merchant_name.ilike.%${filters.merchant_search}%,description.ilike.%${filters.merchant_search}%`
      );
    }

    if (filters.amount_min !== undefined) {
      query = query.gte('amount', filters.amount_min);
    }

    if (filters.amount_max !== undefined) {
      query = query.lte('amount', filters.amount_max);
    }

    if (filters.date_from) {
      query = query.gte('date', filters.date_from);
    }

    if (filters.date_to) {
      query = query.lte('date', filters.date_to);
    }

    // Execute query
    const { data, error, count } = await query;

    if (error) {
      console.error('Transaction query error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch transactions' },
        { status: 500 }
      );
    }

    // Calculate pagination metadata
    const hasMore = data.length > filters.limit;
    const transactions = hasMore ? data.slice(0, filters.limit) : data;
    const nextCursor = hasMore
      ? `${transactions[transactions.length - 1].date}|${transactions[transactions.length - 1].created_at}`
      : null;

    return NextResponse.json({
      transactions,
      total_count: count || 0,
      has_more: hasMore,
      cursor: nextCursor,
    });
  } catch (error) {
    console.error('Unexpected error in transactions API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
