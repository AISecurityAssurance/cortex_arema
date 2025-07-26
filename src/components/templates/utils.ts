import { ExportFormat } from './types';

/**
 * Utility functions for the template system
 */

// Determine available export formats based on component type and content
export function getDefaultExportFormats(componentType: string): ExportFormat[] {
  switch (componentType) {
    case 'table':
      return ['csv', 'excel', 'json', 'pdf'];
    case 'diagram':
      return ['png', 'svg', 'pdf'];
    case 'text':
      return ['txt', 'word', 'pdf', 'html'];
    case 'section':
    case 'container':
      return ['pdf', 'html', 'word'];
    default:
      return ['pdf', 'html', 'json'];
  }
}

// Generate unique IDs for components
export function generateId(prefix: string = 'component'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Deep clone data for edit/cancel functionality
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as any;
  if (obj instanceof Array) {
    const clonedArr: any[] = [];
    obj.forEach((item, index) => {
      clonedArr[index] = deepClone(item);
    });
    return clonedArr as any;
  }
  if (obj instanceof Object) {
    const clonedObj: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
  return obj;
}

// Compare objects for change detection
export function hasChanges(original: any, current: any): boolean {
  if (original === current) return false;
  if (original == null || current == null) return true;
  if (typeof original !== typeof current) return true;
  
  if (typeof original === 'object') {
    const originalKeys = Object.keys(original);
    const currentKeys = Object.keys(current);
    
    if (originalKeys.length !== currentKeys.length) return true;
    
    for (const key of originalKeys) {
      if (!currentKeys.includes(key)) return true;
      if (hasChanges(original[key], current[key])) return true;
    }
    
    return false;
  }
  
  return original !== current;
}

// Format data for export
export function formatDataForExport(data: any, format: ExportFormat): any {
  switch (format) {
    case 'json':
      return JSON.stringify(data, null, 2);
    case 'csv':
      return convertToCSV(data);
    case 'html':
      return convertToHTML(data);
    default:
      return data;
  }
}

// Convert array of objects to CSV
function convertToCSV(data: any[]): string {
  if (!Array.isArray(data) || data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(',');
  
  const csvRows = data.map(row => {
    return headers.map(header => {
      const value = row[header];
      // Escape quotes and wrap in quotes if contains comma
      const escaped = String(value).replace(/"/g, '""');
      return escaped.includes(',') ? `"${escaped}"` : escaped;
    }).join(',');
  });
  
  return [csvHeaders, ...csvRows].join('\n');
}

// Convert data to HTML
function convertToHTML(data: any): string {
  if (typeof data === 'string') {
    return `<div>${data}</div>`;
  }
  
  if (Array.isArray(data)) {
    return `
      <table>
        <thead>
          <tr>${Object.keys(data[0] || {}).map(key => `<th>${key}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${data.map(row => `
            <tr>${Object.values(row).map(val => `<td>${val}</td>`).join('')}</tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }
  
  return `<pre>${JSON.stringify(data, null, 2)}</pre>`;
}

// Debounce function for performance
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}