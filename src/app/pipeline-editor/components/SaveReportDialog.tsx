"use client";

import { useState } from "react";
import { X, Download, Tag, Share2 } from "lucide-react";
import "./SaveReportDialog.css";

interface SaveReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (metadata: {
    name: string;
    description?: string;
    tags?: string[];
    analyst?: string;
  }, action: 'download' | 'share') => void;
}

export function SaveReportDialog({ isOpen, onClose, onSave }: SaveReportDialogProps) {
  const [name, setName] = useState(`Pipeline Report - ${new Date().toLocaleString()}`);
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [analyst, setAnalyst] = useState("");

  if (!isOpen) return null;

  const handleSave = (action: 'download' | 'share') => {
    const tagArray = tags
      .split(",")
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    onSave({
      name,
      description: description || undefined,
      tags: tagArray.length > 0 ? tagArray : undefined,
      analyst: analyst || undefined,
    }, action);

    // Reset form
    setName(`Pipeline Report - ${new Date().toLocaleString()}`);
    setDescription("");
    setTags("");
    setAnalyst("");
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Save Pipeline Report</h2>
          <button onClick={onClose} className="close-button">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label htmlFor="report-name">Report Name *</label>
            <input
              id="report-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter report name"
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="report-description">Description</label>
            <textarea
              id="report-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the analysis"
              className="form-textarea"
              rows={3}
            />
          </div>

          <div className="form-group">
            <label htmlFor="report-tags">
              Tags
              <span className="form-hint">Comma-separated tags for categorization</span>
            </label>
            <div className="input-with-icon">
              <Tag size={16} className="input-icon" />
              <input
                id="report-tags"
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g., security, stride, production"
                className="form-input with-icon"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="report-analyst">Analyst Name</label>
            <input
              id="report-analyst"
              type="text"
              value={analyst}
              onChange={(e) => setAnalyst(e.target.value)}
              placeholder="Your name (optional)"
              className="form-input"
            />
          </div>
          
          <div className="warning-box">
            <p className="warning-text">
              ⚠️ <strong>Testing Mode:</strong> Shared links expire after 10 minutes
            </p>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="button button-secondary">
            Cancel
          </button>
          <button
            onClick={() => handleSave('download')}
            disabled={!name.trim()}
            className="button button-primary"
          >
            <Download size={16} />
            Download Report
          </button>
          <button
            onClick={() => handleSave('share')}
            disabled={!name.trim()}
            className="button button-primary"
            style={{ backgroundColor: '#10b981' }}
          >
            <Share2 size={16} />
            Share Link (10 min)
          </button>
        </div>
      </div>
    </div>
  );
}