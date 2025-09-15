# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
Cortex Arena is a security analysis platform that compares threat assessments from multiple AI models. Users upload architecture diagrams, select analysis templates (STRIDE, STPA-Sec, or custom), and receive comparative security findings from different models.

## Tech Stack
- **Framework**: Next.js 15.4.2 with App Router
- **TypeScript**: 5.9.2 (strict mode enabled)
- **State Management**: Zustand 5.0.6
- **UI Libraries**: Radix UI, Lucide React icons, Tailwind CSS
- **Backend**: FastAPI server at localhost:8000 (../agr directory)

## Development Commands

```bash
# Frontend (runs on port 3001)
npm run dev          # Start development server with Turbopack
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run typecheck    # TypeScript type checking (tsc --noEmit)

# Backend (from ../agr directory)
python agr.py        # FastAPI server on localhost:8000
# Alternative: python serve.py
```

## Architecture Overview

### Core Data Flow
1. User uploads architecture diagram → Image validation
2. Template selection → Variable substitution → Prompt generation
3. Backend API (`/generate`) → Parallel model processing
4. Raw responses → Finding extraction (`lib/analysis/findingExtractor.ts`)
5. Findings display → User validation → Session persistence

### State Management
- **Zustand stores**: Template management (`stores/templateStore.ts`), Pipeline state
- **LocalStorage**: Atomic operations for sessions and validations
- **React Context**: Toast notifications, Theme management

### Key Directories
```
src/
├── app/                    # Next.js App Router pages
│   ├── analysis/          # Main analysis feature with model comparison
│   ├── pipeline-editor/   # Visual pipeline builder (drag-and-drop)
│   ├── templates/         # Template CRUD operations
│   └── sessions/          # Session history and management
├── components/            # Reusable UI components
│   ├── analysis/          # Model comparison, finding cards
│   ├── validation/        # Multi-dimensional validation UI
│   └── layout/           # Three-panel layout, sliding panels
├── lib/                   # Core business logic
│   ├── analysis/         # Finding extraction from model responses
│   └── storage/          # LocalStorage persistence utilities
└── stores/               # Zustand state management
```

## Model Configuration

Backend endpoint: `http://localhost:8000/generate`

Request structure:
```typescript
{
  model_id: string,           // e.g., "us.anthropic.claude-opus-4-20250514-v1:0"
  prompt: string,
  images?: string[],          // Base64 encoded
  system_instructions: string
}
```

Available models in `src/app/analysis/AnalysisView.tsx`:
- AWS Bedrock: Claude Opus 4, Claude Sonnet 4, Claude 3.5 Sonnet, Nova Pro, Nova Lite, Llama 3.2, Pixtral Large
- Ollama: Llava, Llama 3.2, Llama 3.2 Vision, Qwen 2.5
- Azure OpenAI: GPT-4o, GPT-4o Mini, GPT-4 Vision, GPT-4 Turbo, GPT-3.5 Turbo, O1 Preview, O1 Mini

### Model Provider Configuration
Model providers are configured through the Settings UI (`src/components/settings/`):
- AWS Bedrock: Requires AWS credentials and region
- Ollama: Local model server endpoint
- Azure OpenAI: API key and endpoint configuration

## Finding Extraction System

The finding extractor (`src/lib/analysis/findingExtractor.ts`) parses unstructured model responses into structured findings:
- Pattern matching for severity levels (Critical/High/Medium/Low)
- Support for STRIDE categories, STPA-SEC hazards, custom formats
- Handles varied response formats from different models

## Template System

Templates use `{{variable_name}}` syntax for substitution:
- **Core templates**: Built-in, read-only (STRIDE, STPA-Sec)
- **User overrides**: Custom modifications stored in Zustand
- **Draft edits**: Unsaved changes during editing sessions

## Validation System

Multi-dimensional validation scoring:
- **Statuses**: confirmed, false-positive, needs-review, pending
- **Dimensions**: accuracy, completeness, relevance, actionability (1-5 scale)
- **Persistence**: LocalStorage via `validationStorage.ts`

## Pipeline Editor

Complex drag-and-drop system (`/pipeline-editor`):
- **Canvas**: Custom React implementation with node/edge rendering
- **Node types**: Defined in `types/nodeConfigs.ts`
- **Execution**: `usePipelineExecution` hook manages pipeline runs
- **Auto-layout**: dagre library (`utils/autoLayout.ts`)

## Important Patterns

### Error Handling
```typescript
try {
  // Operation
} catch (error) {
  console.error('[ComponentName] Error context:', error);
  toast.error('User-friendly message');
}
```

### LocalStorage Operations
Always use atomic operations:
```typescript
const data = localStorage.getItem(key);
if (data) {
  const parsed = JSON.parse(data);
  // Validate structure
  localStorage.setItem(key, JSON.stringify(updated));
}
```

### Component Structure
```typescript
'use client';  // Required for interactive components

export const Component: React.FC<Props> = ({ prop1, prop2 }) => {
  // Hooks first
  // Effects next
  // Handlers
  // Render
};
```

## Common Tasks

### Adding a New Model
1. Add to `MODEL_IDS` in `src/app/analysis/AnalysisView.tsx`
2. Ensure backend supports the model ID
3. Model automatically appears in UI dropdowns

### Creating Templates
1. Use Template Editor UI at `/templates`
2. Define variables with `{{variable_name}}` syntax
3. Set `analysisType` and `expectedOutputFormat`
4. Auto-saves to localStorage via Zustand

### Debugging

Common issues:
- **Toast notifications not showing**: Check `ToastProvider` wrapper
- **Session persistence issues**: Clear localStorage if corrupted
- **Model API errors**: Verify backend running at localhost:8000
- **Finding extraction failures**: Check console for parsing errors
- **Port conflicts**: Frontend runs on port 3001 (not 3000)

Console logging is enabled for development - use descriptive messages:
```typescript
console.log('[ComponentName] Action:', data);
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