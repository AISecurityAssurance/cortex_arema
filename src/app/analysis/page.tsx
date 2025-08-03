"use client";

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { AnalysisView } from './AnalysisView';
import './AnalysisView.css';
import './page.css';

export default function AnalysisPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session') || undefined;

  return (
    <div className="analysis-page">
      <AnalysisView sessionId={sessionId} />
    </div>
  );
}