"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Input, Select } from '@cloudscape-design/components';
import { SessionStorage } from '@/lib/storage/sessionStorage';
import { AnalysisSession } from '@/types';
import './page.css';

export default function SessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<AnalysisSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'progress'>('date');
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = () => {
    setLoading(true);
    try {
      const allSessions = SessionStorage.getAllSessions();
      setSessions(allSessions);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const createNewSession = () => {
    const session = SessionStorage.createSession('New Analysis Session');
    router.push(`/analysis?session=${session.id}`);
  };

  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this session?')) {
      SessionStorage.deleteSession(id);
      loadSessions();
    }
  };

  const startEditingSession = (session: AnalysisSession, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditingName(session.name);
  };

  const saveSessionName = (sessionId: string) => {
    const session = SessionStorage.getSession(sessionId);
    if (session && editingName.trim()) {
      session.name = editingName.trim();
      SessionStorage.saveSession(session);
      loadSessions();
    }
    setEditingSessionId(null);
    setEditingName('');
  };

  const cancelEditing = () => {
    setEditingSessionId(null);
    setEditingName('');
  };

  const exportSession = (session: AnalysisSession, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const json = SessionStorage.exportSession(session.id);
    if (json) {
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${session.name.replace(/\s+/g, '_')}_${session.id}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const importSession = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const imported = SessionStorage.importSession(content);
        if (imported) {
          loadSessions();
        } else {
          alert('Failed to import session. Please check the file format.');
        }
      };
      reader.readAsText(file);
    }
  };

  // Filter and sort sessions
  const filteredSessions = sessions.filter(session =>
    session.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedSessions = [...filteredSessions].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'progress':
        const progressA = a.progress.validatedFindings / Math.max(a.progress.totalFindings, 1);
        const progressB = b.progress.validatedFindings / Math.max(b.progress.totalFindings, 1);
        return progressB - progressA;
      case 'date':
      default:
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getProgressPercentage = (session: AnalysisSession) => {
    if (session.progress.totalFindings === 0) return 0;
    return Math.round((session.progress.validatedFindings / session.progress.totalFindings) * 100);
  };

  if (loading) {
    return <div className="sessions-loading">Loading sessions...</div>;
  }

  return (
    <div className="sessions-page">
      <div className="sessions-header">
        <h1>Analysis Sessions</h1>
        <div className="header-actions">
          <div className="new-session-btn">
            <Button
              onClick={createNewSession}
              variant="primary"
              iconName="add-plus"
            >
              New Analysis
            </Button>
          </div>
          <label className="import-btn">
            <input
              type="file"
              accept=".json"
              onChange={importSession}
              style={{ display: 'none' }}
            />
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 14L6 10H8V6H12V10H14L10 14Z"/>
              <path d="M4 16H16V18H4V16Z"/>
            </svg>
            Import Session
          </label>
        </div>
      </div>

      <div className="sessions-controls">
        <div className="search-input">
          <Input
            placeholder="Search sessions..."
            value={searchTerm}
            onChange={({ detail }) => setSearchTerm(detail.value)}
            type="search"
          />
        </div>
        <div className="sort-select">
          <Select
            selectedOption={{ value: sortBy, label: `Sort by ${sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}` }}
            onChange={({ detail }) => setSortBy(detail.selectedOption?.value as any)}
            options={[
              { value: "date", label: "Sort by Date" },
              { value: "name", label: "Sort by Name" },
              { value: "progress", label: "Sort by Progress" }
            ]}
          />
        </div>
      </div>

      {sortedSessions.length === 0 ? (
        <div className="empty-state">
          <svg width="64" height="64" viewBox="0 0 64 64" fill="currentColor">
            <path d="M32 12C21 12 12 21 12 32C12 43 21 52 32 52C43 52 52 43 52 32C52 21 43 12 32 12ZM32 48C23.2 48 16 40.8 16 32C16 23.2 23.2 16 32 16C40.8 16 48 23.2 48 32C48 40.8 40.8 48 32 48Z"/>
            <path d="M32 24C32.55 24 33 24.45 33 25V31H39C39.55 31 40 31.45 40 32C40 32.55 39.55 33 39 33H33V39C33 39.55 32.55 40 32 40C31.45 40 31 39.55 31 39V33H25C24.45 33 24 32.55 24 32C24 31.45 24.45 31 25 31H31V25C31 24.45 31.45 24 32 24Z"/>
          </svg>
          <p>No sessions found</p>
          <div className="create-first-btn">
            <Button onClick={createNewSession} variant="primary">
              Create your first analysis
            </Button>
          </div>
        </div>
      ) : (
        <div className="sessions-grid">
          {sortedSessions.map((session) => (
            <div key={session.id} className="session-card">
              <div className="session-info-section">
                <div className="session-header">
                  {editingSessionId === session.id ? (
                    <input
                      type="text"
                      className="session-name"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onBlur={() => saveSessionName(session.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveSessionName(session.id);
                        if (e.key === 'Escape') cancelEditing();
                      }}
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                    />
                  ) : (
                    <input
                      type="text"
                      className="session-name"
                      value={session.name}
                      readOnly
                      onClick={(e) => startEditingSession(session, e)}
                    />
                  )}
                  <div className="session-actions">
                    <button
                      className="action-btn"
                      onClick={(e) => exportSession(session, e)}
                      title="Export session"
                    >
                      <svg viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8 12L4 8H6V4H10V8H12L8 12Z"/>
                        <path d="M2 14H14V15H2V14Z"/>
                      </svg>
                    </button>
                    <button
                      className="action-btn delete"
                      onClick={(e) => deleteSession(session.id, e)}
                      title="Delete session"
                    >
                      <svg viewBox="0 0 16 16" fill="currentColor">
                        <path d="M6 2V3H10V2H6ZM5 2C5 1.45 5.45 1 6 1H10C10.55 1 11 1.45 11 2V3H14C14.55 3 15 3.45 15 4C15 4.55 14.55 5 14 5H13V13C13 14.1 12.1 15 11 15H5C3.9 15 3 14.1 3 13V5H2C1.45 5 1 4.55 1 4C1 3.45 1.45 3 2 3H5V2ZM5 5V13H11V5H5ZM7 7V11H9V7H7Z"/>
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="session-meta">
                  <span className="meta-item">
                    <svg viewBox="0 0 16 16" fill="currentColor">
                      <path d="M8 2C4.69 2 2 4.69 2 8C2 11.31 4.69 14 8 14C11.31 14 14 11.31 14 8C14 4.69 11.31 2 8 2ZM8 12C5.79 12 4 10.21 4 8C4 5.79 5.79 4 8 4C10.21 4 12 5.79 12 8C12 10.21 10.21 12 8 12ZM8.5 5H7V9L10.25 10.85L11 9.62L8.5 8V5Z"/>
                    </svg>
                    {formatDate(session.updatedAt)}
                  </span>
                  {session.promptTemplate && (
                    <span className="meta-item">
                      {session.promptTemplate.analysisType.toUpperCase()}
                    </span>
                  )}
                </div>
              </div>

              <div className="session-stats">
                <div className="stat">
                  <span className="stat-label">Total</span>
                  <span className="stat-value">{session.progress.totalFindings}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Valid</span>
                  <span className="stat-value">{session.progress.validatedFindings}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">True</span>
                  <span className="stat-value confirmed">{session.progress.confirmedFindings}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">False</span>
                  <span className="stat-value false-positive">{session.progress.falsePositives}</span>
                </div>
              </div>

              <div className="session-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${getProgressPercentage(session)}%` }}
                  />
                </div>
                <span className="progress-value">{getProgressPercentage(session)}%</span>
              </div>

              <Link href={`/analysis?session=${session.id}`} className="resume-btn">
                Resume
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}