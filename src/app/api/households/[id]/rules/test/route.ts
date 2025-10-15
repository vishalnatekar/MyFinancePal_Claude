// Rule Testing API Route
// Story 4.1: Expense Splitting Rules Engine
// Route: POST /api/households/[id]/rules/test

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { authenticateRequest } from '@/lib/auth-middleware';
import { TestRuleSchema } from '@/lib/splitting-rule-validation';
import { testDraftRule } from '@/services/rule-matching-service';
import type { Transaction } from '@/types/transaction';

/**
 * POST /api/households/[id]/rules/test
 * Test a draft rule against recent transactions (dry-run, no database changes)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user
    const authResult = await authenticateRequest(request);
    if (!authResult.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const householdId = params.id;
    const body = await request.json();

    // Validate request body
    const validation = TestRuleSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.errors
        },
        { status: 400 }
      );
    }

    const { rule: draftRule } = validation.data;
    const supabase = await createClient();

    // Verify user is a household member
    const { data: membership } = await supabase
      .from('household_members')
      .select('id')
      .eq('household_id', householdId)
      .eq('user_id', authResult.user.id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: 'Not a member of this household' },
        { status: 403 }
      );
    }

    // Get household members' accounts
    const { data: members } = await supabase
      .from('household_members')
      .select('user_id')
      .eq('household_id', householdId);

    const userIds = members?.map(m => m.user_id) || [];

    if (userIds.length === 0) {
      return NextResponse.json(
        { error: 'No household members found' },
        { status: 400 }
      );
    }

    // Fetch household members' accounts
    const { data: accounts } = await supabase
      .from('financial_accounts')
      .select('id')
      .in('user_id', userIds);

    const accountIds = accounts?.map(a => a.id) || [];

    if (accountIds.length === 0) {
      return NextResponse.json({
        rule: draftRule,
        matching_transactions: [],
        match_count: 0,
        total_amount: 0,
        date_range: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString(),
        },
      });
    }

    // Fetch last 30 days of transactions
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .in('account_id', accountIds)
      .gte('date', thirtyDaysAgo)
      .order('date', { ascending: false });

    if (txError) {
      console.error('Error fetching transactions:', txError);
      return NextResponse.json(
        { error: 'Failed to fetch transactions' },
        { status: 500 }
      );
    }

    if (!transactions || transactions.length === 0) {
      return NextResponse.json({
        rule: draftRule,
        matching_transactions: [],
        match_count: 0,
        total_amount: 0,
        date_range: {
          start: thirtyDaysAgo,
          end: new Date().toISOString(),
        },
      });
    }

    // Test draft rule against transactions
    const matchingTransactions = transactions.filter(tx =>
      testDraftRule(draftRule, tx as Transaction)
    );

    // Calculate total amount
    const totalAmount = matchingTransactions.reduce(
      (sum, tx) => sum + Math.abs(tx.amount),
      0
    );

    // Limit to first 20 transactions for preview
    const previewTransactions = matchingTransactions.slice(0, 20);

    return NextResponse.json({
      rule: draftRule,
      matching_transactions: previewTransactions,
      match_count: matchingTransactions.length,
      total_amount: totalAmount,
      date_range: {
        start: thirtyDaysAgo,
        end: new Date().toISOString(),
      },
      preview_note: matchingTransactions.length > 20
        ? `Showing first 20 of ${matchingTransactions.length} matching transactions`
        : undefined,
    });

  } catch (error) {
    console.error('Error in POST /api/households/[id]/rules/test:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
