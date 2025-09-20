# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
Cortex Arena is a security analysis platform that compares threat assessments from multiple AI models. Users upload architecture diagrams, select analysis templates (STRIDE, STPA-Sec, or custom), and receive comparative security findings from different models.

## Tech Stack
- **Framework**: Next.js 15.4.2 with App Router
- **TypeScript**: 5.9.2 (strict mode enabled)
- **State Management**: Zustand 5.0.6
- **UI Libraries**: Radix UI, Lucide React icons, Tailwind CSS
- **Styling**: Tailwind CSS with CSS modules, styled-jsx for dynamic styles
- **Backend**: FastAPI server at localhost:8000 (../agr directory)
- **Path Aliases**: `@/*` maps to `./src/*` for clean imports
- **Requirements**: Node.js 18+, Python 3.8+, AWS CLI configured for Bedrock

## Development Commands

```bash
# Frontend (runs on port 3001)
npm run dev          # Start development server with Turbopack
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint with Next.js rules
npm run typecheck    # TypeScript type checking (tsc --noEmit)

# Backend (from ../agr directory)
python agr.py serve  # FastAPI server on localhost:8000 with observability
python agr.py serve --reload --workers=1  # Development mode with auto-reload

# Testing (when configured)
npm test             # Run test suite
npm test -- --watch # Run tests in watch mode
```

## Architecture Overview

### Core Data Flow
1. User uploads architecture diagram → Image stored as base64
2. Template selection → Variable substitution via `PromptProcessor` → Prompt generation
3. Backend API (`/generate`) → Parallel model processing with provider-specific routing
4. Raw responses → Finding extraction (`lib/analysis/findingExtractor.ts`)
5. Findings display → User validation → Session persistence in localStorage

### Multi-Provider Model Routing
The application routes model requests through a unified API that handles multiple providers:
1. Frontend selects models from `MODEL_CATALOG` with provider metadata
2. Provider configurations (API keys, endpoints) loaded from sessionStorage
3. Backend AGR server determines routing based on model ID prefix:
   - `us.anthropic.*` → AWS Bedrock
   - `ollama:*` → Ollama server
   - `azure:*` → Azure OpenAI endpoint
   - Direct provider names → BYOM (Bring Your Own Model) endpoints
4. Response normalization handles provider-specific formats

### State Management
- **Zustand stores**: Template management (`stores/templateStore.ts`), Pipeline state
- **LocalStorage**: Atomic operations for sessions and validations
- **React Context**: Toast notifications (`contexts/ToastContext.tsx`), Theme management, Auth (`contexts/AuthContext.tsx`)
- **Session Management**: `hooks/useAnalysisSession.ts` handles session lifecycle
- **Authentication**: Mock auth system with protected routes and user context

