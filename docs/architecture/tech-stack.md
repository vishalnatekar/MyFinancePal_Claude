# Tech Stack

This is the **DEFINITIVE** technology selection for MyFinancePal. All AI agents must use these exact versions to ensure compatibility and success.

## Technology Stack Table

| Category | Technology | Version | Purpose | Rationale |
|----------|------------|---------|---------|-----------|
| **Runtime** | Node.js | 22+ (LTS) | JavaScript runtime | Required for Supabase compatibility (Node 18 EOL April 2025) |
| **Frontend Language** | TypeScript | 5.0+ | Type-safe development | AI agents excel with TypeScript - prevents runtime errors |
| **Frontend Framework** | Next.js | 14.2+ | Full-stack React framework | Most AI-documented pattern, API routes included |
| **React Library** | React | 18.3+ | UI component library | Stable React with Server Components support |
| **UI Component Library** | shadcn/ui | Latest | Pre-built accessible components | AI agents can copy-paste patterns, Tailwind-based |
| **State Management** | Zustand | 4.0+ | Client state management | Simpler than Redux, AI agents handle easily |
| **Backend Language** | TypeScript | 5.0+ | API routes and server logic | Same language as frontend - AI consistency |
| **Backend Framework** | Next.js API Routes | 14.2+ | Serverless API endpoints | Built-in, zero config, AI-friendly |
| **API Style** | REST | - | HTTP endpoints | Most documented for AI agents |
| **Database** | PostgreSQL | 15+ | Primary data store | Supabase managed, ACID compliance |
| **Cache** | None (V1) | - | Keep it simple | Add Redis later if needed |
| **File Storage** | Supabase Storage | Latest | Document/image uploads | Built-in, S3-compatible |
| **Authentication** | Supabase Auth | Latest | User management & Google SSO | Built-in OAuth, AI agents have examples |
| **Frontend Testing** | Jest + React Testing Library | Latest | Component and unit tests | Standard React testing, AI-documented |
| **Backend Testing** | Jest + Supertest | Latest | API endpoint testing | Node.js standard, AI examples abundant |
| **E2E Testing** | Playwright | Latest | Full user journey testing | Better than Cypress for AI agents |
| **Build Tool** | Next.js | 15.0+ | Built-in build system | Zero config, AI-friendly |
| **Bundler** | Turbopack | Latest | Next.js default bundler | Faster than Webpack, zero config |
| **IaC Tool** | None (V1) | - | Use platform defaults | Vercel + Supabase handle infrastructure |
| **CI/CD** | Vercel | Latest | Git-based deployment | Automatic on git push, AI-simple |
| **Monitoring** | Vercel Analytics | Latest | Performance monitoring | Built-in, zero config |
| **Logging** | Console + Vercel | Latest | Error tracking | Simple for V1, upgrade later |
| **CSS Framework** | Tailwind CSS | 3.0+ | Utility-first styling | AI agents trained extensively on Tailwind |

## Modern Tooling (2025 Optimizations)

**Additional tooling recommendations for enhanced AI agent development and 2025 best practices:**

| Category | Tool | Version | Purpose | AI Agent Benefits |
|----------|------|---------|---------|-------------------|
| **Code Formatting** | Biome | 1.8+ | Ultra-fast linter & formatter | Replaces ESLint + Prettier, 100x faster, AI-optimized rules |
| **URL State Management** | nuqs | 1.19+ | Next.js URL state hooks | Type-safe search params, AI agents love declarative patterns |
| **Package Manager** | Bun | 1.1+ | JavaScript runtime & package manager | 25x faster installs, compatible with npm, better for AI workflows |
| **Git Hooks** | simple-git-hooks | 2.11+ | Lightweight pre-commit hooks | AI-friendly, minimal configuration vs Husky |
| **Bundle Analyzer** | @next/bundle-analyzer | Latest | Bundle size visualization | Essential for performance optimization, AI development insights |

**Implementation Notes:**
- **Biome**: Replaces ESLint + Prettier setup, unified configuration, AI agents can work with single `.biome.json`
- **nuqs**: Perfect for AI agents handling URL state without complex state management
- **Bun**: Optional but recommended for faster development cycles, fully npm-compatible
- **simple-git-hooks**: Minimal setup for quality gates, AI agents can install/configure easily
