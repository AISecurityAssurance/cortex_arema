# Cortex Arena - Claude Development Guide

## 🚀 ACTIVE MIGRATION: Cloudscape Design System
**IMPORTANT**: This project is actively migrating to AWS Cloudscape Design System. See `CLOUDSCAPE_MIGRATION_SPEC.md` for detailed migration instructions. Follow the specification exactly when making UI changes.

## Project Overview
Cortex Arena is a security analysis tool that compares threat assessments from multiple Claude AI models. It allows users to upload architecture diagrams, select analysis templates (STRIDE, STPA-Sec, or custom), and get comparative security findings from different Claude models.

## Tech Stack
- **Framework**: Next.js 15.4.2 with App Router
- **React**: 19.1.0
- **Language**: TypeScript 5.7.3
- **State Management**: Zustand 5.0.3
- **Styling**: CSS with CSS Variables for theming
- **AI Integration**: AWS Bedrock Claude models (Opus & Sonnet)
- **Backend**: FastAPI server (localhost:8000) for model interactions

## Key Architecture Decisions

### State Management
- **Zustand** for global state (sessions, templates)
- **React hooks** for component-level state
- **Session storage** persisted to localStorage

### Component Architecture
- **Modular components** organized by feature
- **Client components** ("use client") for interactivity
- **Provider pattern** for context (ToastContext)
- **Layout components** for consistent UI structure

## Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── analysis/          # Analysis page and view
│   ├── sessions/          # Session management page
│   ├── templates/         # Template management page
│   └── providers.tsx      # App-level providers
├── components/
│   ├── analysis/          # Analysis-related components
│   ├── architecture/      # Architecture visualization
│   ├── header/           # App header
│   ├── layout/           # Layout components
│   ├── ui/              # Reusable UI components
│   └── validation/       # Validation controls
├── contexts/             # React contexts
├── hooks/               # Custom React hooks
├── lib/                 # Business logic & utilities
│   ├── analysis/        # Finding extraction
│   ├── prompts/        # Prompt processing
│   └── storage/        # Storage management
├── styles/             # Global styles
└── types/              # TypeScript type definitions
```

## Core Components

### AnalysisView (`src/app/analysis/AnalysisView.tsx`)
Main analysis interface that:
- Manages analysis sessions
- Handles image upload and validation
- Coordinates model calls
- Displays comparison results

Key features:
- Image validation using AI before analysis
- Template-based prompt generation
- Parallel model execution
- Finding extraction and comparison

### AnalysisLayout (`src/components/layout/AnalysisLayout.tsx`)
Three-panel layout component:
- Left panel (optional): Currently unused
- Center panel: Model comparison view
- Right panel: Validation controls in sliding panel

### SlidingPanel (`src/components/layout/SlidingPanel.tsx`)
Collapsible panel with edge handle (3 dots indicator):
- Horizontal slide animation
- Persistent collapsed state in localStorage
- Standard UI pattern with grip indicator

### ModelComparisonView (`src/components/analysis/ModelComparisonView.tsx`)
Side-by-side comparison of findings from two models:
- Color-coded severity levels
- Finding selection and highlighting
- Validation status indicators

## State Management

### Session Store (`src/lib/storage/sessionStorage.ts`)
Manages analysis sessions with:
- Session creation/deletion
- Finding updates
- Validation tracking
- Model selection
- Template association

Session structure:
```typescript
interface AnalysisSession {
  id: string
  name: string
  createdAt: string
  modelAId: string
  modelBId: string
  modelAResults: SecurityFinding[]
  modelBResults: SecurityFinding[]
  validations: FindingValidation[]
  promptTemplate: PromptTemplate | null
}
```

### Template Store (`src/lib/storage/templateStorage.ts`)
Manages prompt templates:
- CRUD operations
- Active/inactive states
- Variable extraction
- Default templates (STRIDE, STPA-Sec)

## API Integration

### Model Calls
Backend API at `http://localhost:8000/generate`:
```typescript
{
  model_id: string,
  prompt: string,
  images?: string[],  // Base64 encoded
  system_instructions: string
}
```

