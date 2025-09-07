"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnalysisLayout, SlidingPanel } from "@/components/layout";
import { ModelComparisonView } from "@/components/analysis";
import { ValidationControls } from "@/components/validation";
import { ModelSettings } from "@/components/settings";
import { useAnalysisSession } from "@/hooks/useAnalysisSession";
import { useValidation } from "@/hooks/useValidation";
import { useToast } from "@/contexts/ToastContext";
import { useTemplateStore } from "@/stores/templateStore";
import { PromptProcessor } from "@/lib/prompts/promptProcessor";
import { FindingExtractor } from "@/lib/analysis/findingExtractor";
import { FindingValidation, PromptTemplate } from "@/types";
import "./AnalysisView.css";

const MODEL_IDS = {
  // Bedrock Models
  "Claude Opus": "us.anthropic.claude-opus-4-20250514-v1:0",
  "Claude Sonnet": "us.anthropic.claude-sonnet-4-20250514-v1:0",
  "Claude 3.5 Sonnet": "us.anthropic.claude-3-5-sonnet-20241022-v2:0",
  "Nova Pro": "us.amazon.nova-pro-v1:0",
  "Nova Lite": "us.amazon.nova-lite-v1:0",
  "Llama 3.2 11B": "us.meta.llama3-2-11b-instruct-v1:0",
  "Pixtral Large": "us.mistral.pixtral-large-2502-v1:0",
  // Ollama Models
  "Ollama Llava": "ollama:llava",
  "Ollama Llama 3.2": "ollama:llama3.2",
  "Ollama Llama 3.2 Vision": "ollama:llama3.2-vision",
  "Ollama Qwen 2.5": "ollama:qwen2.5",
  // Azure OpenAI Models
  "GPT-4o": "gpt-4o",
  "GPT-4o Mini": "gpt-4o-mini",
  "GPT-4 Vision": "gpt-4-vision-preview",
  "GPT-4 Turbo": "gpt-4-turbo",
  "GPT-3.5 Turbo": "gpt-3.5-turbo",
  "O1 Preview": "o1-preview",
  "O1 Mini": "o1-mini",
};

