# Development Team Guidelines

## AI Agent Onboarding and Management

**AI Agent Setup Checklist:**
```markdown
# AI Agent Onboarding Checklist

# 🤖 Agent Setup Requirements

## 1. Access Credentials
- [ ] GitHub repository access with appropriate permissions
- [ ] Supabase project access (development environment)
- [ ] Vercel deployment access (view-only for new agents)
- [ ] TrueLayer sandbox API credentials
- [ ] Access to shared documentation and standards

## 2. Development Environment
- [ ] Node.js 22+ installed locally (required for Supabase compatibility)
- [ ] Git configured with proper author information
- [ ] VS Code with 2025 development setup:
  **Core Extensions:**
  - [ ] Biome (biomejs.biome) - Unified linting & formatting
  - [ ] TypeScript Importer (pmneo.tsimporter) - Auto import organization
  - [ ] Tailwind CSS IntelliSense (bradlc.vscode-tailwindcss) - Class completion
  - [ ] Auto Rename Tag (formulahendry.auto-rename-tag) - HTML/JSX productivity
  - [ ] GitLens (eamodio.gitlens) - Enhanced Git capabilities

  **Next.js/React Specific:**
  - [ ] ES7+ React/Redux/React-Native snippets (dsznajder.es7-react-js-snippets)
  - [ ] React Developer Tools (ms-vscode.vscode-react-native) - Component debugging
  - [ ] Next.js snippets (PulkitGangwar.nextjs-snippets) - Framework shortcuts

  **Database & APIs:**
  - [ ] Thunder Client (rangav.vscode-thunder-client) - API testing
  - [ ] PostgreSQL (ms-ossdata.vscode-postgresql) - Database queries
  - [ ] Supabase Snippets (supabase.supabase-snippets) - Platform integration

  **AI Agent Productivity:**
  - [ ] Error Lens (usernamehw.errorlens) - Inline error display
  - [ ] Bracket Pair Colorizer 2 (CoenraadS.bracket-pair-colorizer-2) - Code navigation
  - [ ] Path Intellisense (christian-kohler.path-intellisense) - File path completion
  - [ ] Auto Import - ES6, TS, JSX, TSX (steoates.autoimport) - Smart imports

**VS Code Workspace Configuration (.vscode/settings.json):**
```json
{
  "typescript.preferences.useAliasesForRenames": false,
  "typescript.suggest.autoImports": true,
  "typescript.updateImportsOnFileMove.enabled": "always",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll": true,
    "source.organizeImports": true
  },
  "biome.enabled": true,
  "biome.formatOnSave": true,
  "biome.lintOnSave": true,
  "tailwindCSS.includeLanguages": {
    "typescript": "javascript",
    "typescriptreact": "javascript"
  },
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
    ["cx\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ],
  "files.associations": {
    "*.css": "tailwindcss"
  },
  "emmet.includeLanguages": {
    "typescript": "typescriptreact",
    "javascript": "javascriptreact"
  },
  "git.autofetch": true,
  "git.enableSmartCommit": true,
  "explorer.fileNesting.enabled": true,
  "explorer.fileNesting.patterns": {
    "*.ts": "${capture}.js, ${capture}.d.ts.map, ${capture}.d.ts, ${capture}.js.map",
    "*.tsx": "${capture}.ts, ${capture}.js",
    "package.json": "package-lock.json, yarn.lock, pnpm-lock.yaml, bun.lockb"
  }
}
```

**VS Code Tasks Configuration (.vscode/tasks.json):**
```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "type": "npm",
      "script": "dev",
      "group": "build",
      "label": "Start Development Server",
      "detail": "Run Next.js development server"
    },
    {
      "type": "npm",
      "script": "ai:setup",
      "group": "build",
      "label": "AI Agent Setup",
      "detail": "Complete project setup for AI agents"
    },
    {
      "type": "npm",
      "script": "check",
      "group": "test",
      "label": "Run All Checks",
      "detail": "Lint, type-check, and test"
    },
    {
      "type": "npm",
      "script": "db:studio",
      "group": "build",
      "label": "Open Database Studio",
      "detail": "Launch Supabase Studio"
    }
  ]
}
```

## 3. Project Knowledge
- [ ] Read complete architecture document (docs/architecture.md)
- [ ] Review PRD and understand business requirements
- [ ] Study code style guide and naming conventions
- [ ] Understand database schema and RLS policies
- [ ] Review API documentation and test endpoints
```

**Agent Specialization Areas:**

**Frontend Specialist Agent:**
- React component development using shadcn/ui
- State management with Zustand
- Form handling and validation
- Real-time UI updates via Supabase subscriptions
- Mobile-responsive design implementation

**Backend Specialist Agent:**
- API route development with proper error handling
- Database schema design and RLS policy creation
- External API integration (TrueLayer, Google OAuth)
- Business logic implementation
- Performance optimization and caching

**Full-Stack Agent:**
- End-to-end feature implementation
- Cross-stack debugging and optimization
- Integration testing and quality assurance
- Documentation and code review
- Deployment and monitoring

## Code Review Process

**Automated Review Checklist:**
```markdown
# 🔍 Pull Request Checklist

## Code Quality
- [ ] Code follows established naming conventions
- [ ] TypeScript types are properly defined (no `any` types)
- [ ] Error handling implemented according to standards
- [ ] Input validation using Zod schemas
- [ ] Database queries use RLS policies appropriately

## Testing
- [ ] Unit tests written for new functionality
- [ ] Integration tests updated if API changes
- [ ] E2E tests added for new user workflows
- [ ] All tests passing locally
- [ ] No console errors in browser during manual testing

## Security
- [ ] No sensitive data exposed in code or logs
- [ ] Authentication required for protected endpoints
- [ ] Input sanitization implemented
- [ ] RLS policies protect data access
- [ ] Environment variables used for configuration

## Business Logic
- [ ] Implementation matches PRD requirements
- [ ] Edge cases handled appropriately
- [ ] User experience flow validated
- [ ] Privacy controls working correctly
- [ ] Financial calculations verified for accuracy
```

## Agent Collaboration Guidelines

**Communication Standards:**
- **Commit Messages:** Use conventional commit format
  - `feat: add household invitation system`
  - `fix: resolve settlement calculation bug`
  - `docs: update API documentation`
  - `test: add transaction categorization tests`

- **Branch Naming:** Follow pattern `<agent-id>/<feature-type>/<brief-description>`
  - `frontend-agent/feature/household-dashboard`
  - `backend-agent/fix/auth-token-refresh`
  - `fullstack-agent/refactor/error-handling`

**Quality Standards for AI Agents:**
- **Test Coverage:** Minimum 80% for new code
- **TypeScript Strict:** No `any` types, all interfaces defined
- **Performance:** No regression in page load times
- **Financial Calculations:** 100% accuracy required
- **Privacy Controls:** RLS policies thoroughly tested

**Escalation Procedures:**
- **Security Concerns:** Immediately escalate any potential security issues
- **Performance Degradation:** Alert if response times increase significantly
- **Data Inconsistencies:** Report any financial calculation discrepancies
- **External API Issues:** Notify team of TrueLayer or other service problems
- **Architecture Questions:** Escalate decisions that affect system design
