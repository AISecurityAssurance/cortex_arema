import { ReactNode } from 'react';

export interface EditState {
  isEditing: boolean;
  originalData: any;
  currentData: any;
  hasChanges: boolean;
}

export type ExportFormat = 'pdf' | 'html' | 'json' | 'csv' | 'excel' | 'txt' | 'word' | 'png' | 'svg';

export interface CustomAction {
  id: string;
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

export interface AnalysisContainerProps {
  id: string;
  title?: string;
  children: ReactNode | ((props: { isEditing: boolean }) => ReactNode);
  className?: string;
  onEdit?: () => void;
  onSave?: (data: any) => void;
  onCancel?: () => void;
  onExport?: (format: ExportFormat) => void;
  isStandalone?: boolean;
  defaultEditable?: boolean;
  showToolbar?: boolean;
  toolbarPosition?: 'top' | 'bottom';
  exportFormats?: ExportFormat[];
  customActions?: CustomAction[];
}

export interface AnalysisSectionProps {
  id: string;
  title: string;
  level?: 1 | 2 | 3 | 4;
  children: ReactNode;
  className?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  isEditing?: boolean;
  onDataChange?: (data: any) => void;
}

export interface TableColumn {
  id: string;
  header: string;
  accessor: string | ((row: any) => any);
  type?: 'text' | 'number' | 'select' | 'date' | 'boolean';
  editable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  options?: { value: any; label: string }[];
}

export interface AnalysisTableProps {
  id: string;
  title?: string;
  data: any[];
  columns: TableColumn[];
  className?: string;
  enableSorting?: boolean;
  enableFiltering?: boolean;
  enablePagination?: boolean;
  pageSize?: number;
  isEditing?: boolean;
  onDataChange?: (data: any[]) => void;
}

export interface AnalysisTextProps {
  id: string;
  title?: string;
  content: string;
  format?: 'plain' | 'markdown' | 'html';
  className?: string;
  maxLength?: number;
  placeholder?: string;
  isEditing?: boolean;
  onDataChange?: (content: string) => void;
}

export interface AnalysisDiagramProps {
  id: string;
  title?: string;
  type: 'flowchart' | 'sequence' | 'gantt' | 'pie' | 'bar' | 'line' | 'custom';
  data?: any;
  width?: string | number;
  height?: string | number;
  interactive?: boolean;
  className?: string;
  children?: ReactNode;
  isEditing?: boolean;
  onDataChange?: (data: any) => void;
}

export interface AnalysisDetailProps {
  id: string;
  title?: string;
  items: Array<{
    label: string;
    value: any;
    type?: 'text' | 'number' | 'date' | 'boolean' | 'list' | 'object';
    editable?: boolean;
  }>;
  layout?: 'vertical' | 'horizontal' | 'grid';
  className?: string;
  isEditing?: boolean;
  onDataChange?: (items: any[]) => void;
}

export interface AnalysisListProps {
  id: string;
  title?: string;
  items: any[];
  renderItem: (item: any, index: number) => ReactNode;
  emptyMessage?: string;
  className?: string;
  isEditing?: boolean;
  onDataChange?: (items: any[]) => void;
  onAdd?: () => void;
  onRemove?: (index: number) => void;
}

export interface ExportOptionsProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: ExportFormat) => void;
  availableFormats: ExportFormat[];
  componentType: 'container' | 'section' | 'table' | 'text' | 'diagram' | 'detail' | 'list';
}