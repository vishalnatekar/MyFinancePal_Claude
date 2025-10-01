# User Analytics & Business Intelligence

## Data Collection Strategy

**Privacy-First Analytics Framework:**
```typescript
// lib/analytics/privacy-first-collector.ts
interface AnalyticsEvent {
  event: string;
  userId?: string;
  sessionId: string;
  timestamp: string;
  properties: Record<string, any>;
  context: {
    page: string;
    userAgent: string;
    referrer?: string;
    viewport: { width: number; height: number };
  };
}

export class PrivacyFirstAnalytics {
  private sessionId: string;
  private userId?: string;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.userId = this.getCurrentUserId();
  }

  // Core business metrics tracking
  trackUserOnboarding(step: string, success: boolean, metadata?: Record<string, any>) {
    this.track('user_onboarding', {
      step,
      success,
      ...metadata,
    });
  }

  trackAccountConnection(provider: string, success: boolean, errorType?: string) {
    this.track('account_connection', {
      provider,
      success,
      error_type: errorType,
      timestamp: new Date().toISOString(),
    });
  }

  trackHouseholdActivity(action: string, householdSize: number, metadata?: Record<string, any>) {
    this.track('household_activity', {
      action,
      household_size: householdSize,
      ...metadata,
    });
  }

  trackExpenseSharing(ruleType: string, memberCount: number, transactionAmount: number) {
    this.track('expense_sharing', {
      rule_type: ruleType,
      member_count: memberCount,
      // Round transaction amount to protect financial privacy
      transaction_amount_range: this.categorizeAmount(transactionAmount),
    });
  }

  private categorizeAmount(amount: number): string {
    if (amount <= 10) return '0-10';
    if (amount <= 50) return '11-50';
    if (amount <= 100) return '51-100';
    if (amount <= 500) return '101-500';
    if (amount <= 1000) return '501-1000';
    return '1000+';
  }

  private sanitizeProperties(properties: Record<string, any>): Record<string, any> {
    // Remove or hash any PII
    const sanitized = { ...properties };

    // Remove sensitive financial data
    delete sanitized.account_number;
    delete sanitized.sort_code;
    delete sanitized.exact_balance;

    // Hash email addresses if present
    if (sanitized.email) {
      sanitized.email_hash = this.hashEmail(sanitized.email);
      delete sanitized.email;
    }

    return sanitized;
  }
}

// Global analytics instance
export const analytics = new PrivacyFirstAnalytics();
```

## Business Intelligence Dashboard

**Key Metrics Tracked:**
- **User Metrics:** Total users, daily/weekly/monthly active users, retention rates
- **Onboarding Funnel:** Signup to account connection, household creation, first transaction sync
- **Feature Adoption:** Household creation rates, expense rule usage, settlement completion
- **Financial Insights:** Accounts connected by type, transaction volume trends, net worth tracking
- **Technical Performance:** API response times, error rates, uptime monitoring

**Real-Time Analytics Dashboard:**
```typescript
// Interactive dashboard for business insights
export function BusinessDashboard({ userRole }: DashboardProps) {
  const [metrics, setMetrics] = useState<BusinessMetrics | null>(null);

  // Key Performance Indicators
  const kpis = [
    { name: 'Total Users', value: metrics?.userMetrics.totalUsers },
    { name: 'Active Users', value: metrics?.userMetrics.activeUsers.daily },
    { name: 'Households', value: metrics?.featureAdoption.householdCreation.totalHouseholds },
    { name: 'API Performance', value: `${metrics?.technicalMetrics.apiPerformance.averageResponseTime}ms` },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.name}>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <p className="text-sm text-muted-foreground">{kpi.name}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Onboarding Funnel Chart */}
      <Card>
        <CardHeader>
          <CardTitle>User Onboarding Funnel</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={metrics?.onboardingMetrics.dropoffPoints}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="step" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="completionRate" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
```

## Data Privacy and Compliance

**GDPR-Compliant Analytics:**
```typescript
// lib/analytics/privacy-compliance.ts
export class AnalyticsPrivacyManager {
  // Automatic data retention management
  async enforceDataRetention() {
    const retentionPeriods = {
      analytics_events: 90, // days
      user_sessions: 30,
      error_logs: 365,
      performance_metrics: 180,
    };

    for (const [table, days] of Object.entries(retentionPeriods)) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      await this.cleanupOldData(table, cutoffDate);
    }
  }

  // User data export for GDPR requests
  async exportUserData(userId: string): Promise<UserDataExport> {
    const analyticsData = await this.getUserAnalyticsEvents(userId);

    return {
      userId,
      exportDate: new Date().toISOString(),
      data: {
        analyticsEvents: this.anonymizeEvents(analyticsData),
        note: 'Financial transaction details excluded for security.',
      },
    };
  }

  // Complete user data deletion
  async deleteUserData(userId: string): Promise<DeletionReport> {
    const tablesAffected = [
      'analytics_events',
      'user_sessions',
      'performance_logs',
      'error_events',
    ];

    const deletionResults: Record<string, number> = {};

    for (const table of tablesAffected) {
      const deletedCount = await this.deleteUserDataFromTable(table, userId);
      deletionResults[table] = deletedCount;
    }

    return {
      userId,
      deletionDate: new Date().toISOString(),
      tablesAffected,
      recordsDeleted: deletionResults,
      status: 'completed',
    };
  }
}
```

**Analytics Benefits:**
- **Privacy-First Design:** Analytics collect business insights without compromising user privacy
- **Real-time Insights:** Live dashboard enables data-driven decision making
- **GDPR Compliance:** Automated data retention and user data export/deletion capabilities
- **Business Value:** Metrics directly tied to PRD success criteria and business goals
- **Technical Performance:** Analytics infrastructure designed not to impact application performance

---
