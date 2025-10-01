# API Documentation Standards

## OpenAPI Generation and Maintenance

**Automated OpenAPI Specification:**
```typescript
// Auto-generated OpenAPI from Zod schemas
import { z } from 'zod';
import { createDocument } from 'zod-openapi';

// Define schemas that serve both validation and documentation
export const CreateHouseholdSchema = z.object({
  name: z.string().min(1).max(100).describe('Household name (e.g., "The Smith Family")'),
  description: z.string().max(500).optional().describe('Optional household description'),
  settlement_day: z.number().int().min(1).max(31).default(1).describe('Day of month for settlements (1-31)'),
}).openapi({
  title: 'CreateHouseholdRequest',
  description: 'Request body for creating a new household',
  example: {
    name: 'The Smith Family',
    description: 'Our family household for shared expenses',
    settlement_day: 15,
  },
});

export const HouseholdResponseSchema = z.object({
  id: z.string().uuid().describe('Unique household identifier'),
  name: z.string().describe('Household name'),
  description: z.string().nullable().describe('Household description'),
  created_by: z.string().uuid().describe('ID of user who created household'),
  settlement_day: z.number().int().describe('Monthly settlement day'),
  created_at: z.string().datetime().describe('Household creation timestamp'),
  member_count: z.number().int().describe('Number of household members'),
}).openapi({
  title: 'Household',
  description: 'Household information with member count',
  example: {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'The Smith Family',
    description: 'Our family household for shared expenses',
    created_by: '550e8400-e29b-41d4-a716-446655440001',
    settlement_day: 15,
    created_at: '2025-01-15T10:30:00Z',
    member_count: 2,
  },
});
```

## API Documentation Generation Workflow

**Automated Documentation Pipeline:**
```typescript
// scripts/generate-api-docs.ts
import fs from 'fs/promises';
import path from 'path';
import { apiDocumentation } from '../src/lib/api-documentation';

async function generateApiDocumentation() {
  try {
    // Generate OpenAPI JSON
    const openApiJson = JSON.stringify(apiDocumentation, null, 2);
    await fs.writeFile(
      path.join(process.cwd(), 'docs/api/openapi.json'),
      openApiJson
    );

    // Generate OpenAPI YAML
    const yaml = require('js-yaml');
    const openApiYaml = yaml.dump(apiDocumentation);
    await fs.writeFile(
      path.join(process.cwd(), 'docs/api/openapi.yaml'),
      openApiYaml
    );

    // Generate Markdown documentation
    const markdownDocs = await generateMarkdownDocs(apiDocumentation);
    await fs.writeFile(
      path.join(process.cwd(), 'docs/api/README.md'),
      markdownDocs
    );

    console.log('✅ API documentation generated successfully');
  } catch (error) {
    console.error('❌ Failed to generate API documentation:', error);
    process.exit(1);
  }
}

// Add to package.json scripts:
// "docs:api": "tsx scripts/generate-api-docs.ts"
```

## Interactive API Documentation

**Swagger UI Integration:**
```typescript
// app/api/docs/route.ts - Serve interactive API docs
export async function GET(request: NextRequest) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>MyFinancePal API Documentation</title>
      <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui.css" />
    </head>
    <body>
      <div id="swagger-ui"></div>
      <script src="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-bundle.js"></script>
      <script>
        SwaggerUIBundle({
          url: '/api/docs/openapi.json',
          dom_id: '#swagger-ui',
          deepLinking: true,
          tryItOutEnabled: true,
          requestInterceptor: (request) => {
            // Add authentication header for try-it-out functionality
            const token = localStorage.getItem('auth-token');
            if (token) {
              request.headers['Authorization'] = 'Bearer ' + token;
            }
            return request;
          }
        });
      </script>
    </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' },
  });
}
```

## API Client SDK Generation

**TypeScript SDK Auto-Generation:**
- Automated TypeScript client generation from OpenAPI spec
- Type-safe API calls with IntelliSense support
- Authentication handling built into generated client
- Automatic updates when API changes

**SDK Usage Example:**
```typescript
import { MyFinancePalClient } from '@myfinancepal/sdk';

const client = new MyFinancePalClient({
  baseUrl: 'https://api.myfinancepal.com',
  authToken: 'your-jwt-token',
});

// Type-safe API calls
const households = await client.households.getHouseholds();
const newHousehold = await client.households.createHousehold({
  name: 'New Household',
  settlement_day: 15,
});
```
