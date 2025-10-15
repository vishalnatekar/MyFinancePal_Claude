// Splitting Rules List Component
// Story 4.1: Expense Splitting Rules Engine

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Edit, Trash2, GripVertical, Play } from 'lucide-react';
import type { SplittingRuleWithCreator } from '@/types/splitting-rule';
import { CreateRuleDialog } from './CreateRuleDialog';

interface SplittingRulesListProps {
  householdId: string;
  showCreateDialog: boolean;
  onCloseCreateDialog: () => void;
}

export function SplittingRulesList({
  householdId,
  showCreateDialog,
  onCloseCreateDialog,
}: SplittingRulesListProps) {
  const [rules, setRules] = useState<SplittingRuleWithCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch rules
  useEffect(() => {
    fetchRules();
  }, [householdId]);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/households/${householdId}/rules?order_by=priority`);

      if (!response.ok) {
        throw new Error('Failed to fetch rules');
      }

      const data = await response.json();
      setRules(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load rules');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (ruleId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/households/${householdId}/rules/${ruleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update rule');
      }

      // Refresh rules
      fetchRules();
    } catch (err) {
      console.error('Error toggling rule:', err);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this rule? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/households/${householdId}/rules/${ruleId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete rule');
      }

      // Refresh rules
      fetchRules();
    } catch (err) {
      console.error('Error deleting rule:', err);
    }
  };

  const getRuleTypeBadge = (ruleType: string) => {
    const colors = {
      merchant: 'bg-blue-100 text-blue-800',
      category: 'bg-green-100 text-green-800',
      amount_threshold: 'bg-orange-100 text-orange-800',
      default: 'bg-gray-100 text-gray-800',
    };

    return (
      <Badge className={colors[ruleType as keyof typeof colors] || colors.default}>
        {ruleType.replace('_', ' ')}
      </Badge>
    );
  };

  const getSplitSummary = (splitPercentage: Record<string, number>) => {
    const entries = Object.entries(splitPercentage);
    if (entries.length === 0) return 'No split defined';

    if (entries.length === 2 && entries[0][1] === 50 && entries[1][1] === 50) {
      return '50/50 split';
    }

    return entries.map(([, pct]) => `${pct}%`).join(' / ');
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Loading rules...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {rules.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <p className="text-muted-foreground mb-4">
                  No splitting rules created yet
                </p>
                <p className="text-sm text-muted-foreground">
                  Create your first rule to automatically split shared expenses
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          rules.map((rule) => (
            <Card key={rule.id} className={!rule.is_active ? 'opacity-60' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <Button variant="ghost" size="icon" className="cursor-move">
                      <GripVertical className="h-4 w-4" />
                    </Button>
                    <div>
                      <CardTitle className="text-lg">{rule.rule_name}</CardTitle>
                      <CardDescription className="mt-1">
                        Priority {rule.priority} • Created by {rule.creator_name || 'Unknown'}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getRuleTypeBadge(rule.rule_type)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Rule criteria */}
                  <div className="text-sm">
                    <span className="font-medium">Matches: </span>
                    {rule.rule_type === 'merchant' && (
                      <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                        {rule.merchant_pattern}
                      </span>
                    )}
                    {rule.rule_type === 'category' && (
                      <span className="capitalize">{rule.category_match}</span>
                    )}
                    {rule.rule_type === 'amount_threshold' && (
                      <span>
                        {rule.min_amount && `≥ £${rule.min_amount}`}
                        {rule.max_amount && ` and ≤ £${rule.max_amount}`}
                      </span>
                    )}
                    {rule.rule_type === 'default' && (
                      <span className="text-muted-foreground">All transactions</span>
                    )}
                  </div>

                  {/* Split percentage */}
                  <div className="text-sm">
                    <span className="font-medium">Split: </span>
                    <span>{getSplitSummary(rule.split_percentage)}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={rule.is_active}
                        onCheckedChange={() => handleToggleActive(rule.id, rule.is_active)}
                      />
                      <span className="text-sm text-muted-foreground">
                        {rule.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteRule(rule.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <CreateRuleDialog
        householdId={householdId}
        open={showCreateDialog}
        onClose={onCloseCreateDialog}
        onRuleCreated={fetchRules}
      />
    </>
  );
}