### Key Directories
```
src/
├── app/                    # Next.js App Router pages
│   ├── analysis/          # Main analysis feature with model comparison
│   ├── attack-tree/       # Attack tree visualization and generation
│   ├── auth/              # Authentication pages (login, signup)
│   ├── pipeline-editor/   # Visual pipeline builder (drag-and-drop)
│   ├── templates/         # Template CRUD operations
│   ├── sessions/          # Session history and management
│   └── settings/          # Configuration UI for model providers
├── components/            # Reusable UI components
│   ├── analysis/          # Model comparison, finding cards
│   ├── validation/        # Multi-dimensional validation UI
│   ├── layout/           # Three-panel layout, sliding panels
│   └── settings/         # Model provider configuration components
├── lib/                   # Core business logic
│   ├── analysis/         # Finding extraction from model responses
│   ├── attackTree/       # Attack tree parsing and generation
│   ├── prompts/          # Template processing and variable substitution
│   └── storage/          # LocalStorage persistence utilities
├── contexts/             # React contexts (Auth, Toast, Theme)
├── stores/               # Zustand state management
├── types/                # TypeScript type definitions
└── hooks/               # Custom React hooks for state and effects
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

Available models defined in `src/types/modelProvider.ts` MODEL_CATALOG:
- **AWS Bedrock**: Claude Opus 4, Claude Sonnet 4, Claude 3.5 Sonnet, Nova Pro, Nova Lite, Llama 3.2, Pixtral Large
- **OpenAI**: GPT-4o, GPT-4o Mini, GPT-4 Turbo, GPT-3.5 Turbo, O1 Preview, O1 Mini
- **Anthropic**: Claude 3.5 Sonnet, Claude 3.5 Haiku, Claude 3 Opus
- **Google**: Gemini 2.0 Flash, Gemini 1.5 Pro, Gemini 1.5 Flash
- **Cohere**: Command R+, Command R
- **Mistral**: Mistral Large, Mistral Medium, Pixtral 12B
- **Ollama**: Llava, Llama 3.2, Llama 3.2 Vision, Qwen 2.5
- **Azure OpenAI**: GPT-4o, GPT-4o Mini, GPT-4 Vision, GPT-4 Turbo

### Model Provider Configuration
Model providers are configured through the Settings UI (`src/app/settings/page.tsx` and `src/components/settings/ModelProviderSettings.tsx`):
- **AWS Bedrock**: Pre-configured with AWS CLI credentials
- **Ollama**: Local or remote server endpoint configuration
- **Azure OpenAI**: API key, endpoint, deployment name
- **OpenAI/Anthropic/Google/Cohere/Mistral**: API key configuration
- Configurations stored in sessionStorage under `byom_api_keys`

## Finding Extraction System

The finding extractor (`src/lib/analysis/findingExtractor.ts`) parses unstructured model responses into structured findings:
- Pattern matching for severity levels (Critical/High/Medium/Low)
- Support for STRIDE categories, STPA-SEC hazards, custom formats
- Handles varied response formats from different models
- Extracts threat title, description, mitigation from various formats
- Fallback parsing for non-standard model outputs

## Template System

Templates use `{{variable_name}}` syntax for substitution:
- **Core templates**: Built-in, read-only (STRIDE, STPA-Sec)
- **User overrides**: Custom modifications stored in Zustand
- **Draft edits**: Unsaved changes during editing sessions
- **Variable validation**: Required fields checked before submission
- **Template versioning**: Each template has unique ID for tracking

## Validation System

Multi-dimensional validation scoring for both findings and remediations:

### Finding Validation
- **Statuses**: confirmed, false-positive, needs-review, pending
- **Dimensions**: accuracy, completeness, relevance, actionability (1-5 scale)
- **Persistence**: LocalStorage via `validationStorage.ts`

### Remediation Validation
- **Individual Validation**: Each remediation in the `mitigations` array can be validated separately
- **ID Structure**: Remediation validations use ID format: `{findingId}-remediation-{index}`
- **Same Dimensions**: Uses same 4 quality dimensions as finding validation
- **UI Location**: Appears below finding validation in the right panel when a finding with remediations is selected
- **Storage**: Stored in the same validation Map structure, differentiated by the ID format

## Authentication System

Mock authentication with protected routes:
- **Protected Routes**: `/analysis`, `/sessions`, `/templates`, `/attack-tree`, `/pipeline-editor`
- **Auth Context**: User state management via `AuthContext`
- **Auto-redirect**: Landing page redirects to `/analysis` when authenticated
- **Mock Storage**: User data persisted in localStorage as `mockUser`
- **Login Flow**: Redirects to original destination after authentication

## Attack Tree System

Visual security threat modeling (`/attack-tree`):
- **Visualization**: D3-based interactive tree rendering with zoom/pan
- **Node Types**: AND/OR logical operators for attack path combinations
- **Metrics**: Difficulty, impact, likelihood, cost, time-to-exploit
- **Generation**: AI-powered attack tree generation from system descriptions
- **Parser**: `lib/attackTree/parser.ts` extracts structured trees from LLM responses
- **Session Management**: Attack trees persisted with metadata and view settings

## Pipeline Editor

Complex drag-and-drop visual system (`/pipeline-editor`):
- **Canvas**: Custom React implementation with node/edge rendering
- **Node types**: Defined in `types/nodeConfigs.ts` (Input, Model, Transform, Output)
- **Execution**: `usePipelineExecution` hook manages pipeline runs
- **Auto-layout**: dagre library (`utils/autoLayout.ts`) for graph positioning
- **State Management**: Canvas state tracks nodes, edges, and execution status
- **Drag & Drop**: HTML5 DnD API with custom visual feedback
- **Connection Validation**: Type-based port compatibility checking

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
1. Add to `MODEL_CATALOG` in `src/types/modelProvider.ts`
2. Add provider configuration to `PROVIDER_CONFIGS` if new provider
3. Ensure backend AGR server supports the model ID
4. Model automatically appears in UI dropdowns

### Creating Templates
1. Navigate to Template Editor UI at `/templates`
2. Define variables with `{{variable_name}}` syntax
3. Set `analysisType` (STRIDE, STPA-Sec, custom) and `expectedOutputFormat`
4. Templates auto-save to localStorage via Zustand store

### Configuring Model Providers
1. Navigate to Settings page (`/settings`)
2. Select "Model Providers" section
3. Configure API keys and endpoints as needed
4. Test connection to verify configuration

### Debugging

Common issues:
- **Toast notifications not showing**: Check `ToastProvider` wrapper in layout
- **Session persistence issues**: Clear localStorage/sessionStorage if corrupted
- **Model API errors**: Verify AGR backend running at localhost:8000
- **Finding extraction failures**: Check console for parsing errors in `findingExtractor.ts`
- **Port conflicts**: Frontend runs on port 3001 (not 3000)
- **Provider configuration lost**: Check sessionStorage for `byom_api_keys`
- **Template not loading**: Verify Zustand store initialization in `templateStore.ts`

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
- Implement virtualization for long finding lists
- Lazy load heavy components with dynamic imports
- Batch LocalStorage operations to avoid race conditions
- Use debouncing for template auto-save operations

## Testing Infrastructure
Currently no test framework is configured. To add testing:
- Consider Jest + React Testing Library for unit tests
- Playwright or Cypress for E2E tests
- Mock the backend `/generate` endpoint for isolated frontend testing
- When I say make commits you will make appropriately grouped atomic commits