"use client";

import { useState, useEffect } from "react";
import { X, Copy, Trash2, Clock, CheckCircle } from "lucide-react";
import { reportService } from "@/lib/api/reportService";
import "./ShareLinkModal.css";

interface ShareLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareUrl: string;
  reportId: string;
  expiresAt: string;
  reportName: string;
}

export function ShareLinkModal({
  isOpen,
  onClose,
  shareUrl,
  reportId,
  expiresAt,
  reportName
}: ShareLinkModalProps) {
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState("");

  useEffect(() => {
    if (!isOpen || !expiresAt) return;

    const updateTimer = () => {
      const { minutes, seconds, isExpired } = reportService.calculateTimeRemaining(expiresAt);
      
      if (isExpired) {
        setTimeRemaining("Expired");
        return;
      }
      
      setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [isOpen, expiresAt]);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy link:", error);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this report? This action cannot be undone.")) {
      return;
    }

    setDeleting(true);
    try {
      await reportService.deleteReport(reportId);
      onClose();
    } catch (error) {
      console.error("Failed to delete report:", error);
      alert("Failed to delete report. It may have already expired.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="share-modal-content">
        <div className="modal-header">
          <h2>Share Report</h2>
          <button onClick={onClose} className="close-button">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="report-info">
            <p className="report-name">{reportName}</p>
            <div className="expiration-info">
              <Clock size={16} />
              <span>Expires in: <strong>{timeRemaining}</strong></span>
            </div>
          </div>

          <div className="share-link-container">
            <label className="share-link-label">Shareable Link</label>
            <div className="share-link-input-group">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="share-link-input"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button
                onClick={handleCopyLink}
                className="copy-button"
                title="Copy link"
              >
                {copied ? (
                  <>
                    <CheckCircle size={18} />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={18} />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="test-mode-warning">
            <p>
              ⚠️ <strong>Testing Mode:</strong> This link will expire in 10 minutes. 
              Anyone with the link can view the report until it expires.
            </p>
          </div>
        </div>

        <div className="modal-footer">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="button button-danger"
          >
            <Trash2 size={16} />
            {deleting ? "Deleting..." : "Delete Report"}
          </button>
          <button onClick={onClose} className="button button-primary">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}