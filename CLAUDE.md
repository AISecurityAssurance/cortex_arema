# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
Cortex Arena is a security analysis platform that compares threat assessments from multiple Claude AI models. Users upload architecture diagrams, select analysis templates (STRIDE, STPA-Sec, or custom), and receive comparative security findings from different models.

## Tech Stack
- **Framework**: Next.js 15.4.2 with App Router
- **React**: 19.1.0
- **TypeScript**: 5.9.2 (strict mode)
- **State Management**: Zustand 5.0.6
- **UI Framework**: AWS Cloudscape Design System (active migration - see CLOUDSCAPE_MIGRATION_SPEC.md)
- **Backend**: FastAPI server at localhost:8000

## Development Commands

```bash
# Start development server
npm run dev

# Type checking
npm run typecheck

# Linting
npm run lint

# Production build
npm run build
```

## Architecture & Key Patterns

### State Management Architecture
- **Zustand stores** for templates (`lib/storage/templateStore.ts`)
- **LocalStorage persistence** for sessions (`lib/storage/sessionStorage.ts`)
- **React Context** for cross-cutting concerns (Toast notifications, Theme)

### Component Architecture
```
src/app/analysis/AnalysisView.tsx      # Main analysis orchestrator
src/components/layout/AnalysisLayout.tsx # Three-panel layout container
src/components/analysis/ModelComparisonView.tsx # Side-by-side model results
src/components/validation/ValidationControls.tsx # Finding validation UI
```

### Data Flow
1. User uploads image → AI validation → Session created
2. Template selected → Prompt generated → Models called in parallel
3. Results parsed → Findings extracted → Displayed for comparison
4. User validates findings → Progress tracked → Session persisted

### Session Management
Sessions are persisted to localStorage with atomic operations to prevent data corruption. Each session contains:
- Model selections (A/B comparison)
- Analysis results from both models
- Validation data with multi-dimensional scoring
- Progress metrics

## Critical Implementation Details

### Model Integration
Backend API at `http://localhost:8000/generate` expects:
```typescript
{
  model_id: string,      // e.g., "us.anthropic.claude-opus-4-20250514-v1:0"
  prompt: string,
  images?: string[],     // Base64 encoded
  system_instructions: string
}
```

### Finding Extraction
The system extracts structured findings from unstructured model responses using:
- Pattern matching for severity levels (Critical, High, Medium, Low)
- Multi-format support (STRIDE categories, STPA-SEC hazards, custom formats)
- Located in `src/lib/analysis/findingExtractor.ts`

### Validation System
Findings are validated with:
- Status: confirmed, false-positive, needs-review, pending
- Multi-dimensional scoring: accuracy, completeness, relevance, actionability
- Progress tracking with automatic calculation

## Active Migration: Cloudscape Design System

**IMPORTANT**: UI components are being migrated to AWS Cloudscape. Before modifying any UI:
1. Check `CLOUDSCAPE_MIGRATION_SPEC.md` for migration status
2. Use Cloudscape components when available
3. Preserve all existing functionality
4. Test thoroughly after changes

Migration phases:
- Phase 1: Foundation (✅ Complete)
- Phase 2: Layout & Navigation (🔄 In Progress)
- Phase 3: Core Components (📋 Planned)

## Common Development Tasks

### Adding a New Model
1. Add model configuration to `src/types/index.ts` (ModelConfig)
2. Update model lists in `src/app/analysis/AnalysisView.tsx`
3. Ensure backend supports the model ID

### Creating New Templates
1. Use the Template Editor UI at `/templates`
2. Templates support variables like `{{threat_type}}`, `{{analysis_scope}}`
3. Templates are stored in localStorage via Zustand

### Debugging Tips
- **Toast notifications not showing**: Verify ToastProvider wraps the component
- **Infinite loops**: Check useEffect dependencies, especially object comparisons
- **Session persistence issues**: Clear localStorage if corrupted
- **Model errors**: Verify backend is running and accessible

## Important Patterns to Follow

### Error Handling
- Use toast notifications for user feedback
- Wrap async operations in try-catch blocks
- Log errors to console (debug logging is intentionally kept enabled)

### Component Guidelines
- Use "use client" directive for interactive components
- Keep components focused and single-purpose
- Use absolute imports with @ alias
- Follow existing naming conventions (e.g., `ModelComparisonView`, not `ModelComparison`)

### Type Safety
- Never use `any` type
- Define interfaces for all data structures
- Use strict TypeScript configuration
- Validate external data (API responses, localStorage)

## Security Considerations
- No API keys or secrets in frontend code
- Image validation before processing
- Input sanitization for prompts
- CORS restricted to localhost

## Testing Strategy
Currently no automated tests exist. When implementing tests:
- Unit tests for utility functions
- Component tests for React components
- Integration tests for API interactions
- E2E tests for critical user workflows