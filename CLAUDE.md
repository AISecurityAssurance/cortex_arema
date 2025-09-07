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
- **Styling**: CSS Modules with styled-jsx
- **Backend**: FastAPI server at localhost:8000 (../agr/serve.py)

## Development Commands

```bash
# Start development server (runs on port 3001)
npm run dev

# Type checking
npm run typecheck

# Linting
npm run lint

# Production build
npm run build

# Start production server
npm run start
```

## Backend Setup
```bash
# From ../agr directory
python serve.py  # FastAPI server runs on localhost:8000
```

## Architecture & Key Patterns

### State Management Architecture
- **Zustand stores** with typed interfaces
  - Template management: `src/stores/templateStore.ts`
  - Pipeline state: `src/app/pipeline-editor/hooks/usePipeline.tsx`
- **LocalStorage persistence** with atomic operations
  - Sessions: `src/lib/storage/sessionStorage.ts`
  - Validations: `src/lib/storage/validationStorage.ts`
- **React Context** for cross-cutting concerns
  - Toast notifications: `src/contexts/ToastContext.tsx`
  - Theme management: `src/contexts/ThemeContext.tsx`
  - Cloudscape theme: `src/contexts/CloudscapeThemeContext.tsx`

### Component Architecture
```
src/app/
├── analysis/                           # Main analysis feature
│   ├── AnalysisView.tsx               # Primary analysis orchestrator
│   └── AnalysisView-new.tsx           # Cloudscape migration version
├── pipeline-editor/                    # Visual pipeline builder
│   ├── components/                     # Pipeline-specific components
│   ├── hooks/                         # Custom React hooks
│   ├── types/                         # TypeScript types
│   └── utils/                         # Helper functions
├── templates/                          # Template management
└── sessions/                           # Session history

src/components/
├── analysis/                           # Analysis UI components
│   ├── ModelComparisonView.tsx        # Side-by-side comparison
│   └── FindingCard.tsx                # Individual finding display
├── layout/                            # Layout components
│   ├── AnalysisLayout.tsx            # Three-panel container
│   ├── CloudscapeLayout.tsx          # Cloudscape wrapper
│   └── SlidingPanel.tsx              # Resizable panels
├── validation/                        # Finding validation UI
│   ├── ValidationControls.tsx        # Main validation interface
│   ├── StatusButtons.tsx             # Status selection
│   └── RatingScale.tsx               # Multi-dimensional scoring
└── ui/                               # Reusable UI primitives
```

### Data Flow
1. User uploads image → AI validation → Session created
2. Template selected → Variables populated → Prompt generated
3. Backend API called → Models process in parallel
4. Raw responses → Finding extraction (`lib/analysis/findingExtractor.ts`)
5. Findings displayed → User validates → Progress tracked
6. Session persisted to localStorage with atomic updates

### Model Integration
Backend API endpoint: `http://localhost:8000/generate`

Request structure:
```typescript
{
  model_id: string,      // e.g., "us.anthropic.claude-opus-4-20250514-v1:0"
  prompt: string,
  images?: string[],     // Base64 encoded
  system_instructions: string
}
```

Available models configured in `src/app/analysis/AnalysisView.tsx`:
- AWS Bedrock Claude Opus 4
- AWS Bedrock Claude Sonnet 4

### Finding Extraction System
Located in `src/lib/analysis/findingExtractor.ts`:
- Extracts structured findings from unstructured model responses
- Pattern matching for severity levels (Critical, High, Medium, Low)
- Multi-format support (STRIDE categories, STPA-SEC hazards, custom formats)
- Handles various response formats from different models

### Validation System
Multi-dimensional validation with scoring:
- **Status**: confirmed, false-positive, needs-review, pending
- **Dimensions**: accuracy, completeness, relevance, actionability (1-5 scale)
- **Storage**: Persisted to localStorage via `validationStorage.ts`
- **Progress**: Automatic calculation and tracking

### Template System
Templates stored via Zustand (`src/stores/templateStore.ts`):
- **Core templates**: Built-in, read-only templates
- **User overrides**: Custom modifications to core templates
- **Draft edits**: Unsaved changes during editing
- Variable substitution: `{{variable_name}}` syntax
- Import/export functionality for sharing

