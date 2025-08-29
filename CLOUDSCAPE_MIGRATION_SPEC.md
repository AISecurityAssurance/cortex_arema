# Cloudscape Design System Migration Specification
## Cortex Arena - Complete Migration Guide

### Executive Summary
This specification outlines the complete migration of Cortex Arena from custom CSS components to AWS Cloudscape Design System, while preserving all existing functionality.

### Migration Principles
1. **Functionality First**: No feature regression is acceptable
2. **Gradual Migration**: Component-by-component approach to minimize risk
3. **Hybrid Approach**: Custom components with Cloudscape styling where needed
4. **Type Safety**: Maintain TypeScript strict mode throughout
5. **Testing at Each Phase**: Validate functionality after each migration step

---

## Phase 1: Foundation Setup
**Goal**: Install Cloudscape and establish base configuration

### 1.1 Dependencies Installation
```bash
npm install @cloudscape-design/components @cloudscape-design/global-styles @cloudscape-design/design-tokens
```

### 1.2 Global Styles Setup
**File**: `src/app/layout.tsx`
- Import Cloudscape global styles before any other styles
- Import design tokens for theming
- Wrap application with Cloudscape's base providers

```typescript
import '@cloudscape-design/global-styles/index.css';
import { applyMode, applyDensity, Density, Mode } from '@cloudscape-design/global-styles';
```

### 1.3 Theme Integration
**File**: `src/contexts/CloudscapeThemeContext.tsx` (NEW)
- Create context to manage Cloudscape theme modes
- Integrate with existing theme preference in localStorage
- Map current light/dark theme to Cloudscape modes

### 1.4 TypeScript Configuration
**File**: `tsconfig.json`
- Add Cloudscape types to compiler options
- Ensure strict mode remains enabled

---

## Phase 2: Layout & Navigation Migration
**Goal**: Migrate core layout structure to establish Cloudscape foundation

### 2.1 App Layout Component
**Replace**: `src/components/layout/MainLayout.tsx`
**With**: Cloudscape AppLayout

#### Mapping:
- Current `ProfessionalHeader` → AppLayout `navigation` + `utilities`
- Current three-panel layout → AppLayout with `navigation`, `content`, and `tools`
- Drawer component → AppLayout `drawer`

#### Implementation:
```typescript
import { AppLayout, TopNavigation, SideNavigation } from '@cloudscape-design/components';

// Preserve existing navigation structure
// Map current routes to SideNavigation items
// Maintain theme toggle in utilities
```

### 2.2 Navigation Header
**Replace**: `src/components/header/ProfessionalHeader.tsx`
**With**: Cloudscape TopNavigation

#### Features to Preserve:
- User info display
- Theme toggle (move to utilities slot)
- Navigation links
- Responsive behavior

### 2.3 Split Panel Implementation
**Replace**: `src/components/layout/SlidingPanel.tsx`
**With**: Cloudscape SplitPanel

#### Custom Requirements:
- Preserve drag-to-resize functionality
- Maintain localStorage persistence of panel state
- Keep minimum/maximum size constraints

---

## Phase 3: Core Components Migration
**Goal**: Migrate reusable UI components

### 3.1 Component Mapping Table

| Current Component | Cloudscape Component | Notes |
|------------------|---------------------|-------|
| `Modal` | `Modal` | Direct replacement |
| `Badge` | `Badge` | Direct replacement |
| `LoadingSpinner` | `Spinner` | Direct replacement |
| `Switch` | `Toggle` | Direct replacement |
| `Toast` | `Flashbar` | Requires notification queue refactor |
| `Tooltip` | `Popover` | Minor API differences |
| `ErrorMessage` | `Alert` | Use type="error" |
| `ThemeToggle` | Custom with `Button` + `Icon` | Keep custom logic |

### 3.2 Toast to Flashbar Migration
**Critical**: Maintain toast notification functionality

#### Implementation Strategy:
1. Create `FlashbarProvider` to replace `ToastContext`
2. Queue notifications with Flashbar items array
3. Preserve auto-dismiss functionality (3-second timeout)
4. Map toast types to Flashbar types:
   - success → success
   - error → error
   - warning → warning
   - info → info

### 3.3 Form Components
**Files**: All validation components in `src/components/validation/`

