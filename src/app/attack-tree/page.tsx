"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/contexts/ToastContext';
import { AttackTreeControls } from './components/AttackTreeControls';
import {
  createAttackTreePrompt,
  createJsonStructurePrompt,
  processAttackTreeResponse
} from '@/lib/attackTree/mermaidGenerator';
import { MermaidAttackTree } from './components/MermaidAttackTree';
import {
  AttackTreeData,
  AttackTreeGenerationParams,
  AttackTreeSession
} from '@/types/attackTree';
import { MODEL_CATALOG } from '@/types/modelProvider';
import './attack-tree.css';

export default function AttackTreePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  // Session management
  const sessionId = searchParams.get('session');
  const [session, setSession] = useState<AttackTreeSession | null>(null);

  // Attack tree state
  const [treeData, setTreeData] = useState<AttackTreeData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [mermaidCode, setMermaidCode] = useState<string>('');

  // Generation parameters
  const [generationParams, setGenerationParams] = useState<AttackTreeGenerationParams>({
    systemDescription: '',
    appType: 'web',
    authentication: ['session'],
    internetFacing: true,
    sensitiveData: true,
    modelId: MODEL_CATALOG.find(m => m.provider === 'bedrock')?.id
  });

  // View settings
  const [viewSettings, setViewSettings] = useState({
    zoom: 1,
    panX: 0,
    panY: 0,
    layoutMode: 'horizontal' as 'horizontal' | 'vertical' | 'radial',
    showLabels: true,
    showMetrics: true
  });

  // Load session on mount
  useEffect(() => {
    if (sessionId) {
      loadSession(sessionId);
    }
  }, [sessionId]);

  // Auto-save session
  useEffect(() => {
    if (session && treeData) {
      saveSession();
    }
  }, [treeData, viewSettings]);

  const loadSession = (id: string) => {
    try {
      const stored = localStorage.getItem(`attack_tree_session_${id}`);
      if (stored) {
        const sessionData: AttackTreeSession = JSON.parse(stored);
        setSession(sessionData);
        setTreeData(sessionData.treeData);
        setViewSettings(sessionData.viewSettings);

        // Check if this is a Mermaid-based tree
        if (sessionData.treeData.root.metadata?.mermaidCode) {
          setMermaidCode(sessionData.treeData.root.metadata.mermaidCode as string);
        }

      }
    } catch (error) {
      console.error('[AttackTree] Error loading session:', error);
      showToast('Failed to load attack tree session', 'error');
    }
  };

  const saveSession = useCallback(() => {
    if (!treeData) return;

    const sessionData: AttackTreeSession = {
      id: sessionId || `attack_tree_${Date.now()}`,
      treeData: {
        ...treeData,
        updatedAt: new Date().toISOString()
      },
      selectedNodeId: undefined,
      expandedNodes: [],
      viewSettings
    };

    const id = sessionData.id;
    localStorage.setItem(`attack_tree_session_${id}`, JSON.stringify(sessionData));

    // Update URL if needed
    if (!sessionId) {
      router.replace(`/attack-tree?session=${id}`);
    }

    setSession(sessionData);
  }, [treeData, viewSettings, sessionId, router]);


  const generateTree = async () => {
    if (!generationParams.systemDescription.trim()) {
      showToast('Please provide a system description', 'error');
      return;
    }

    setIsGenerating(true);
    try {
      const prompt = createAttackTreePrompt(generationParams);
      const systemInstructions = createJsonStructurePrompt();

      // Load provider configurations from sessionStorage
      const savedKeys = sessionStorage.getItem('byom_api_keys');
      const providerConfigs = savedKeys ? JSON.parse(savedKeys) : {};

      // Find the model configuration
      const modelConfig = MODEL_CATALOG.find(m => m.id === generationParams.modelId);
      if (!modelConfig) {
        throw new Error('Selected model not found');
      }

      // Build request body - matching the working format from AnalysisView
      const requestBody: Record<string, unknown> = {
        model_id: generationParams.modelId || 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
        prompt: prompt,
        images: [], // No images for attack tree generation
        system_instructions: systemInstructions
      };

      // Add provider-specific configurations
      switch (modelConfig.provider) {
        case 'ollama':
          // Add Ollama configuration if available
          const ollamaConf = providerConfigs.ollama;
          if (ollamaConf && 'mode' in ollamaConf) {
            requestBody.ollama_config = ollamaConf;
          }
          break;

        case 'azure':
          // Add Azure configuration if available
          const azureConf = providerConfigs.azure;
          if (azureConf && 'endpoint' in azureConf) {
            requestBody.azure_config = azureConf;
          }
          break;

        case 'openai':
        case 'anthropic':
        case 'google':
        case 'cohere':
        case 'mistral':
          const config = providerConfigs[modelConfig.provider];
          if (config && 'apiKey' in config && (config as any).apiKey) {
            requestBody.api_key = (config as any).apiKey;
            if ('baseUrl' in config && (config as any).baseUrl) requestBody.base_url = (config as any).baseUrl;
            if ('organization' in config && (config as any).organization) requestBody.organization = (config as any).organization;
            if ('maxTokens' in config && (config as any).maxTokens) requestBody.max_tokens = (config as any).maxTokens;
          }
          break;
      }

      console.log('[AttackTree] Sending request:', requestBody);

      const response = await fetch('http://localhost:8000/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[AttackTree] API error:', response.status, errorText);
        throw new Error(`Failed to generate attack tree: ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log('[AttackTree] Model response received, length:', result.response?.length);

      // Process response to get Mermaid code
      const mermaidDiagram = processAttackTreeResponse(result.response);
      setMermaidCode(mermaidDiagram);

      // Store in session for persistence
      const newTreeData: AttackTreeData = {
        id: `tree_${Date.now()}`,
        name: `Attack Tree - ${generationParams.appType || 'System'}`,
        systemDescription: generationParams.systemDescription,
        root: {
          id: 'mermaid_root',
          label: 'Attack Tree',
          metadata: { mermaidCode: mermaidDiagram }
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {
          appType: generationParams.appType,
          authentication: generationParams.authentication,
          internetFacing: generationParams.internetFacing,
          sensitiveData: generationParams.sensitiveData,
          analysisType: 'ATTACK_TREE',
          renderMode: 'mermaid'
        }
      };
      setTreeData(newTreeData);

      saveSession();
      showToast('Attack tree generated successfully', 'success');

    } catch (error) {
      console.error('[AttackTree] Generation error:', error);
      showToast('Failed to generate attack tree', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const exportTree = () => {
    if (!treeData && !mermaidCode) return;

    const format = 'mermaid'; // Could make this configurable

    if (format === 'mermaid') {
      const exportCode = mermaidCode || '';
      const blob = new Blob([exportCode], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `attack_tree_${Date.now()}.mmd`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      // Export as JSON
      const dataStr = JSON.stringify(treeData, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `attack_tree_${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }

    showToast('Attack tree exported', 'success');
  };


  return (
    <div className="attack-tree-page">
      <div className="attack-tree-header">
        <h1>Attack Tree Analysis</h1>
      </div>

      <div className="attack-tree-layout">
        <AttackTreeControls
          params={generationParams}
          onParamsChange={setGenerationParams}
          onGenerate={generateTree}
          onExport={exportTree}
          isGenerating={isGenerating}
          hasTree={!!treeData || !!mermaidCode}
          viewSettings={viewSettings}
          onViewSettingsChange={setViewSettings}
        />


        <div className="attack-tree-main">
          {mermaidCode ? (
            <MermaidAttackTree
              mermaidCode={mermaidCode}
              className="attack-tree-mermaid"
            />
          ) : (
            <div className="empty-state">
              <svg className="empty-icon" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 12h8M12 8v8" />
              </svg>
              <h3>No Attack Tree Generated</h3>
              <p>Configure your system parameters and generate an attack tree to begin analysis</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}