Models available:
- Claude Opus: `us.anthropic.claude-opus-4-20250514-v1:0`
- Claude Sonnet: `us.anthropic.claude-sonnet-4-20250514-v1:0`

## Key Features

### Image Validation
Before analysis, uploaded images are validated using AI to ensure they are architecture diagrams:
- Checks for components, connections, technical labels
- Shows toast notifications for feedback
- Prevents analysis with invalid images

### Toast Notifications
Custom toast system with:
- Success, error, warning, info types
- Auto-dismiss after 3 seconds
- Positioned at top-right
- Debug logging enabled

### Finding Validation
Users can validate security findings with:
- Status: confirmed, rejected, needs_review
- Severity adjustment
- Notes and reasoning
- Validation persistence

## Common Tasks

### Running the Development Server
```bash
npm run dev
```

### Linting and Type Checking
```bash
npm run lint
npm run typecheck
```

### Building for Production
```bash
npm run build
```

## Recent Changes & Fixes

### Infinite Loop Fix
Fixed useEffect dependency issue in AnalysisView.tsx:
- Added conditional check before updating models
- Prevents re-renders when models haven't changed

### Template Validation
- Changed default template from empty object to null
- Prevents analysis without selecting a template
- Shows appropriate error messages

### UI Improvements
- Implemented sliding panel with edge handle for findings
- Renamed ThreePanelView to AnalysisLayout for clarity
- Removed unused components (CollapsiblePanel, SessionPanel, AnalysisTabs)

## Important Patterns

### Error Handling
- Toast notifications for user feedback
- Try-catch blocks around async operations
- Validation before critical operations
- Console logging for debugging (kept enabled)

### Component Communication
- Props for parent-child communication
- Zustand for global state
- Context for cross-component features (toasts)
- Callbacks for event handling

### Performance Considerations
- Parallel model calls using Promise.all
- Memoization where appropriate
- Lazy loading for heavy components
- LocalStorage for persistence

## Debugging Tips

1. **Toast notifications not showing**: Check ToastProvider is wrapped in client component
2. **Infinite loops**: Check useEffect dependencies, especially object comparisons
3. **Image validation failures**: Verify backend is running at localhost:8000
4. **Session issues**: Check localStorage for corrupted data
5. **Model errors**: Verify AWS Bedrock credentials and model IDs

## Security Considerations

- No secrets in frontend code
- Image validation before processing
- Input sanitization for prompts
- CORS configured for localhost only
- Session data in localStorage (non-sensitive)

## Future Enhancements (from TODO.md)

- Export findings to various formats
- Batch analysis capabilities
- Custom severity mappings
- Finding deduplication
- Collaborative features
- API key management UI

## Development Guidelines

1. Always use absolute imports with @ alias
2. Keep components focused and single-purpose
3. Use TypeScript strict mode
4. Follow existing code patterns
5. Test with both Claude models
6. Validate UI changes across breakpoints
7. Keep debug logging enabled (per user preference)
8. Use semantic component names

## Cloudscape Migration Guidelines

When working on UI components:

1. **Check Migration Spec First**: Always refer to `CLOUDSCAPE_MIGRATION_SPEC.md` before modifying UI components
2. **Preserve Functionality**: No feature regression is acceptable during migration
3. **Use Cloudscape Components**: Replace custom components with Cloudscape equivalents when available
4. **Custom Components**: When Cloudscape doesn't provide needed functionality, create custom components using Cloudscape design tokens
5. **Test After Changes**: Verify all functionality works after component migration

### Quick Migration Reference

```bash
# Install Cloudscape (if not already installed)
npm install @cloudscape-design/components @cloudscape-design/global-styles @cloudscape-design/design-tokens

# Run development server to test changes
npm run dev

# Type check after migration
npm run typecheck

# Lint check
npm run lint
```

### Component Migration Status

Track migration progress in `CLOUDSCAPE_MIGRATION_SPEC.md`. Mark phases as complete as you progress.