#### Mapping:
- `StatusButtons` → `RadioGroup` with custom styling
- `ValidationNotes` → `Textarea` with FormField wrapper
- `RatingScale` → `RadioGroup` or custom component with Cloudscape tokens
- `ValidationControls` → `Form` with nested `FormField` components

---

## Phase 4: Page-Level Migrations
**Goal**: Migrate complete pages starting with simplest

### 4.1 Templates Page (RECOMMENDED FIRST)
**File**: `src/app/templates/page.tsx`

#### Components to Replace:
- Table display → `Table` component
- Add/Edit forms → `Form` with `FormField`
- Delete confirmations → `Modal` with alert styling
- Action buttons → `Button` with appropriate variants

#### Data Flow:
- Preserve Zustand store integration
- Maintain current CRUD operations
- Keep template validation logic

### 4.2 Sessions Page
**File**: `src/app/sessions/page.tsx`

#### Components to Replace:
- Session list → `Cards` or `Table`
- Session details → `Container` with `ColumnLayout`
- Progress indicators → `ProgressBar`
- Action buttons → `ButtonDropdown` for actions

### 4.3 Analysis View (Complex)
**File**: `src/app/analysis/AnalysisView.tsx`

#### Approach:
- Keep core analysis logic untouched
- Wrap in Cloudscape layout components
- Migrate UI elements gradually:
  - File upload → `FileUpload`
  - Model selection → `Select`
  - Template selector → `Select` or `Autosuggest`
  - Analysis button → `Button` with loading state

### 4.4 Model Comparison View
**File**: `src/components/analysis/ModelComparisonView.tsx`

#### Strategy:
- Use `ColumnLayout` for side-by-side comparison
- `Cards` for individual findings
- `Badge` for severity indicators
- Preserve selection and highlighting logic

---

## Phase 5: Pipeline Editor (Custom Hybrid)
**Goal**: Preserve full functionality while adopting Cloudscape styling

### 5.1 Architecture Decisions
- **Canvas**: Keep custom implementation with React
- **Styling**: Use Cloudscape design tokens for consistency
- **Controls**: Replace with Cloudscape components

### 5.2 Component Strategy

#### Node Library Panel
**Replace with**: `SideNavigation` or `Drawer`
- Categories as navigation sections
- Drag initiation from items
- Icons preserved

#### Config Panel
**Replace with**: `Form` components in `Drawer`
- Dynamic forms based on node type
- Validation with Cloudscape patterns
- Preserve all configuration options

#### Canvas Component (CUSTOM)
**Approach**: Custom component using Cloudscape tokens
```typescript
// Use design tokens for consistent styling
import { colorBackgroundHomeHeader, colorBorderDividerDefault } from '@cloudscape-design/design-tokens';

// Custom canvas with Cloudscape-consistent styling
const CanvasContainer = styled.div`
  background: ${colorBackgroundHomeHeader};
  border: 1px solid ${colorBorderDividerDefault};
  // ... preserve all interaction logic
`;
```

#### Execution Panel
**Replace with**: `Container` with `StatusIndicator`
- Progress tracking with `ProgressBar`
- Results display with `ExpandableSection`
- Error states with `Alert`

### 5.3 Custom Components Required
1. **NodeCanvas**: Custom drag-and-drop canvas
2. **ConnectionLine**: SVG connections with Cloudscape colors
3. **DraggableNode**: Custom nodes with Cloudscape card styling

---

## Phase 6: Advanced Features

### 6.1 Report Generation
**Files**: `src/app/pipeline-editor/components/SaveReportDialog.tsx`

#### Migration:
- Dialog → `Modal`
- Form inputs → `FormField` components
- File format selection → `RadioGroup`
- Preview → `Container` with syntax highlighting

### 6.2 Share Functionality
**Files**: `src/app/pipeline-editor/components/ShareLinkModal.tsx`

#### Migration:
- Modal wrapper → `Modal`
- Copy button → `Button` with copy icon
- Success feedback → inline `Alert`

### 6.3 Settings Dialogs
**Files**: `src/components/settings/*`

#### Approach:
- Unify settings in single `Modal` with `Tabs`
- Forms for each provider with `FormField`
- Connection testing with `StatusIndicator`

---

## Phase 7: Performance Optimization

### 7.1 Bundle Size Management
```javascript
// Use dynamic imports for heavy Cloudscape components
const Table = dynamic(() => import('@cloudscape-design/components').then(mod => mod.Table));
```

