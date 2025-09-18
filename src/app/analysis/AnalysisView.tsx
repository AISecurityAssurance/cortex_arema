"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnalysisLayout, SlidingPanel } from "@/components/layout";
import { ModelComparisonView } from "@/components/analysis";
import { ValidationControls } from "@/components/validation";
import { ModelSelector } from "@/components/settings";
import { useAnalysisSession } from "@/hooks/useAnalysisSession";
import { useValidation } from "@/hooks/useValidation";
import { useToast } from "@/contexts/ToastContext";
import { useTemplateStore } from "@/stores/templateStore";
import { PromptProcessor } from "@/lib/prompts/promptProcessor";
import { FindingExtractor } from "@/lib/analysis/findingExtractor";
import { FindingValidation, PromptTemplate } from "@/types";
import {
  ModelProvider,
  MODEL_CATALOG,
  OpenAIConfig,
  AnthropicConfig,
  GoogleConfig,
  CohereConfig,
  MistralConfig,
  OllamaConfig,
  AzureOpenAIConfig
} from "@/types/modelProvider";
import "./AnalysisView.css";

// Legacy model mapping for backward compatibility
const MODEL_IDS: Record<string, string> = {};
MODEL_CATALOG.forEach(model => {
  MODEL_IDS[model.name] = model.id;
});

interface AnalysisViewProps {
  sessionId?: string;
}

