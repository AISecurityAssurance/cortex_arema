"use client";

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { AnalysisView } from './AnalysisView';

export default function AnalysisPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session') || undefined;

  return <AnalysisView sessionId={sessionId} />;
}