### 7.2 Critical CSS
- Extract critical Cloudscape styles for initial render
- Lazy load additional component styles

### 7.3 Component Code Splitting
- Split by route using Next.js dynamic imports
- Separate pipeline editor bundle

---

## Migration Execution Order

### Recommended Sequence:
1. **Week 1**: Foundation Setup (Phase 1)
2. **Week 2**: Layout & Navigation (Phase 2)
3. **Week 3**: Core Components (Phase 3)
4. **Week 4**: Templates Page (Phase 4.1)
5. **Week 5**: Sessions Page (Phase 4.2)
6. **Week 6**: Analysis View (Phase 4.3-4.4)
7. **Week 7-8**: Pipeline Editor (Phase 5)
8. **Week 9**: Advanced Features (Phase 6)
9. **Week 10**: Performance & Polish (Phase 7)

---

## Testing Strategy

### After Each Phase:
1. **Functionality Tests**:
   - All existing features work identically
   - No regression in user workflows
   - Data persistence unchanged

2. **Visual Tests**:
   - Consistent Cloudscape appearance
   - Responsive behavior maintained
   - Theme switching works

3. **Performance Tests**:
   - Page load time ≤ current + 20%
   - Bundle size monitored
   - No memory leaks

---

## Rollback Strategy

### Git Strategy:
```bash
# Create migration branch
git checkout -b cloudscape-migration

# Create checkpoint after each phase
git tag phase-1-complete
git tag phase-2-complete
# etc.
```

### Feature Flags (Optional):
```typescript
const USE_CLOUDSCAPE = process.env.NEXT_PUBLIC_USE_CLOUDSCAPE === 'true';

export const UIComponent = USE_CLOUDSCAPE ? CloudscapeVersion : LegacyVersion;
```

---

## Custom Component Templates

### Template 1: Cloudscape-Styled Custom Component
```typescript
import { colorBackgroundLayoutMain, fontSizeBodyM, spacingS } from '@cloudscape-design/design-tokens';
import styles from './CustomComponent.module.css';

export const CustomComponent: React.FC = () => {
  return (
    <div 
      className={styles.container}
      style={{
        backgroundColor: colorBackgroundLayoutMain,
        padding: spacingS,
        fontSize: fontSizeBodyM
      }}
    >
      {/* Custom functionality with Cloudscape styling */}
    </div>
  );
};
```

### Template 2: Hybrid Component
```typescript
import { Box, Button } from '@cloudscape-design/components';

export const HybridComponent: React.FC = () => {
  // Custom logic preserved
  const customLogic = useCustomHook();
  
  // Cloudscape UI
  return (
    <Box>
      <Button onClick={customLogic.action}>
        Cloudscape UI with Custom Logic
      </Button>
    </Box>
  );
};
```

---

## Success Criteria

### Must Have:
✅ All current functionality preserved  
✅ Type safety maintained  
✅ Performance within acceptable range  
✅ Consistent Cloudscape appearance  
✅ Theme switching functional  

### Nice to Have:
⭐ Improved accessibility (WCAG AA)  
⭐ Better mobile responsiveness  
⭐ Enhanced keyboard navigation  
⭐ Reduced bundle size  

---

## Common Pitfalls & Solutions

### Pitfall 1: State Management Conflicts
**Solution**: Wrap Cloudscape controlled components with local state adapters

### Pitfall 2: Custom Validation Logic
**Solution**: Use Cloudscape's `FormField` with custom validation functions

### Pitfall 3: Complex Layouts Breaking
**Solution**: Use `CustomAppLayout` for maximum flexibility

### Pitfall 4: Performance Degradation
**Solution**: Implement virtualization for large lists using Cloudscape's built-in support

---

## Resources & References

- [Cloudscape Components](https://cloudscape.design/components/)
- [Cloudscape Patterns](https://cloudscape.design/patterns/)
- [Design Tokens](https://cloudscape.design/foundation/visual-foundation/design-tokens/)
- [Migration Examples](https://github.com/cloudscape-design/demos)

---

## Notes for Implementation

1. Start each phase on a separate branch
2. Document any deviations from this spec
3. Keep a migration log of issues encountered
4. Update this spec with learnings
5. Test on multiple browsers after each phase

---

**Document Version**: 1.0  
**Last Updated**: Current Date  
**Status**: Ready for Implementation