const MODELS = Object.keys(MODEL_IDS);

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
  const [isImageValidated, setIsImageValidated] = useState(false);
  const [isValidatingImage, setIsValidatingImage] = useState(false);
  const [selectedTemplate, setSelectedTemplate] =
    useState<PromptTemplate | null>(null);

  // Template store
  const { loadTemplates, getTemplate, getAllTemplates } = useTemplateStore();
  const [modelA, setModelA] = useState(MODELS[0]);
  const [modelB, setModelB] = useState(MODELS[1] || MODELS[0]);
  const [analysisType, setAnalysisType] = useState<
    "stride" | "stpa-sec" | "custom"
  >("stride");
  const [ollamaConfig, setOllamaConfig] = useState<{
    mode: "local" | "remote";
    remoteIp?: string;
    privateKeyPath?: string;
  } | null>(null);
  const [azureConfig, setAzureConfig] = useState<{
    endpoint?: string;
    apiKey?: string;
    deployment?: string;
    apiVersion?: string;
  } | null>(null);

  // Load templates on mount
  useEffect(() => {
    loadTemplates();
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
          setAnalysisType(template.analysisType);
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
        setAnalysisType(session.promptTemplate.analysisType);
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

    // Check if image is being validated
    if (isValidatingImage) {
      setError("Please wait for image validation to complete");
      showToast("Image validation in progress", "warning");
      return;
    }

    // Check if there's an image that hasn't been validated
    if (image && !isImageValidated) {
      setError("Invalid image uploaded");
      showToast(
        "The uploaded image is not a valid architecture diagram",
        "error"
      );
      return;
    }

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
      if (image && isImageValidated) {
        finalPrompt = PromptProcessor.addImageContext(finalPrompt, true);
      }

      // Prepare image if provided and validated
      let base64Image: string | undefined;
      if (image && isImageValidated) {
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
    // Build request body
    const requestBody: Record<string, unknown> = {
      model_id: modelId,
      prompt,
      images: base64Image ? [base64Image] : [],
      system_instructions: systemPrompt,
    };

    // Add Ollama config if using an Ollama model
    if (modelId.startsWith("ollama:") && ollamaConfig) {
      requestBody.ollama_config = ollamaConfig;
    }

    // Add Azure config if using an Azure OpenAI model
    if (
      (modelId.startsWith("gpt-") || modelId.startsWith("o1-")) &&
      azureConfig
    ) {
      requestBody.azure_config = azureConfig;
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

  const validateArchitectureImage = async (file: File): Promise<boolean> => {
    try {
      const base64Image = await fileToBase64(file);

      const validationPrompt = `Analyze this image and determine if it appears to be a software/system architecture diagram, network diagram, or technical design diagram. 
      
      Look for elements like:
      - Boxes or shapes representing components/services
      - Arrows or lines showing connections/data flow
      - Technical labels or annotations
      - Network topology elements
      - System boundaries or layers
      
      Respond with ONLY "YES" if this appears to be an architecture/technical diagram, or "NO" if it appears to be something else (like a photo, screenshot of unrelated content, meme, etc.).`;

      const response = await callModel(
        MODEL_IDS["Claude Opus"],
        validationPrompt,
        "You are an image analysis assistant. Analyze images to determine their type and content.",
        base64Image
      );

      // Ensure response is a string before processing
      const responseText =
        typeof response === "string" ? response : String(response);

      const isValid = responseText.trim().toUpperCase().includes("YES");
      return isValid;
    } catch (error) {
      console.error("Error validating image:", error);
      showToast("Failed to validate image. Please try again.", "error");
      return false;
    }
  };

  const handleImageUpload = async (file: File | null) => {
    if (!file) {
      setImage(null);
      setIsImageValidated(false);
      setIsValidatingImage(false);
      return;
    }

    try {
      setIsValidatingImage(true);
      // Temporarily set the image to show filename
      setImage(file);
      setIsImageValidated(false);

      // Show loading toast
      showToast("Validating image...", "info");

      const isValid = await validateArchitectureImage(file);

      if (isValid) {
        setIsImageValidated(true);
        showToast("Architecture diagram uploaded successfully", "success");
      } else {
        setImage(null);
        setIsImageValidated(false);
        showToast(
          "Please upload a valid architecture or system diagram",
          "error"
        );
      }
    } catch (error) {
      console.error("Error during image validation:", error);
      setImage(null);
      setIsImageValidated(false);
      showToast("Error validating image", "error");
    } finally {
      setIsValidatingImage(false);
    }
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
                  setAnalysisType(template.analysisType);
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
                analysisInProgress || isValidatingImage ? "disabled" : ""
              }`}
            >
              <input
                type="file"
                accept="image/*"
                disabled={analysisInProgress || isValidatingImage}
                onChange={(e) => {
                  if (analysisInProgress || isValidatingImage) return;
                  const file = e.target.files?.[0] || null;
                  handleImageUpload(file);
                }}
                style={{ display: "none" }}
              />
              <span>
                <svg className="icon" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM5 7a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H7a2 2 0 01-2-2V7zm2 0v6h6V7H7z" />
                </svg>
                {isValidatingImage
                  ? "Validating..."
                  : image && isImageValidated
                  ? image.name.slice(0, 20)
                  : "Upload diagram"}
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
            <ModelSettings
              onOllamaConfigChange={setOllamaConfig}
              onAzureConfigChange={setAzureConfig}
            />
          </div>

          <div className="control-group">
            <div className="model-selectors">
              <select
                value={modelA}
                onChange={(e) => {
                  const newModelA = e.target.value;
                  setModelA(newModelA);
                  // If the new selection matches modelB, find another available model for modelB
                  if (newModelA === modelB) {
                    const availableModel = MODELS.find((m) => m !== newModelA);
                    if (availableModel) {
                      setModelB(availableModel);
                      updateModels(newModelA, availableModel);
                    }
                  } else {
                    updateModels(newModelA, modelB);
                  }
                }}
              >
                {MODELS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <span className="vs">vs</span>
              <select
                value={modelB}
                onChange={(e) => {
                  const newModelB = e.target.value;
                  setModelB(newModelB);
                  // If the new selection matches modelA, find another available model for modelA
                  if (newModelB === modelA) {
                    const availableModel = MODELS.find((m) => m !== newModelB);
                    if (availableModel) {
                      setModelA(availableModel);
                      updateModels(availableModel, newModelB);
                    }
                  } else {
                    updateModels(modelA, newModelB);
                  }
                }}
              >
                {MODELS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
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
            modelAName={modelA}
            modelBName={modelB}
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
