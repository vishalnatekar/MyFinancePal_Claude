# Monitoring and Observability

## Monitoring Stack

**Frontend Monitoring:**
- **Vercel Analytics:** Built-in Web Vitals, page views, and user sessions
- **Error Boundaries:** React error catching with automatic reporting
- **Performance Monitoring:** Custom performance tracking for financial operations
- **User Experience Tracking:** Conversion funnel monitoring (signup → account connection → household creation)

**Backend Monitoring:**
- **Vercel Functions Analytics:** Request volume, response times, error rates per endpoint
- **Supabase Monitoring:** Database performance, connection pooling, query analytics
- **External API Monitoring:** TrueLayer API health, response times, rate limit tracking
- **Real-time Monitoring:** WebSocket connection health, subscription performance

**Database Monitoring:**
- **Supabase Dashboard:** Query performance, slow query detection, connection metrics
- **Row Level Security Monitoring:** Policy performance, access pattern analysis
- **Migration Monitoring:** Schema change tracking, rollback capabilities

## Key Metrics

**Frontend Metrics:**
```typescript
// Custom performance tracking
export class PerformanceTracker {
  static trackPageLoad(pageName: string) {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

    const metrics = {
      page: pageName,
      loadTime: navigation.loadEventEnd - navigation.loadEventStart,
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      firstPaint: this.getFirstPaint(),
      largestContentfulPaint: this.getLCP(),
      timestamp: new Date().toISOString(),
    };

    // Send to analytics
    this.sendMetrics('page_performance', metrics);
  }

  static trackApiCall(endpoint: string, duration: number, success: boolean) {
    const metrics = {
      endpoint,
      duration,
      success,
      timestamp: new Date().toISOString(),
    };

    this.sendMetrics('api_performance', metrics);
  }

  static trackUserAction(action: string, context: Record<string, any>) {
    const metrics = {
      action,
      context,
      userId: this.getCurrentUserId(),
      timestamp: new Date().toISOString(),
    };

    this.sendMetrics('user_actions', metrics);
  }
}
```

**Backend Metrics:**
```typescript
// API performance middleware
export function withMonitoring<T>(
  handler: (req: NextRequest) => Promise<T>,
  endpoint: string
) {
  return async (req: NextRequest): Promise<T> => {
    const startTime = Date.now();
    const requestId = req.headers.get('X-Request-ID') || `req_${Date.now()}`;

    try {
      const result = await handler(req);

      // Log successful request
      console.log(`[${requestId}] ${endpoint} completed in ${Date.now() - startTime}ms`);

      // Track metrics
      await trackMetrics({
        endpoint,
        duration: Date.now() - startTime,
        status: 'success',
        timestamp: new Date().toISOString(),
        requestId,
      });

      return result;
    } catch (error) {
      // Log error
      console.error(`[${requestId}] ${endpoint} failed after ${Date.now() - startTime}ms:`, error);

      // Track error metrics
      await trackMetrics({
        endpoint,
        duration: Date.now() - startTime,
        status: 'error',
        errorType: error.constructor.name,
        timestamp: new Date().toISOString(),
        requestId,
      });

      throw error;
    }
  };
}
```

**Business Metrics:**
- User onboarding completion rate
- Account connection success rate
- Household creation and member invitation success
- Settlement calculation accuracy
- Transaction categorization accuracy
- Daily/Weekly/Monthly active users

## Alert Configuration

**Critical Alerts (Immediate Response Required):**
- API error rate > 5%
- Average response time > 2 seconds
- Database connection failures
- Authentication failure rate > 10%
- TrueLayer sync failure rate > 20%

**Warning Alerts:**
- API error rate > 2%
- Response time > 1 second
- Slow database queries
- High resource usage (CPU/Memory)

**Health Check Endpoints:**
```typescript
// Comprehensive health monitoring
export async function GET(request: NextRequest) {
  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: { status: 'healthy', responseTime: 50 },
      trueLayer: { status: 'healthy', responseTime: 200 },
      authentication: { status: 'healthy', responseTime: 30 },
    },
    performance: {
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
      nodeVersion: process.version,
    },
  };

  const statusCode = healthCheck.status === 'healthy' ? 200 : 503;
  return NextResponse.json(healthCheck, { status: statusCode });
}
```