export const AnalysisView: React.FC<AnalysisViewProps> = ({ sessionId }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  // Session management
  const {
    session,
    loading: sessionLoading,
    createSession,
    updateSession,
    updateFindings,
    saveValidation: saveValidationToSession,
    updateTemplate,
    updateModels,
  } = useAnalysisSession(sessionId);

  // Validation management
  const { validations, addValidation, setAllValidations } = useValidation({
    sessionId,
    onValidationSave: saveValidationToSession,
  });

  // Component state
  const [selectedFinding, setSelectedFinding] = useState<string | null>(null);
  const [analysisInProgress, setAnalysisInProgress] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Analysis configuration
  const [prompt, setPrompt] = useState("");
  const [image, setImage] = useState<File | null>(null);
  // Removed image validation states - no longer validating if image is architecture diagram
  const [selectedTemplate, setSelectedTemplate] =
    useState<PromptTemplate | null>(null);

  // Template store
  const { loadTemplates, getTemplate, getAllTemplates } = useTemplateStore();
  const [modelA, setModelA] = useState(MODEL_CATALOG[0]?.id || '');
  const [modelB, setModelB] = useState(MODEL_CATALOG[1]?.id || MODEL_CATALOG[0]?.id || '');
  const [ollamaConfig, setOllamaConfig] = useState<{
    mode: "local" | "remote";
    baseUrl?: string;
    remoteIp?: string;
    privateKeyPath?: string;
  } | null>(null);
  const [azureConfig, setAzureConfig] = useState<{
    endpoint?: string;
    apiKey?: string;
    deployment?: string;
    apiVersion?: string;
  } | null>(null);

  // BYOM configurations - loaded from sessionStorage
  const [providerConfigs, setProviderConfigs] = useState<Partial<Record<ModelProvider,
    OpenAIConfig | AnthropicConfig | GoogleConfig | CohereConfig | MistralConfig | OllamaConfig | AzureOpenAIConfig
  >>>({});
  const [configuredProviders, setConfiguredProviders] = useState<ModelProvider[]>(['bedrock']);

  // Load templates and provider configurations on mount
  useEffect(() => {
    loadTemplates();

    // Load saved provider configurations from session storage
    const savedKeys = sessionStorage.getItem('byom_api_keys');
    if (savedKeys) {
      try {
        const parsed = JSON.parse(savedKeys);
        setProviderConfigs(parsed);

        // Update configured providers list based on saved configurations
        const configured: ModelProvider[] = ['bedrock']; // Always available
        Object.entries(parsed).forEach(([provider, config]) => {
          const p = provider as ModelProvider;
          if (p === 'ollama' || p === 'azure') {
            configured.push(p);
          } else if (config && typeof config === 'object' && 'apiKey' in config) {
            const configWithKey = config as { apiKey?: string };
            if (configWithKey.apiKey) {
              configured.push(p);
            }
          }
        });
        setConfiguredProviders(configured);

        // Set legacy configs for backward compatibility
        if (parsed.ollama && 'mode' in parsed.ollama) {
          setOllamaConfig(parsed.ollama as OllamaConfig);
        }
        if (parsed.azure && 'endpoint' in parsed.azure) {
          setAzureConfig(parsed.azure as AzureOpenAIConfig);
        }
      } catch (error) {
        console.error('[AnalysisView] Error loading provider configurations:', error);
      }
    }
  }, [loadTemplates]);

  // Initialize session if needed
  useEffect(() => {
    if (!sessionId && !sessionLoading && !session) {
      const templateId = searchParams.get("template");
      const newSession = createSession("New Analysis Session");

      if (newSession && templateId) {
        const template = getTemplate(templateId);
        if (template) {
          // Convert to PromptTemplate format
          const promptTemplate: PromptTemplate = {
            id: template.id,
            name: template.name,
            description: template.description,
            template: template.template,
            variables: template.variables?.map((v) => v.name) || [],
            analysisType: template.analysisType,
            expectedOutputFormat: template.expectedOutputFormat,
            version: template.version,
            isActive: true,
            createdAt: template.metadata?.createdAt || new Date().toISOString(),
            updatedAt: template.metadata?.updatedAt || new Date().toISOString(),
          };
          setSelectedTemplate(promptTemplate);
          updateTemplate(promptTemplate);
        }
      }

      if (newSession) {
        router.push(`/analysis?session=${newSession.id}`);
      }
    }
  }, [
    sessionId,
    sessionLoading,
    session,
    createSession,
    router,
    searchParams,
    updateTemplate,
    getTemplate,
  ]);

  // Load session data
  useEffect(() => {
    if (session && !sessionLoading) {
      setAllValidations(session.validations);

      // Only update models if they're different from session
      if (session.modelAId !== modelA || session.modelBId !== modelB) {
        updateModels(modelA, modelB);
      }

      if (session.promptTemplate) {
        setSelectedTemplate(session.promptTemplate);
      }
    }
  }, [
    session,
    sessionLoading,
    setAllValidations,
    updateModels,
    modelA,
    modelB,
  ]);

  const handleFindingSelect = (findingId: string) => {
    setSelectedFinding(findingId);
  };

  const handleValidationUpdate = (validation: FindingValidation) => {
    addValidation(validation);
  };

  const performAnalysis = async () => {
    // Clear any previous errors
    setError(null);

    if (!session) {
      setError("No active session");
      showToast("Please create or select a session", "error");
      return;
    }

    if (!selectedTemplate) {
      setError("Please select a template first");
      showToast("Please select an analysis template", "error");
      return;
    }

    if (!prompt.trim()) {
      setError("Please provide a system description");
      showToast("Please describe your system", "error");
      return;
    }

    // Image validation removed - accept any image

    setAnalysisInProgress(true);

    try {
      // Process template
      const variables = PromptProcessor.extractVariablesFromInput(
        prompt,
        selectedTemplate
      );
      const processed = PromptProcessor.processTemplate(
        selectedTemplate,
        variables
      );
      const systemPrompt = PromptProcessor.buildSystemPrompt(
        selectedTemplate.analysisType
      );

      let finalPrompt = processed.resolvedPrompt;
      if (image) {
        finalPrompt = PromptProcessor.addImageContext(finalPrompt, true);
      }

      // Prepare image if provided
      let base64Image: string | undefined;
      if (image) {
        base64Image = await fileToBase64(image);
      }

      // Call both models in parallel
      const [responseA, responseB] = await Promise.all([
        callModel(
          MODEL_IDS[modelA as keyof typeof MODEL_IDS],
          finalPrompt,
          systemPrompt,
          base64Image
        ),
        callModel(
          MODEL_IDS[modelB as keyof typeof MODEL_IDS],
          finalPrompt,
          systemPrompt,
          base64Image
        ),
      ]);

      // Extract findings
      const findingsA = FindingExtractor.extractFindings(
        responseA,
        selectedTemplate.analysisType,
        modelA
      );

      const findingsB = FindingExtractor.extractFindings(
        responseB,
        selectedTemplate.analysisType,
        modelB
      );

      // Update session
      updateFindings(findingsA, findingsB);
    } catch (err) {
      console.error("Analysis error:", err);
      setError("Failed to complete analysis. Please try again.");
    } finally {
      setAnalysisInProgress(false);
    }
  };

  const callModel = async (
    modelId: string,
    prompt: string,
    systemPrompt: string,
    base64Image?: string
  ): Promise<string> => {
    // Find the model configuration
    const modelConfig = MODEL_CATALOG.find(m => m.id === modelId);
    if (!modelConfig) {
      throw new Error(`Unknown model: ${modelId}`);
    }

    // Build request body
    const requestBody: Record<string, unknown> = {
      model_id: modelId,
      prompt,
      images: base64Image ? [base64Image] : [],
      system_instructions: systemPrompt,
      provider: modelConfig.provider,
    };

    // Add provider-specific configurations
    switch (modelConfig.provider) {
      case 'ollama':
        if (ollamaConfig) {
          requestBody.ollama_config = ollamaConfig;
        }
        break;

      case 'azure':
        if (azureConfig) {
          requestBody.azure_config = azureConfig;
        }
        break;

      case 'openai':
      case 'anthropic':
      case 'google':
      case 'cohere':
      case 'mistral':
        const config = providerConfigs[modelConfig.provider];
        if (config && 'apiKey' in config && config.apiKey) {
          requestBody.api_key = config.apiKey;
          if ('baseUrl' in config && config.baseUrl) requestBody.base_url = config.baseUrl;
          if ('organization' in config && config.organization) requestBody.organization = config.organization;
          if ('maxTokens' in config && config.maxTokens) requestBody.max_tokens = config.maxTokens;
        }
        break;
    }

    const response = await fetch("http://localhost:8000/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Model call failed: ${response.statusText}`);
    }

    const json = await response.json();
    // The backend returns a standardized format for all providers
    // with the actual response text in the 'response' field
    const result = json.response || "No response from model.";

    // Ensure we always return a string
    if (typeof result !== "string") {
      return String(result);
    }

    return result;
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = (reader.result as string).split(",")[1];
        resolve(result);
      };
      reader.onerror = (error) => reject(error);
    });
  };


  const handleImageUpload = (file: File | null) => {
    if (!file) {
      setImage(null);
      return;
    }

    setImage(file);
    showToast("Image uploaded successfully", "success");
  };

  const selectedFindingData = selectedFinding
    ? [
        ...(session?.modelAResults || []),
        ...(session?.modelBResults || []),
      ].find((f) => f.id === selectedFinding) || null
    : null;

  // First check the validations Map (in-memory state), then fall back to session validations
  const selectedValidation = selectedFinding
    ? validations.get(selectedFinding) ||
      session?.validations.find((v) => v.findingId === selectedFinding) ||
      null
    : null;

  const validationMap = new Map(
    Array.from(validations.values()).map((v) => [v.findingId, v.status])
  );

  if (sessionLoading) {
    return <div className="loading-screen">Loading session...</div>;
  }

  return (
    <div className="analysis-view">
      <div className="analysis-header">
        {session && (
          <div className="session-info">
            <input
              type="text"
              className="session-name-input"
              value={session.name}
              onChange={(e) => updateSession({ name: e.target.value })}
              placeholder="Session name..."
            />
            <span className="session-id">ID: {session.id.slice(0, 8)}</span>
          </div>
        )}

        <div className="analysis-controls">
          <div className="control-group">
            <select
              className="template-select"
              value={selectedTemplate?.id || ""}
              onChange={(e) => {
                const template = getTemplate(e.target.value);
                if (template) {
                  // Convert to PromptTemplate format
                  const promptTemplate: PromptTemplate = {
                    id: template.id,
                    name: template.name,
                    description: template.description,
                    template: template.template,
                    variables: template.variables?.map((v) => v.name) || [],
                    analysisType: template.analysisType,
                    expectedOutputFormat: template.expectedOutputFormat,
                    version: template.version,
                    isActive: true,
                    createdAt:
                      template.metadata?.createdAt || new Date().toISOString(),
                    updatedAt:
                      template.metadata?.updatedAt || new Date().toISOString(),
                  };
                  setSelectedTemplate(promptTemplate);
                  updateTemplate(promptTemplate);
                }
              }}
            >
              <option value="">Select template...</option>
              {getAllTemplates().map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>

            <label
              className={`image-upload ${
                analysisInProgress ? "disabled" : ""
              }`}
            >
              <input
                type="file"
                accept="image/*"
                disabled={analysisInProgress}
                onChange={(e) => {
                  if (analysisInProgress) return;
                  const file = e.target.files?.[0] || null;
                  handleImageUpload(file);
                }}
                style={{ display: "none" }}
              />
              <span>
                <svg className="icon" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM5 7a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H7a2 2 0 01-2-2V7zm2 0v6h6V7H7z" />
                </svg>
                {image ? image.name.slice(0, 20) : "Upload image"}
              </span>
            </label>
          </div>

          <div className="control-group center">
            <input
              type="text"
              className="prompt-input"
              placeholder="Describe your system architecture..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>


          <div className="control-group">
            <div className="model-selectors">
              <ModelSelector
                value={modelA}
                onChange={(newModelA) => {
                  setModelA(newModelA);
                  // If the new selection matches modelB, find another available model for modelB
                  if (newModelA === modelB) {
                    const availableModel = MODEL_CATALOG
                      .filter(m => configuredProviders.includes(m.provider))
                      .find(m => m.id !== newModelA);
                    if (availableModel) {
                      setModelB(availableModel.id);
                      updateModels(newModelA, availableModel.id);
                    }
                  } else {
                    updateModels(newModelA, modelB);
                  }
                }}
                configuredProviders={configuredProviders}
                label="Model A"
              />
              <span className="vs">vs</span>
              <ModelSelector
                value={modelB}
                onChange={(newModelB) => {
                  setModelB(newModelB);
                  // If the new selection matches modelA, find another available model for modelA
                  if (newModelB === modelA) {
                    const availableModel = MODEL_CATALOG
                      .filter(m => configuredProviders.includes(m.provider))
                      .find(m => m.id !== newModelB);
                    if (availableModel) {
                      setModelA(availableModel.id);
                      updateModels(availableModel.id, newModelB);
                    }
                  } else {
                    updateModels(modelA, newModelB);
                  }
                }}
                configuredProviders={configuredProviders}
                label="Model B"
              />
            </div>

            <button
              className="analyze-button"
              onClick={performAnalysis}
              disabled={analysisInProgress || !selectedTemplate}
            >
              {analysisInProgress ? (
                <>
                  <span className="spinner"></span>
                  Analyzing
                </>
              ) : (
                "Analyze"
              )}
            </button>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}
      </div>

      <AnalysisLayout
        centerPanel={
          <ModelComparisonView
            modelAResults={session?.modelAResults || []}
            modelBResults={session?.modelBResults || []}
            selectedFinding={selectedFinding || undefined}
            onFindingSelect={handleFindingSelect}
            modelAName={MODEL_CATALOG.find(m => m.id === modelA)?.name || modelA}
            modelBName={MODEL_CATALOG.find(m => m.id === modelB)?.name || modelB}
            validations={validationMap}
          />
        }
        rightPanel={
          <SlidingPanel side="right" width="380px">
            <ValidationControls
              finding={selectedFindingData}
              validation={selectedValidation}
              onValidationUpdate={handleValidationUpdate}
            />
          </SlidingPanel>
        }
      />
    </div>
  );
};
