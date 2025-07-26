import React from 'react';
import type { ExportOptionsProps, ExportFormat } from './types';
import './ExportOptions.css';

const formatIcons: Record<ExportFormat, string> = {
  pdf: '📄',
  html: '🌐',
  json: '{}',
  csv: '📊',
  excel: '📗',
  txt: '📝',
  word: '📘',
  png: '🖼️',
  svg: '🎨'
};

const formatLabels: Record<ExportFormat, string> = {
  pdf: 'PDF Document',
  html: 'HTML Page',
  json: 'JSON Data',
  csv: 'CSV Spreadsheet',
  excel: 'Excel Workbook',
  txt: 'Plain Text',
  word: 'Word Document',
  png: 'PNG Image',
  svg: 'SVG Vector'
};

export const ExportOptions: React.FC<ExportOptionsProps> = ({
  isOpen,
  onClose,
  onExport,
  availableFormats,
  componentType
}) => {
  if (!isOpen) return null;

  const handleExport = (format: ExportFormat) => {
    onExport(format);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="export-options-backdrop" onClick={handleBackdropClick}>
      <div className="export-options-modal">
        <div className="export-options-header">
          <h3 className="export-options-title">Export Options</h3>
          <button 
            className="export-options-close"
            onClick={onClose}
            aria-label="Close export options"
          >
            ×
          </button>
        </div>
        
        <div className="export-options-content">
          <p className="export-options-description">
            Choose a format to export the {componentType}:
          </p>
          
          <div className="export-options-grid">
            {availableFormats.map(format => (
              <button
                key={format}
                className="export-option-btn"
                onClick={() => handleExport(format)}
              >
                <span className="export-option-icon">
                  {formatIcons[format]}
                </span>
                <span className="export-option-label">
                  {formatLabels[format]}
                </span>
              </button>
            ))}
          </div>
        </div>
        
        <div className="export-options-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};