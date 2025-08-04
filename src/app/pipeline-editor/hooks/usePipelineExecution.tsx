import { useState, useCallback } from "react";
import { PipelineNode, Connection } from "../types/pipeline";
import { PipelineExecutionState, NodeExecutionState, ValidationResult } from "../types/execution";
import { TemplateStorage } from "@/lib/storage/templateStorage";
import { PromptProcessor } from "@/lib/prompts/promptProcessor";
import { FindingExtractor } from "@/lib/analysis/findingExtractor";

export function usePipelineExecution() {
  const [executionState, setExecutionState] = useState<PipelineExecutionState>({
    pipelineId: '',
    status: 'idle',
    nodeStates: new Map(),
    totalProgress: 0
  });

  const validatePipeline = (nodes: PipelineNode[], connections: Connection[]): ValidationResult => {
    const errors = [];
    const warnings = [];

    if (nodes.length === 0) {
      errors.push({
        message: 'Pipeline is empty',
        type: 'missing_connection' as const
      });
    }

    const inputNodes = nodes.filter(n => n.type.startsWith('input-'));
    const analysisNodes = nodes.filter(n => n.type.startsWith('analysis-'));
    const outputNodes = nodes.filter(n => n.type.startsWith('output-'));

    if (inputNodes.length === 0) {
      errors.push({
        message: 'Pipeline needs at least one input node',
        type: 'missing_connection' as const
      });
    }

    if (analysisNodes.length === 0) {
      errors.push({
        message: 'Pipeline needs at least one analysis node',
        type: 'missing_connection' as const
      });
    }

    analysisNodes.forEach(node => {
      const hasInput = connections.some(c => c.to.nodeId === node.id);
      if (!hasInput) {
        errors.push({
          nodeId: node.id,
          message: `Analysis node "${node.id}" has no input connection`,
          type: 'missing_connection' as const
        });
      }
    });

    outputNodes.forEach(node => {
      const hasInput = connections.some(c => c.to.nodeId === node.id);
      if (!hasInput) {
        warnings.push({
          nodeId: node.id,
          message: `Output node "${node.id}" has no input connection`,
          type: 'unused_output' as const
        });
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  };

  const buildExecutionOrder = (nodes: PipelineNode[], connections: Connection[]): string[] => {
    const graph = new Map<string, string[]>();
    const inDegree = new Map<string, number>();

    nodes.forEach(node => {
      graph.set(node.id, []);
      inDegree.set(node.id, 0);
    });

    connections.forEach(conn => {
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
      neighbors.forEach(neighbor => {
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
        const result = (reader.result as string).split(",")[1];
        resolve(result);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const callModelAPI = async (
    modelId: string,
    prompt: string,
    systemPrompt: string,
    base64Image?: string
  ): Promise<string> => {
    const response = await fetch("http://localhost:8000/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model_id: modelId,
        prompt,
        images: base64Image ? [base64Image] : [],
        system_instructions: systemPrompt,
      }),
    });

    if (!response.ok) {
      throw new Error(`Model API call failed: ${response.statusText}`);
    }

    const json = await response.json();
    const parsed = JSON.parse(json.response);
    return parsed.content?.[0]?.text ?? "No response from model.";
  };

  const executeNode = async (node: PipelineNode, inputs: any): Promise<any> => {
    switch (node.type) {
      case 'input-diagram':
        const diagramConfig = (node as any).config;
        if (!diagramConfig.file) {
          throw new Error('No diagram file uploaded');
        }
        const diagramBase64 = await fileToBase64(diagramConfig.file);
        return { 
          type: 'diagram', 
          data: diagramConfig.file,
          base64: diagramBase64
        };

      case 'input-text':
        const textConfig = (node as any).config;
        if (!textConfig.systemName) {
          throw new Error('System name is required');
        }
        return {
          type: 'text',
          data: {
            systemName: textConfig.systemName,
            description: textConfig.description,
            context: textConfig.context
          }
        };

      case 'analysis-stride':
      case 'analysis-stpa-sec':
        const analysisConfig = (node as any).config;
        
        // Get the template
        const template = TemplateStorage.getTemplate(analysisConfig.promptTemplate);
        if (!template) {
          throw new Error(`Template ${analysisConfig.promptTemplate} not found`);
        }

        // Prepare inputs
        let systemDescription = '';
        let architectureComponents = '';
        let base64Image = '';
        
        // Handle different input types
        if (inputs) {
          if (Array.isArray(inputs)) {
            inputs.forEach(input => {
              if (input?.type === 'text') {
                systemDescription = `System Name: ${input.data.systemName}\nDescription: ${input.data.description}\nContext: ${input.data.context}`;
                architectureComponents = input.data.description;
              }
              if (input?.type === 'diagram') {
                base64Image = input.base64;
                architectureComponents += '\n[Architecture diagram provided]';
              }
            });
          } else {
            if (inputs.type === 'text') {
              systemDescription = `System Name: ${inputs.data.systemName}\nDescription: ${inputs.data.description}\nContext: ${inputs.data.context}`;
              architectureComponents = inputs.data.description;
            }
            if (inputs.type === 'diagram') {
              base64Image = inputs.base64;
              architectureComponents = '[Architecture diagram provided]';
            }
          }
        }

        if (!systemDescription && !base64Image) {
          throw new Error('No input data available for analysis');
        }

        // Process the template with variables
        const variables: Record<string, string> = {
          systemDescription,
          architectureComponents,
          controlStructure: architectureComponents, // For STPA-SEC
          systemName: systemDescription.split('\n')[0]?.replace('System Name: ', '') || 'System',
          components: architectureComponents,
          dataFlows: 'Data flows as shown in the architecture'
        };

        const processedPrompt = PromptProcessor.processTemplate(template, variables);
        
        // Add image context if available
        const finalPrompt = base64Image 
          ? PromptProcessor.addImageContext(processedPrompt.resolvedPrompt, true)
          : processedPrompt.resolvedPrompt;

        // Build system prompt
        const systemPrompt = PromptProcessor.buildSystemPrompt(node.type === 'analysis-stride' ? 'stride' : 'stpa-sec');

        try {
          // Call the actual model API
          console.log('Calling model API with:', {
            modelId: analysisConfig.modelId,
            promptLength: finalPrompt.length,
            hasImage: !!base64Image
          });

          const modelResponse = await callModelAPI(
            analysisConfig.modelId,
            finalPrompt,
            systemPrompt,
            base64Image
          );

          console.log('Model response received, extracting findings...');

          // Extract findings from the response
          const findings = FindingExtractor.extractFindings(
            modelResponse,
            node.type === 'analysis-stride' ? 'stride' : 'stpa-sec',
            analysisConfig.modelId
          );

          console.log(`Extracted ${findings.length} findings`);

          // If no findings were extracted, create a basic finding from the response
          if (findings.length === 0) {
            console.log('No structured findings extracted, creating basic finding');
            findings.push({
              id: `finding_${Date.now()}_1`,
              title: 'Security Analysis Results',
              description: modelResponse.substring(0, 500),
              severity: 'medium',
              category: node.type === 'analysis-stride' ? 'General' : 'General Analysis',
              modelSource: analysisConfig.modelId,
              createdAt: new Date().toISOString()
            });
          }

          return {
            type: 'findings',
            data: findings,
            rawResponse: modelResponse
          };
        } catch (error) {
          console.error('Error calling model API:', error);
          
          // If API fails, throw error to be caught by execution engine
          throw new Error(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

      case 'output-results':
        return inputs;

      default:
        throw new Error(`Unknown node type: ${node.type}`);
    }
  };

  const runPipeline = useCallback(async ({ nodes, connections }: { nodes: PipelineNode[], connections: Connection[] }) => {
    const validation = validatePipeline(nodes, connections);
    
    if (!validation.isValid) {
      console.error('Pipeline validation failed:', validation.errors);
      setExecutionState(prev => ({
        ...prev,
        status: 'error',
        error: validation.errors[0].message
      }));
      return;
    }

    const executionOrder = buildExecutionOrder(nodes, connections);
    const nodeResults = new Map<string, any>();
    const nodeStates = new Map<string, NodeExecutionState>();

    nodes.forEach(node => {
      nodeStates.set(node.id, {
        nodeId: node.id,
        status: 'idle'
      });
    });

    setExecutionState({
      pipelineId: `pipeline_${Date.now()}`,
      status: 'running',
      nodeStates,
      totalProgress: 0,
      startTime: Date.now()
    });

    try {
      for (let i = 0; i < executionOrder.length; i++) {
        const nodeId = executionOrder[i];
        const node = nodes.find(n => n.id === nodeId);
        if (!node) continue;

        nodeStates.set(nodeId, {
          nodeId,
          status: 'running',
          startTime: Date.now()
        });

        setExecutionState(prev => ({
          ...prev,
          nodeStates: new Map(nodeStates),
          currentNodeId: nodeId,
          totalProgress: ((i + 0.5) / executionOrder.length) * 100
        }));

        const inputConnections = connections.filter(c => c.to.nodeId === nodeId);
        const inputs = inputConnections.map(conn => nodeResults.get(conn.from.nodeId));
        const combinedInput = inputs.length === 1 ? inputs[0] : inputs;

        try {
          const result = await executeNode(node, combinedInput);
          nodeResults.set(nodeId, result);

          nodeStates.set(nodeId, {
            nodeId,
            status: 'complete',
            duration: Date.now() - (nodeStates.get(nodeId)?.startTime || 0),
            results: result
          });
        } catch (error) {
          nodeStates.set(nodeId, {
            nodeId,
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
            duration: Date.now() - (nodeStates.get(nodeId)?.startTime || 0)
          });
          throw error;
        }

        setExecutionState(prev => ({
          ...prev,
          nodeStates: new Map(nodeStates),
          totalProgress: ((i + 1) / executionOrder.length) * 100
        }));
      }

      setExecutionState(prev => ({
        ...prev,
        status: 'complete',
        endTime: Date.now(),
        totalProgress: 100
      }));
    } catch (error) {
      setExecutionState(prev => ({
        ...prev,
        status: 'error',
        error: error instanceof Error ? error.message : 'Pipeline execution failed',
        endTime: Date.now()
      }));
    }
  }, []);

  const cancelExecution = useCallback(() => {
    setExecutionState(prev => ({
      ...prev,
      status: 'idle',
      totalProgress: 0
    }));
  }, []);

  const getNodeExecutionState = useCallback((nodeId: string): NodeExecutionState | undefined => {
    return executionState.nodeStates.get(nodeId);
  }, [executionState]);

  return {
    executionState,
    runPipeline,
    cancelExecution,
    getNodeExecutionState
  };
}