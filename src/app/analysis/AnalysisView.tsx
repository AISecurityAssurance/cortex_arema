"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Button, 
  Input, 
  Select,
  Header,
  SpaceBetween,
  Grid,
  FormField,
  FileUpload,
  Box,
  ButtonDropdown,
  Alert
} from "@cloudscape-design/components";
import { AnalysisLayout, SlidingPanel } from "@/components/layout";
import { ModelComparisonView } from "@/components/analysis/ModelComparisonViewCloudscape";
import { ValidationControls } from "@/components/validation/ValidationControlsCloudscape";
import { ModelSettings } from "@/components/settings";
import { useAnalysisSession } from "@/hooks/useAnalysisSession";
import { useValidation } from "@/hooks/useValidation";
import { useToast } from "@/contexts/FlashbarContext";
import { TemplateStorage } from "@/lib/storage/templateStorage";
import { PromptProcessor } from "@/lib/prompts/promptProcessor";
import { FindingExtractor } from "@/lib/analysis/findingExtractor";
import {
  SecurityFinding,
  ThreatAnnotation,
  FindingValidation,
  PromptTemplate,
} from "@/types";

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
  const { validations, addValidation, getStatus, setAllValidations } =
    useValidation({
      sessionId,
      onValidationSave: saveValidationToSession,
    });

  // Component state
  const [selectedFinding, setSelectedFinding] = useState<string | null>(null);
  const [analysisInProgress, setAnalysisInProgress] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Analysis configuration
  const [prompt, setPrompt] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isImageValidated, setIsImageValidated] = useState(false);
  const [isValidatingImage, setIsValidatingImage] = useState(false);
  const [selectedTemplate, setSelectedTemplate] =
    useState<PromptTemplate | null>(null);
  const [modelA, setModelA] = useState(MODELS[0]);
  const [modelB, setModelB] = useState(MODELS[1] || MODELS[0]);
  const [analysisType, setAnalysisType] = useState<
    "stride" | "stpa-sec" | "custom"
  >("stride");
  const [ollamaConfig, setOllamaConfig] = useState<{
    mode: 'local' | 'remote';
    remoteIp?: string;
    privateKeyPath?: string;
  } | null>(null);
  const [azureConfig, setAzureConfig] = useState<{
    endpoint?: string;
    apiKey?: string;
    deployment?: string;
    apiVersion?: string;
  } | null>(null);

  // Initialize session if needed
  useEffect(() => {
    if (!sessionId && !sessionLoading && !session) {
      const templateId = searchParams.get("template");
      const newSession = createSession("New Analysis Session");

      if (newSession && templateId) {
        const template = TemplateStorage.getTemplate(templateId);
        if (template) {
          setSelectedTemplate(template);
          updateTemplate(template);
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
    if (uploadedFiles.length > 0 && !isImageValidated) {
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
      const image = uploadedFiles[0];
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
    if (modelId.startsWith('ollama:') && ollamaConfig) {
      requestBody.ollama_config = ollamaConfig;
    }

    // Add Azure config if using an Azure OpenAI model
    if ((modelId.startsWith('gpt-') || modelId.startsWith('o1-')) && azureConfig) {
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
    if (typeof result !== 'string') {
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
        MODEL_IDS["Claude Sonnet"],
        validationPrompt,
        "You are an image analysis assistant. Analyze images to determine their type and content.",
        base64Image
      );

      // Ensure response is a string before processing
      const responseText = typeof response === 'string' 
        ? response 
        : String(response);
      
      const isValid = responseText.trim().toUpperCase().includes("YES");
      return isValid;
    } catch (error) {
      console.error("Error validating image:", error);
      showToast("Failed to validate image. Please try again.", "error");
      return false;
    }
  };

  const handleImageUpload = async (files: File[]) => {
    if (!files || files.length === 0) {
      setUploadedFiles([]);
      setIsImageValidated(false);
      setIsValidatingImage(false);
      return;
    }

    const file = files[0];
    try {
      setIsValidatingImage(true);
      setUploadedFiles(files);
      setIsImageValidated(false);

      showToast("Validating image...", "info");

      const isValid = await validateArchitectureImage(file);

      if (isValid) {
        setIsImageValidated(true);
        showToast("Architecture diagram uploaded successfully", "success");
      } else {
        setUploadedFiles([]);
        setIsImageValidated(false);
        showToast(
          "Please upload a valid architecture or system diagram",
          "error"
        );
      }
    } catch (error) {
      console.error("Error during image validation:", error);
      setUploadedFiles([]);
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

  const selectedValidation =
    selectedFinding && session
      ? session.validations.find((v) => v.findingId === selectedFinding) || null
      : null;

  const validationMap = new Map(
    Array.from(validations.values()).map((v) => [v.findingId, v.status])
  );

  if (sessionLoading) {
    return <div>Loading session...</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <SpaceBetween size="l">
        <Header
          variant="h1"
          description={session ? `Session ID: ${session.id.slice(0, 8)}` : undefined}
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              {session && (
                <Input
                  value={session.name}
                  onChange={({ detail }) => updateSession({ name: detail.value })}
                  placeholder="Session name..."
                />
              )}
              <ModelSettings 
                onOllamaConfigChange={setOllamaConfig}
                onAzureConfigChange={setAzureConfig}
              />
            </SpaceBetween>
          }
        >
          Security Analysis
        </Header>

        {error && (
          <Alert type="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        <SpaceBetween size="m">
          <Grid
            gridDefinition={[
              { colspan: 4 },
              { colspan: 4 },
              { colspan: 4 }
            ]}
          >
            <FormField label="Analysis Template" constraintText="Required">
              <Select
                selectedOption={selectedTemplate ? { value: selectedTemplate.id, label: selectedTemplate.name } : null}
                onChange={({ detail }) => {
                  const template = detail.selectedOption ? TemplateStorage.getTemplate(detail.selectedOption.value || '') : null;
                  if (template) {
                    setSelectedTemplate(template);
                    updateTemplate(template);
                    setAnalysisType(template.analysisType);
                  }
                }}
                placeholder="Select template..."
                options={TemplateStorage.getActiveTemplates().map((template) => ({
                  value: template.id,
                  label: template.name
                }))}
              />
            </FormField>

            <FormField label="Model A">
              <Select
                selectedOption={{ value: modelA, label: modelA }}
                onChange={({ detail }) => {
                  const newModelA = detail.selectedOption?.value || modelA;
                  setModelA(newModelA);
                  if (newModelA === modelB) {
                    const availableModel = MODELS.find(m => m !== newModelA);
                    if (availableModel) {
                      setModelB(availableModel);
                      updateModels(newModelA, availableModel);
                    }
                  } else {
                    updateModels(newModelA, modelB);
                  }
                }}
                options={MODELS.map((m) => ({ value: m, label: m }))}
              />
            </FormField>

            <FormField label="Model B">
              <Select
                selectedOption={{ value: modelB, label: modelB }}
                onChange={({ detail }) => {
                  const newModelB = detail.selectedOption?.value || modelB;
                  setModelB(newModelB);
                  if (newModelB === modelA) {
                    const availableModel = MODELS.find(m => m !== newModelB);
                    if (availableModel) {
                      setModelA(availableModel);
                      updateModels(availableModel, newModelB);
                    }
                  } else {
                    updateModels(modelA, newModelB);
                  }
                }}
                options={MODELS.map((m) => ({ value: m, label: m }))}
              />
            </FormField>
          </Grid>

          <FormField 
            label="System Description" 
            constraintText="Describe your system architecture and security concerns"
          >
            <Input
              placeholder="Describe your system architecture..."
              value={prompt}
              onChange={({ detail }) => setPrompt(detail.value)}
            />
          </FormField>

          <FormField 
            label="Architecture Diagram" 
            description="Upload an architecture diagram (optional)"
            constraintText={isValidatingImage ? "Validating..." : isImageValidated ? "Valid diagram" : ""}
          >
            <FileUpload
              onChange={({ detail }) => handleImageUpload(detail.value)}
              value={uploadedFiles}
              i18nStrings={{
                uploadButtonText: e => e ? "Choose files" : "Choose file",
                dropzoneText: e => e ? "Drop files to upload" : "Drop file to upload",
                removeFileAriaLabel: e => `Remove file ${e + 1}`,
                limitShowFewer: "Show fewer files",
                limitShowMore: "Show more files",
                errorIconAriaLabel: "Error"
              }}
              accept="image/*"
              multiple={false}
            />
          </FormField>

          <Box textAlign="center">
            <Button
              variant="primary"
              onClick={performAnalysis}
              disabled={analysisInProgress || !selectedTemplate}
              loading={analysisInProgress}
            >
              {analysisInProgress ? "Analyzing..." : "Analyze"}
            </Button>
          </Box>
        </SpaceBetween>

        <ModelComparisonView
          modelAResults={session?.modelAResults || []}
          modelBResults={session?.modelBResults || []}
          selectedFinding={selectedFinding || undefined}
          onFindingSelect={handleFindingSelect}
          modelAName={modelA}
          modelBName={modelB}
          validations={validationMap}
          onValidationUpdate={handleValidationUpdate}
        />
      </SpaceBetween>
    </div>
  );
};