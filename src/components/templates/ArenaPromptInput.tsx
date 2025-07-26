import React, { useState, useRef } from 'react';
import './ArenaPromptInput.css';

interface ArenaPromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onImageChange?: (file: File | null) => void;
  loading?: boolean;
  error?: string | null;
  placeholder?: string;
  templates?: Array<{
    id: string;
    name: string;
    template: string;
  }>;
}

export const ArenaPromptInput: React.FC<ArenaPromptInputProps> = ({
  value,
  onChange,
  onSubmit,
  onImageChange,
  loading = false,
  error = null,
  placeholder = "Enter your prompt here...",
  templates = []
}) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [currentImage, setCurrentImage] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setCurrentImage(file);
    
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
    
    onImageChange?.(file);
  };

  const handleRemoveImage = () => {
    setCurrentImage(null);
    setImagePreview(null);
    onImageChange?.(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleTemplateSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedTemplate = templates.find(t => t.id === e.target.value);
    if (selectedTemplate) {
      onChange(value + (value ? '\n\n' : '') + selectedTemplate.template);
    }
    e.target.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !loading) {
      onSubmit();
    }
  };

  return (
    <div className="arena-prompt-input">
      {error && (
        <div className="prompt-error">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="prompt-form">
        <div className="prompt-input-wrapper">
          <div className="prompt-textarea-container">
            <textarea
              className="prompt-textarea"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              disabled={loading}
              rows={4}
            />
            
            {templates.length > 0 && (
              <select
                className="template-selector"
                onChange={handleTemplateSelect}
                defaultValue=""
                disabled={loading}
              >
                <option value="" disabled>Insert Template</option>
                {templates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          
          <div className="prompt-actions">
            <div className="file-upload-section">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="file-input"
                id="image-upload"
                disabled={loading}
              />
              <label htmlFor="image-upload" className="file-label">
                <span className="file-icon">📎</span>
                <span>Attach Image</span>
              </label>
              
              {imagePreview && (
                <div className="image-preview-container">
                  <img 
                    src={imagePreview} 
                    alt="Selected" 
                    className="image-preview"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="remove-image-btn"
                    disabled={loading}
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
            
            <button
              type="submit"
              className="submit-btn btn btn-primary"
              disabled={loading || !value.trim()}
            >
              {loading ? (
                <>
                  <span className="loading-spinner"></span>
                  Generating...
                </>
              ) : (
                'Generate'
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};