## Active Migration: Cloudscape Design System

**IMPORTANT**: UI components are being migrated to AWS Cloudscape. Before modifying any UI:
1. Check `CLOUDSCAPE_MIGRATION_SPEC.md` for migration status
2. Use Cloudscape components when available
3. Preserve all existing functionality
4. Test thoroughly after changes

Current migration status:
- Phase 1: Foundation (✅ Complete)
- Phase 2: Layout & Navigation (🔄 In Progress)
- Phase 3: Core Components (📋 Planned)

When creating new components:
- Check if a Cloudscape equivalent exists
- Use Cloudscape design tokens for styling
- Follow patterns in `ModelComparisonViewCloudscape.tsx`

## Common Development Tasks

### Adding a New Model
1. Add model configuration to `ModelConfig` type in `src/types/index.ts`
2. Update `MODEL_IDS` in `src/app/analysis/AnalysisView.tsx`
3. Add to model selection dropdowns
4. Ensure backend supports the model ID

### Creating New Templates
1. Use Template Editor UI at `/templates`
2. Define variables with `{{variable_name}}` syntax
3. Set appropriate `analysisType` and `expectedOutputFormat`
4. Templates auto-save to localStorage via Zustand

### Modifying the Pipeline Editor
The pipeline editor (`/pipeline-editor`) is a complex drag-and-drop system:
- Canvas rendering: Custom React implementation
- Node types: Defined in `types/nodeConfigs.ts`
- Execution: Managed by `usePipelineExecution` hook
- Auto-layout: Uses dagre library (`utils/autoLayout.ts`)

### Working with Sessions
Sessions are managed through:
- `useAnalysisSession` hook for current session
- `sessionStorage.ts` for persistence
- Atomic operations to prevent corruption
- Session interface defined in `src/types/index.ts`

## Important Patterns to Follow

### Error Handling
```typescript
try {
  // Operation
} catch (error) {
  console.error('Descriptive error:', error);
  toast.error('User-friendly message');
}
```

### Component Structure
```typescript
'use client';  // For interactive components

import { ComponentProps } from '@/types';

export const Component: React.FC<ComponentProps> = ({ prop1, prop2 }) => {
  // Hooks first
  const state = useState();
  
  // Effects next
  useEffect(() => {}, []);
  
  // Handlers
  const handleAction = () => {};
  
  // Render
  return <div>...</div>;
};
```

### Type Safety
- Never use `any` - use `unknown` and type guards instead
- Define interfaces for all data structures
- Use strict TypeScript configuration
- Validate external data (API responses, localStorage)

### LocalStorage Operations
Always use atomic operations to prevent data corruption:
```typescript
const data = localStorage.getItem(key);
if (data) {
  const parsed = JSON.parse(data);
  // Validate structure
  // Process data
  localStorage.setItem(key, JSON.stringify(updated));
}
```

## Debugging Tips

### Common Issues and Solutions
- **Toast notifications not showing**: Verify `ToastProvider` wraps the component tree
- **Infinite re-renders**: Check useEffect dependencies, especially object/array comparisons
- **Session persistence issues**: Clear localStorage if corrupted: `localStorage.clear()`
- **Model API errors**: Verify backend is running (`http://localhost:8000`)
- **Cloudscape styling conflicts**: Check component is wrapped in CloudscapeLayout
- **Finding extraction failures**: Check console for parsing errors in `findingExtractor.ts`

### Debug Logging
Console logging is intentionally kept enabled for development. Use descriptive messages:
```typescript
console.log('[ComponentName] Action description:', data);
console.error('[ComponentName] Error context:', error);
```

## Security Considerations
- No API keys or secrets in frontend code
- Image validation before processing (size, type)
- Input sanitization for prompts
- CORS restricted to localhost
- Template variables sanitized before substitution

## Performance Considerations
- Use React.memo for expensive components
- Implement virtualization for long lists
- Lazy load heavy components with dynamic imports
- Debounce localStorage writes
- Use Cloudscape's built-in optimizations where available