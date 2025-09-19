/**
 * Mermaid-based Attack Tree Generator
 * Following the stride_gpt approach for generating and rendering attack trees
 */

import { AttackTreeGenerationParams } from '@/types/attackTree';

/**
 * Convert JSON tree structure to Mermaid syntax
 */
export function convertTreeToMermaid(treeData: any): string {
  const mermaidLines = ["graph TD"];

  function processNode(node: any, parentId?: string) {
    const nodeId = node.id;
    let nodeLabel = node.label;

    // Add quotes if label contains spaces or parentheses
    if (nodeLabel.includes(" ") || nodeLabel.includes("(") || nodeLabel.includes(")")) {
      nodeLabel = `"${nodeLabel}"`;
    }

    // Add the node definition
    mermaidLines.push(`    ${nodeId}[${nodeLabel}]`);

    // Add connection to parent if exists
    if (parentId) {
      mermaidLines.push(`    ${parentId} --> ${nodeId}`);
    }

    // Process children
    if (node.children && Array.isArray(node.children)) {
      for (const child of node.children) {
        processNode(child, nodeId);
      }
    }
  }

  // Process the root node(s)
  if (treeData.nodes && Array.isArray(treeData.nodes)) {
    for (const rootNode of treeData.nodes) {
      processNode(rootNode);
    }
  } else if (treeData.id) {
    // Direct node structure
    processNode(treeData);
  }

  return mermaidLines.join("\n");
}

/**
 * Create JSON structure prompt for AI models
 */
export function createJsonStructurePrompt(): string {
  return `Your task is to analyze the application and create an attack tree structure in JSON format.

The JSON structure should follow this format:
{
    "nodes": [
        {
            "id": "root",
            "label": "Compromise Application",
            "children": [
                {
                    "id": "auth",
                    "label": "Gain Unauthorized Access",
                    "children": [
                        {
                            "id": "auth1",
                            "label": "Exploit OAuth2 Vulnerabilities"
                        }
                    ]
                }
            ]
        }
    ]
}

Rules:
- Use simple IDs (root, auth, auth1, data, etc.)
- Make labels clear and descriptive
- Include all attack paths and sub-paths
- Maintain proper parent-child relationships
- Ensure the JSON is properly formatted

ONLY RESPOND WITH THE JSON STRUCTURE, NO ADDITIONAL TEXT.`;
}

/**
 * Clean JSON response from model output
 */
export function cleanJsonResponse(responseText: string): string {
  // Remove markdown JSON code block if present
  const jsonPattern = /```json\s*([\s\S]*?)\s*```/;
  let match = responseText.match(jsonPattern);
  if (match) {
    return match[1].trim();
  }

  // If no JSON code block, try to find content between any code blocks
  const codePattern = /```\s*([\s\S]*?)\s*```/;
  match = responseText.match(codePattern);
  if (match) {
    return match[1].trim();
  }

  // If no code blocks, return the original text
  return responseText.trim();
}

/**
 * Extract Mermaid code from response
 */
export function extractMermaidCode(response: string): string {
  // Try to find Mermaid code block
  const mermaidPattern = /```(?:mermaid|mmd)\s*([\s\S]*?)\s*```/;
  let match = response.match(mermaidPattern);
  if (match) {
    return match[1].trim();
  }

  // Try to find graph definition
  const graphPattern = /graph\s+(?:TD|LR|TB|RL|BT)[\s\S]*?(?=```|$)/;
  match = response.match(graphPattern);
  if (match) {
    return match[0].trim();
  }

  // Fallback to generic code block
  const codePattern = /```\s*([\s\S]*?)\s*```/;
  match = response.match(codePattern);
  if (match && match[1].includes("graph")) {
    return match[1].trim();
  }

  // Create a fallback Mermaid diagram
  return `graph TD
    A[Error Generating Attack Tree] --> B[Invalid Response Format]
    A --> C[Please Try Again]`;
}

/**
 * Create attack tree prompt
 */
export function createAttackTreePrompt(params: AttackTreeGenerationParams): string {
  return `APPLICATION TYPE: ${params.appType || 'web application'}
AUTHENTICATION METHODS: ${params.authentication?.join(', ') || 'none specified'}
INTERNET FACING: ${params.internetFacing ? 'Yes' : 'No'}
SENSITIVE DATA: ${params.sensitiveData ? 'Yes' : 'No'}
APPLICATION DESCRIPTION: ${params.systemDescription}

${params.customPrompt || ''}`;
}

/**
 * Process attack tree response from model
 */
export function processAttackTreeResponse(response: string): string {
  try {
    // First try to parse as JSON and convert to Mermaid
    const cleaned = cleanJsonResponse(response);
    const treeData = JSON.parse(cleaned);
    return convertTreeToMermaid(treeData);
  } catch (jsonError) {
    // Fallback: try to extract Mermaid code directly
    return extractMermaidCode(response);
  }
}