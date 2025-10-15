// Household Rules Management Page
// Story 4.1: Expense Splitting Rules Engine

'use client';

import { use } from 'react';
import { SplittingRulesList } from '@/components/rules/SplittingRulesList';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useState } from 'react';

export default function HouseholdRulesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const householdId = resolvedParams.id;
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Expense Splitting Rules</h1>
          <p className="text-muted-foreground mt-2">
            Automate how shared expenses are split with your household members
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Rule
        </Button>
      </div>

      <SplittingRulesList
        householdId={householdId}
        showCreateDialog={showCreateDialog}
        onCloseCreateDialog={() => setShowCreateDialog(false)}
      />
    </div>
  );
}
