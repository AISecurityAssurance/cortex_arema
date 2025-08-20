import { useState, useCallback } from "react";
import { PipelineNode, Connection } from "../types/pipeline";
import {
  PipelineExecutionState,
  NodeExecutionState,
  ValidationResult,
} from "../types/execution";
import { TemplateStorage } from "@/lib/storage/templateStorage";
import { PromptProcessor } from "@/lib/prompts/promptProcessor";
import { FindingExtractor } from "@/lib/analysis/findingExtractor";

export function usePipelineExecution() {
  const [executionState, setExecutionState] = useState<PipelineExecutionState>({
    pipelineId: "",
    status: "idle",
    nodeStates: new Map(),
    totalProgress: 0,
  });

  const validatePipeline = (
    nodes: PipelineNode[],
    connections: Connection[]
  ): ValidationResult => {
    const errors = [];
    const warnings = [];

    if (nodes.length === 0) {
      errors.push({
        message: "Pipeline is empty",
        type: "missing_connection" as const,
      });
    }

    const inputNodes = nodes.filter((n) => n.type.startsWith("input-"));
    const analysisNodes = nodes.filter((n) => n.type.startsWith("analysis-"));
    const outputNodes = nodes.filter((n) => n.type.startsWith("output-"));

    if (inputNodes.length === 0) {
      errors.push({
        message: "Pipeline needs at least one input node",
        type: "missing_connection" as const,
      });
    }

    // Validate input nodes have required data
    inputNodes.forEach((node) => {
      if (node.type === "input-diagram") {
        const config = (node as any).config;
        if (!config.file && !config.fileName) {
          errors.push({
            nodeId: node.id,
            message: `Architecture diagram node "${node.id}" requires a file upload`,
            type: "missing_connection" as const,
          });
        }
      }
      if (node.type === "input-text") {
        const config = (node as any).config;
        if (!config.systemName || config.systemName.trim() === '') {
          warnings.push({
            nodeId: node.id,
            message: `Text input node "${node.id}" has no system name`,
            type: "unused_output" as const,
          });
        }
      }
    });

    if (analysisNodes.length === 0) {
      errors.push({
        message: "Pipeline needs at least one analysis node",
        type: "missing_connection" as const,
      });
    }

    analysisNodes.forEach((node) => {
      const hasInput = connections.some((c) => c.to.nodeId === node.id);
      if (!hasInput) {
        errors.push({
          nodeId: node.id,
          message: `Analysis node "${node.id}" has no input connection`,
          type: "missing_connection" as const,
        });
      }
      
      // Validate system description for STRIDE and STPA-SEC nodes
      const nodeConfig = (node as any).config;
      if (!nodeConfig.systemDescription || nodeConfig.systemDescription.trim() === '') {
        errors.push({
          nodeId: node.id,
          message: `Analysis node "${node.id}" requires a system description`,
          type: "missing_connection" as const,
        });
      }
    });

    outputNodes.forEach((node) => {
      const hasInput = connections.some((c) => c.to.nodeId === node.id);
      if (!hasInput) {
        warnings.push({
          nodeId: node.id,
          message: `Output node "${node.id}" has no input connection`,
          type: "unused_output" as const,
        });
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  };

  const buildExecutionOrder = (
    nodes: PipelineNode[],
    connections: Connection[]
  ): string[] => {
    const graph = new Map<string, string[]>();
    const inDegree = new Map<string, number>();

    nodes.forEach((node) => {
      graph.set(node.id, []);
      inDegree.set(node.id, 0);
    });

    connections.forEach((conn) => {
      const fromList = graph.get(conn.from.nodeId) || [];
      fromList.push(conn.to.nodeId);
      graph.set(conn.from.nodeId, fromList);
      inDegree.set(conn.to.nodeId, (inDegree.get(conn.to.nodeId) || 0) + 1);
    });

    const queue: string[] = [];
    const result: string[] = [];

    inDegree.forEach((degree, nodeId) => {
      if (degree === 0) {
        queue.push(nodeId);
      }
    });

    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      result.push(nodeId);

      const neighbors = graph.get(nodeId) || [];
      neighbors.forEach((neighbor) => {
        const newDegree = (inDegree.get(neighbor) || 0) - 1;
        inDegree.set(neighbor, newDegree);
        if (newDegree === 0) {
          queue.push(neighbor);
        }
      });
    }

    return result;
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const dataUrl = reader.result as string;
        // Extract base64 portion after the comma
        const base64 = dataUrl.split(",")[1];
        if (!base64) {
          reject(new Error("Failed to extract base64 from data URL"));
          return;
        }
        console.log("Base64 extraction:", {
          originalLength: dataUrl.length,
          base64Length: base64.length,
          hasDataPrefix: dataUrl.startsWith("data:"),
          extractedCorrectly: !base64.includes("data:") && !base64.includes(",")
        });
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const callModelAPI = async (
    modelId: string,
    prompt: string,
    systemPrompt: string,
    base64Image?: string,
    nodeOllamaConfig?: any
  ): Promise<string> => {
    console.log("Calling model API with:", {
      modelId,
      promptLength: prompt.length,
      systemPromptLength: systemPrompt.length,
      hasImage: !!base64Image,
      imageCount: base64Image ? 1 : 0,
      imageBase64Length: base64Image ? base64Image.length : 0,
    });

    const requestBody: Record<string, unknown> = {
      model_id: modelId,
      prompt,
      images: base64Image ? [base64Image] : [],
      system_instructions: systemPrompt,
    };

    // Add Ollama config if using an Ollama model
    // Priority: node config > localStorage
    if (modelId.startsWith('ollama:')) {
      if (nodeOllamaConfig) {
        // Use config from node if available
        requestBody.ollama_config = nodeOllamaConfig;
      } else {
        // Fall back to localStorage
        const savedConfig = localStorage.getItem('ollama_config');
        if (savedConfig) {
          try {
            const ollamaConfig = JSON.parse(savedConfig);
            requestBody.ollama_config = ollamaConfig;
          } catch {
            // Ignore parse errors
          }
        }
      }
    }

    // Add Azure config if using an Azure OpenAI model
    if (modelId.startsWith('gpt-') || modelId.startsWith('o1-')) {
      const savedConfig = localStorage.getItem('azure_openai_config');
      if (savedConfig) {
        try {
          const azureConfig = JSON.parse(savedConfig);
          requestBody.azure_config = azureConfig;
        } catch {
          // Ignore parse errors
        }
      }
    }
    
    console.log("Request body size:", JSON.stringify(requestBody).length, "bytes");

    try {
      const response = await fetch("http://localhost:8000/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Model API error response:", errorText);
        throw new Error(`Model API call failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const json = await response.json();
      console.log("Model API response received");
      
      // The backend returns a standardized format for all providers
      // with the actual response text in the 'response' field
      return json.response || "No response from model.";
    } catch (error) {
      console.error("Error calling model API:", error);
      throw error;
    }
  };

  const executeNode = async (node: PipelineNode, inputs: any): Promise<any> => {
    switch (node.type) {
      case "input-diagram":
        const diagramConfig = (node as any).config;
        if (!diagramConfig.file) {
          console.error("Diagram node validation failed:", {
            nodeId: node.id,
            config: diagramConfig,
            hasFile: !!diagramConfig.file,
            hasFileName: !!diagramConfig.fileName
          });
          throw new Error("Architecture diagram is required. Please upload a diagram file in the node configuration.");
        }
        console.log("Processing diagram file:", {
          fileName: diagramConfig.fileName,
          fileType: diagramConfig.file.type,
          fileSize: diagramConfig.file.size,
        });
        const diagramBase64 = await fileToBase64(diagramConfig.file);
        console.log("Diagram converted to base64:", {
          fileName: diagramConfig.fileName,
          fileType: diagramConfig.file.type,
          fileSize: diagramConfig.file.size,
          base64Length: diagramBase64.length,
          base64SampleStart: diagramBase64.substring(0, 50) + "...",
        });
        return {
          type: "diagram",
          data: diagramConfig.file,
          base64: diagramBase64,
          mediaType: diagramConfig.file.type || "image/jpeg",
        };

      case "input-text":
        const textConfig = (node as any).config;
        if (!textConfig.systemName) {
          throw new Error("System name is required");
        }
        return {
          type: "text",
          data: {
            systemName: textConfig.systemName,
            description: textConfig.description,
            context: textConfig.context,
          },
        };

      case "analysis-stride":
      case "analysis-stpa-sec":
        const analysisConfig = (node as any).config;

        // Validate required system description
        if (!analysisConfig.systemDescription || analysisConfig.systemDescription.trim() === '') {
          console.error("System description validation failed:", {
            systemDescription: analysisConfig.systemDescription,
            nodeId: node.id,
            nodeType: node.type,
            config: analysisConfig
          });
          throw new Error("System description is required for analysis");
        }
        
        // Validate model ID
        if (!analysisConfig.modelId) {
          console.error("Model ID is missing:", {
            nodeId: node.id,
            config: analysisConfig
          });
          throw new Error("Model ID is required for analysis");
        }

        // Get the template
        console.log("Loading template:", analysisConfig.promptTemplate);
        const template = TemplateStorage.getTemplate(
          analysisConfig.promptTemplate
        );
        if (!template) {
          console.error("Template not found:", {
            templateId: analysisConfig.promptTemplate,
            availableTemplates: TemplateStorage.getAllTemplates().map(t => t.id)
          });
          throw new Error(
            `Template ${analysisConfig.promptTemplate} not found`
          );
        }
        console.log("Template loaded successfully:", template.id);

        // Start with the system description from the node config
        let systemDescription = analysisConfig.systemDescription;
        let architectureComponents = "";
        let base64Image = "";

        // Handle different input types to enhance the description
        if (inputs) {
          if (Array.isArray(inputs)) {
            inputs.forEach((input) => {
              if (input?.type === "text") {
                // Enhance system description with text input data
                systemDescription += `\n\nAdditional Details:\nSystem Name: ${input.data.systemName}\nDescription: ${input.data.description}\nContext: ${input.data.context}`;
                architectureComponents = input.data.description;
              }
              if (input?.type === "diagram") {
                base64Image = input.base64;
                if (!architectureComponents || architectureComponents === "") {
                  architectureComponents = "The architecture components and their relationships are shown in the provided diagram. Please analyze all visible components, connections, data flows, and trust boundaries.";
                } else {
                  architectureComponents += "\n\nAdditional components and relationships are shown in the provided architecture diagram.";
                }
              }
            });
          } else {
            if (inputs.type === "text") {
              // Enhance system description with text input data
              systemDescription += `\n\nAdditional Details:\nSystem Name: ${inputs.data.systemName}\nDescription: ${inputs.data.description}\nContext: ${inputs.data.context}`;
              architectureComponents = inputs.data.description;
            }
            if (inputs.type === "diagram") {
              base64Image = inputs.base64;
              architectureComponents = "The architecture components and their relationships are shown in the provided diagram. Please analyze all visible components, connections, data flows, and trust boundaries.";
            }
          }
        }
        
        // If no architecture components were provided, use a default description
        if (!architectureComponents) {
          architectureComponents = "Please analyze the system architecture based on the provided description.";
        }

        if (!systemDescription && !base64Image) {
          throw new Error("No input data available for analysis");
        }

        // Process the template with variables
        const variables: Record<string, string> = {
          systemDescription,
          architectureComponents,
          controlStructure: architectureComponents, // For STPA-SEC
          systemName:
            systemDescription.split("\n")[0]?.replace("System Name: ", "") ||
            "System",
          components: architectureComponents,
          dataFlows: "Data flows as shown in the architecture",
        };

        console.log("Analysis node inputs:", {
          nodeId: node.id,
          nodeType: node.type,
          hasInputs: !!inputs,
          inputType: inputs?.type || (Array.isArray(inputs) ? 'array' : 'none'),
          hasImage: !!base64Image,
          systemDescription: systemDescription.substring(0, 100) + "...",
          architectureComponents: architectureComponents.substring(0, 100) + "...",
        });

        const processedPrompt = PromptProcessor.processTemplate(
          template,
          variables
        );

        // Add image context if available
        const finalPrompt = base64Image
          ? PromptProcessor.addImageContext(
              processedPrompt.resolvedPrompt,
              true
            )
          : processedPrompt.resolvedPrompt;

        // Build system prompt
        const systemPrompt = PromptProcessor.buildSystemPrompt(
          node.type === "analysis-stride" ? "stride" : "stpa-sec"
        );

        try {
          // Call the actual model API
          console.log("Calling model API with:", {
            modelId: analysisConfig.modelId,
            promptLength: finalPrompt.length,
            hasImage: !!base64Image,
          });

          const modelResponse = await callModelAPI(
            analysisConfig.modelId,
            finalPrompt,
            systemPrompt,
            base64Image,
            analysisConfig.ollamaConfig
          );

          console.log("Model response received, extracting findings...");

          // Extract findings from the response
          const findings = FindingExtractor.extractFindings(
            modelResponse,
            node.type === "analysis-stride" ? "stride" : "stpa-sec",
            analysisConfig.modelId
          );

          console.log(`Extracted ${findings.length} findings`);

          // If no findings were extracted, create a basic finding from the response
          if (findings.length === 0) {
            console.log(
              "No structured findings extracted, creating basic finding"
            );
            findings.push({
              id: `finding_${Date.now()}_1`,
              title: "Security Analysis Results",
              description: modelResponse.substring(0, 500),
              severity: "medium",
              category:
                node.type === "analysis-stride"
                  ? "General"
                  : "General Analysis",
              modelSource: analysisConfig.modelId,
              createdAt: new Date().toISOString(),
            });
          }

          return {
            type: "findings",
            data: findings,
            rawResponse: modelResponse,
          };
        } catch (error) {
          console.error("Error calling model API:", error);

          // If API fails, pass through the full error message
          if (error instanceof Error) {
            throw error; // Pass through the original error with full details
          } else {
            throw new Error(`Analysis failed: ${String(error)}`);
          }
        }

      case "output-results":
        return inputs;

      default:
        throw new Error(
          `Unknown node type: ${(node as { type: string }).type}`
        );
    }
  };

  const runPipeline = useCallback(
    async ({
      nodes,
      connections,
    }: {
      nodes: PipelineNode[];
      connections: Connection[];
    }) => {
      const validation = validatePipeline(nodes, connections);

      if (!validation.isValid) {
        console.error("Pipeline validation failed:", validation.errors);
        setExecutionState((prev) => ({
          ...prev,
          status: "error",
          error: validation.errors[0].message,
        }));
        return;
      }

      const executionOrder = buildExecutionOrder(nodes, connections);
      const nodeResults = new Map<string, any>();
      const nodeStates = new Map<string, NodeExecutionState>();

      // Set all nodes to idle initially
      nodes.forEach((node) => {
        nodeStates.set(node.id, {
          nodeId: node.id,
          status: "idle",
        });
      });

      // Set nodes in execution order to waiting (except the first ones with no dependencies)
      const nodesWithDependencies = new Set<string>();
      connections.forEach((conn) => {
        nodesWithDependencies.add(conn.to.nodeId);
      });

      executionOrder.forEach((nodeId) => {
        if (nodesWithDependencies.has(nodeId)) {
          nodeStates.set(nodeId, {
            nodeId,
            status: "waiting",
          });
        }
      });

      setExecutionState({
        pipelineId: `pipeline_${Date.now()}`,
        status: "running",
        nodeStates,
        totalProgress: 0,
        startTime: Date.now(),
      });

      let currentIndex = 0; // Track the current index outside the loop for error handling
      
      try {
        for (let i = 0; i < executionOrder.length; i++) {
          currentIndex = i; // Update the current index
          const nodeId = executionOrder[i];
          const node = nodes.find((n) => n.id === nodeId);
          if (!node) continue;

          nodeStates.set(nodeId, {
            nodeId,
            status: "running",
            startTime: Date.now(),
          });

          setExecutionState((prev) => ({
            ...prev,
            nodeStates: new Map(nodeStates),
            currentNodeId: nodeId,
            totalProgress: ((i + 0.5) / executionOrder.length) * 100,
          }));

          const inputConnections = connections.filter(
            (c) => c.to.nodeId === nodeId
          );
          const inputs = inputConnections.map((conn) =>
            nodeResults.get(conn.from.nodeId)
          );
          const combinedInput = inputs.length === 1 ? inputs[0] : inputs;

          try {
            const result = await executeNode(node, combinedInput);
            nodeResults.set(nodeId, result);

            nodeStates.set(nodeId, {
              nodeId,
              status: "complete",
              duration: Date.now() - (nodeStates.get(nodeId)?.startTime || 0),
              results: result,
            });
          } catch (error) {
            // Set the failed node to error state with full error message
            let errorMessage = "Unknown error";
            if (error instanceof Error) {
              errorMessage = error.message;
            } else if (typeof error === 'string') {
              errorMessage = error;
            } else {
              errorMessage = String(error);
            }
            
            nodeStates.set(nodeId, {
              nodeId,
              status: "error",
              error: errorMessage,
              duration: Date.now() - (nodeStates.get(nodeId)?.startTime || 0),
            });
            
            // Update the execution state immediately to show the error in UI
            setExecutionState((prev) => ({
              ...prev,
              nodeStates: new Map(nodeStates),
              totalProgress: ((i + 1) / executionOrder.length) * 100,
            }));
            
            // Rethrow to trigger the outer catch block
            throw error;
          }

          setExecutionState((prev) => ({
            ...prev,
            nodeStates: new Map(nodeStates),
            totalProgress: ((i + 1) / executionOrder.length) * 100,
          }));
        }

        setExecutionState((prev) => ({
          ...prev,
          status: "complete",
          endTime: Date.now(),
          totalProgress: 100,
        }));
      } catch (error) {
        // Mark any remaining nodes that were waiting or idle as cancelled
        for (let j = currentIndex + 1; j < executionOrder.length; j++) {
          const remainingNodeId = executionOrder[j];
          const currentState = nodeStates.get(remainingNodeId);
          if (currentState && (currentState.status === "waiting" || currentState.status === "idle")) {
            nodeStates.set(remainingNodeId, {
              nodeId: remainingNodeId,
              status: "idle", // Reset to idle instead of leaving in waiting state
            });
          }
        }
        
        setExecutionState((prev) => ({
          ...prev,
          status: "error",
          nodeStates: new Map(nodeStates),
          error:
            error instanceof Error
              ? error.message
              : "Pipeline execution failed",
          endTime: Date.now(),
        }));
      }
    },
    []
  );

  const cancelExecution = useCallback(() => {
    setExecutionState((prev) => ({
      ...prev,
      status: "idle",
      totalProgress: 0,
    }));
  }, []);

  const getNodeExecutionState = useCallback(
    (nodeId: string): NodeExecutionState | undefined => {
      return executionState.nodeStates.get(nodeId);
    },
    [executionState]
  );

  return {
    executionState,
    runPipeline,
    cancelExecution,
    getNodeExecutionState,
  };
}
