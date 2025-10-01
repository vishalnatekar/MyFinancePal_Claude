# API Specification

Based on our REST API choice and the data models above, here's the complete API specification for MyFinancePal:

## REST API Specification

```yaml
openapi: 3.0.0
info:
  title: MyFinancePal API
  version: 1.0.0
  description: Privacy-first household expense management API
servers:
  - url: https://myfinancepal.vercel.app/api
    description: Production API
  - url: http://localhost:3000/api
    description: Development API

paths:
  # Authentication
  /auth/callback:
    get:
      summary: Handle OAuth callback from Google
      parameters:
        - name: code
          in: query
          required: true
          schema:
            type: string
      responses:
        '302':
          description: Redirect to dashboard
        '400':
          description: OAuth error

  # User Management
  /user/profile:
    get:
      summary: Get current user profile
      security:
        - bearerAuth: []
      responses:
        '200':
          description: User profile data
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'

  # Household Management
  /households:
    get:
      summary: Get user's households
      security:
        - bearerAuth: []
      responses:
        '200':
          description: List of households
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Household'

    post:
      summary: Create new household
      security:
        - bearerAuth: []
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                name:
                  type: string
                description:
                  type: string
      responses:
        '201':
          description: Household created

  # Financial Accounts
  /accounts:
    get:
      summary: Get user's financial accounts
      security:
        - bearerAuth: []
      responses:
        '200':
          description: List of accounts
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/FinancialAccount'

  # Transactions
  /transactions:
    get:
      summary: Get transactions for user's accounts
      security:
        - bearerAuth: []
      parameters:
        - name: household_view
          in: query
          schema:
            type: boolean
      responses:
        '200':
          description: List of transactions

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    User:
      type: object
      properties:
        id:
          type: string
        email:
          type: string
        full_name:
          type: string

    Household:
      type: object
      properties:
        id:
          type: string
        name:
          type: string
        description:
          type: string

    FinancialAccount:
      type: object
      properties:
        id:
          type: string
        account_type:
          type: string
        account_name:
          type: string
        current_balance:
          type: number
        is_shared:
          type: boolean
```
