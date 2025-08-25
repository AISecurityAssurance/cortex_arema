import { PipelineNode, Connection } from '../types/pipeline';
import { PipelineExecutionState, NodeExecutionState } from '../types/execution';
import { NodeResult, Finding } from '../types/results';

interface Pipeline {
  id: string;
  name: string;
  nodes: PipelineNode[];
  connections: Connection[];
  createdAt: string;
  updatedAt: string;
}

interface ReportMetadata {
  name: string;
  description?: string;
  tags?: string[];
  generatedAt: string;
  analyst?: string;
}

interface ReportData {
  metadata: ReportMetadata;
  pipeline: Pipeline;
  executionState: PipelineExecutionState;
  canvasImage?: string; // Base64 encoded pipeline visualization
}

export class ReportGenerator {
  static generateHTML(data: ReportData): string {
    const { metadata, pipeline, executionState, canvasImage } = data;
    
    // Calculate summary statistics
    const stats = this.calculateStatistics(executionState);
    
    // Generate the HTML report
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${metadata.name} - Pipeline Execution Report</title>
    <style>
        ${this.getStyles()}
    </style>
</head>
<body>
    <div class="container">
        ${this.generateHeader(metadata)}
        ${this.generateSummary(stats, executionState)}
        ${canvasImage ? this.generatePipelineVisualization(canvasImage) : ''}
        ${this.generateExecutionDetails(pipeline, executionState)}
        ${this.generateFindingsByNode(pipeline, executionState)}
        ${this.generateRawData(pipeline, executionState)}
    </div>
    <script>
        ${this.getScripts()}
    </script>
</body>
</html>`;
  }

  private static getStyles(): string {
    return `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        background: #f5f5f5;
      }
      
      .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
        background: white;
        min-height: 100vh;
      }
      
      h1 {
        color: #2c3e50;
        border-bottom: 3px solid #3498db;
        padding-bottom: 10px;
        margin-bottom: 30px;
      }
      
      h2 {
        color: #34495e;
        margin-top: 40px;
        margin-bottom: 20px;
        padding-bottom: 8px;
        border-bottom: 2px solid #ecf0f1;
      }
      
      h3 {
        color: #34495e;
        margin-top: 25px;
        margin-bottom: 15px;
      }
      
      .header {
        margin-bottom: 40px;
      }
      
      .metadata {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 15px;
        margin-bottom: 20px;
      }
      
      .metadata-item {
        background: #f8f9fa;
        padding: 10px 15px;
        border-radius: 5px;
      }
      
      .metadata-label {
        font-size: 12px;
        color: #6c757d;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .metadata-value {
        font-size: 16px;
        color: #2c3e50;
        margin-top: 4px;
        font-weight: 500;
      }
      
      .summary-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 20px;
        margin-bottom: 30px;
      }
      
      .summary-card {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      }
      
      .summary-card.success {
        background: linear-gradient(135deg, #52c41a 0%, #73d13d 100%);
      }
      
      .summary-card.error {
        background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
      }
      
      .summary-card.warning {
        background: linear-gradient(135deg, #faad14 0%, #ffc53d 100%);
      }
      
      .summary-value {
        font-size: 32px;
        font-weight: bold;
        margin-bottom: 5px;
      }
      
      .summary-label {
        font-size: 14px;
        opacity: 0.9;
      }
      
      .pipeline-visualization {
        background: #f8f9fa;
        padding: 20px;
        border-radius: 10px;
        margin-bottom: 30px;
        text-align: center;
      }
      
      .pipeline-image {
        max-width: 100%;
        height: auto;
        border-radius: 5px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }
      
      .node-section {
        background: #ffffff;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        margin-bottom: 20px;
        overflow: hidden;
      }
      
      .node-header {
        background: #f8f9fa;
        padding: 15px 20px;
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
        transition: background 0.3s;
      }
      
      .node-header:hover {
        background: #e9ecef;
      }
      
      .node-title {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      
      .node-type {
        background: #3498db;
        color: white;
        padding: 2px 8px;
        border-radius: 3px;
        font-size: 12px;
        text-transform: uppercase;
      }
      
      .node-status {
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 500;
        text-transform: uppercase;
      }
      
      .status-complete {
        background: #d4edda;
        color: #155724;
      }
      
      .status-error {
        background: #f8d7da;
        color: #721c24;
      }
      
      .status-running {
        background: #cce5ff;
        color: #004085;
      }
      
      .node-content {
        padding: 20px;
        display: none;
      }
      
      .node-content.expanded {
        display: block;
      }
      
      .finding {
        background: #f8f9fa;
        border-left: 4px solid #3498db;
        padding: 15px;
        margin-bottom: 15px;
        border-radius: 4px;
      }
      
      .finding.high {
        border-left-color: #e74c3c;
        background: #fff5f5;
      }
      
      .finding.medium {
        border-left-color: #f39c12;
        background: #fffbf0;
      }
      
      .finding.low {
        border-left-color: #27ae60;
        background: #f6ffed;
      }
      
      .finding-header {
        display: flex;
        justify-content: space-between;
        align-items: start;
        margin-bottom: 10px;
      }
      
      .finding-title {
        font-weight: 600;
        color: #2c3e50;
        margin-bottom: 5px;
      }
      
      .severity-badge {
        padding: 3px 10px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
      }
      
      .severity-high {
        background: #e74c3c;
        color: white;
      }
      
      .severity-medium {
        background: #f39c12;
        color: white;
      }
      
      .severity-low {
        background: #27ae60;
        color: white;
      }
      
      .finding-description {
        color: #555;
        margin-bottom: 10px;
        line-height: 1.6;
      }
      
      .finding-metadata {
        display: flex;
        gap: 15px;
        font-size: 12px;
        color: #6c757d;
      }
      
      .collapsible {
        background: #f8f9fa;
        border: 1px solid #dee2e6;
        border-radius: 5px;
        margin-top: 20px;
      }
      
      .collapsible-header {
        padding: 12px 15px;
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: #e9ecef;
        border-radius: 5px 5px 0 0;
        transition: background 0.3s;
      }
      
      .collapsible-header:hover {
        background: #dee2e6;
      }
      
      .collapsible-content {
        padding: 15px;
        display: none;
        max-height: 500px;
        overflow-y: auto;
      }
      
      .collapsible-content.expanded {
        display: block;
      }
      
      .code-block {
        background: #2d2d2d;
        color: #f8f8f2;
        padding: 15px;
        border-radius: 5px;
        overflow-x: auto;
        font-family: 'Courier New', monospace;
        font-size: 13px;
        line-height: 1.5;
        white-space: pre-wrap;
        word-wrap: break-word;
      }
      
      .execution-timeline {
        position: relative;
        padding-left: 30px;
        margin: 20px 0;
      }
      
      .timeline-item {
        position: relative;
        padding-bottom: 20px;
      }
      
      .timeline-item::before {
        content: '';
        position: absolute;
        left: -21px;
        top: 5px;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: #3498db;
        border: 2px solid white;
        box-shadow: 0 0 0 1px #3498db;
      }
      
      .timeline-item::after {
        content: '';
        position: absolute;
        left: -15px;
        top: 17px;
        bottom: -20px;
        width: 1px;
        background: #dee2e6;
      }
      
      .timeline-item:last-child::after {
        display: none;
      }
      
      .tag {
        display: inline-block;
        background: #e9ecef;
        color: #495057;
        padding: 2px 8px;
        border-radius: 3px;
        font-size: 12px;
        margin-right: 5px;
      }
      
      .chevron {
        transition: transform 0.3s;
      }
      
      .chevron.expanded {
        transform: rotate(90deg);
      }
      
      @media print {
        .collapsible-content {
          display: block !important;
        }
        .node-content {
          display: block !important;
        }
      }
    `;
  }

  private static getScripts(): string {
    return `
      document.addEventListener('DOMContentLoaded', function() {
        // Toggle collapsible sections
        document.querySelectorAll('.collapsible-header').forEach(header => {
          header.addEventListener('click', function() {
            const content = this.nextElementSibling;
            const chevron = this.querySelector('.chevron');
            content.classList.toggle('expanded');
            if (chevron) {
              chevron.classList.toggle('expanded');
            }
          });
        });
        
        // Toggle node sections
        document.querySelectorAll('.node-header').forEach(header => {
          header.addEventListener('click', function() {
            const content = this.nextElementSibling;
            const chevron = this.querySelector('.chevron');
            content.classList.toggle('expanded');
            if (chevron) {
              chevron.classList.toggle('expanded');
            }
          });
        });
      });
    `;
  }

  private static generateHeader(metadata: ReportMetadata): string {
    const tags = metadata.tags?.map(tag => `<span class="tag">${tag}</span>`).join('') || '';
    
    return `
      <div class="header">
        <h1>${metadata.name}</h1>
        ${metadata.description ? `<p style="color: #6c757d; margin-bottom: 20px;">${metadata.description}</p>` : ''}
        ${tags ? `<div style="margin-bottom: 20px;">${tags}</div>` : ''}
        <div class="metadata">
          <div class="metadata-item">
            <div class="metadata-label">Generated At</div>
            <div class="metadata-value">${new Date(metadata.generatedAt).toLocaleString()}</div>
          </div>
          ${metadata.analyst ? `
          <div class="metadata-item">
            <div class="metadata-label">Analyst</div>
            <div class="metadata-value">${metadata.analyst}</div>
          </div>` : ''}
        </div>
      </div>
    `;
  }

  private static calculateStatistics(executionState: PipelineExecutionState): any {
    let totalFindings = 0;
    let highSeverity = 0;
    let mediumSeverity = 0;
    let lowSeverity = 0;
    let successfulNodes = 0;
    let failedNodes = 0;
    
    executionState.nodeStates.forEach((nodeState) => {
      if (nodeState.status === 'complete') {
        successfulNodes++;
        if (nodeState.results && nodeState.results.type === 'findings') {
          const findings = nodeState.results.data;
          totalFindings += findings.length;
          findings.forEach((finding: Finding) => {
            if (finding.severity === 'high') highSeverity++;
            else if (finding.severity === 'medium') mediumSeverity++;
            else if (finding.severity === 'low') lowSeverity++;
          });
        }
      } else if (nodeState.status === 'error') {
        failedNodes++;
      }
    });
    
    const duration = executionState.endTime && executionState.startTime 
      ? (executionState.endTime - executionState.startTime) / 1000 
      : 0;
    
    return {
      totalFindings,
      highSeverity,
      mediumSeverity,
      lowSeverity,
      successfulNodes,
      failedNodes,
      totalNodes: executionState.nodeStates.size,
      duration
    };
  }

  private static generateSummary(stats: any, executionState: PipelineExecutionState): string {
    return `
      <h2>Executive Summary</h2>
      <div class="summary-grid">
        <div class="summary-card ${executionState.status === 'complete' ? 'success' : executionState.status === 'error' ? 'error' : ''}">
          <div class="summary-value">${executionState.status === 'complete' ? '✓' : executionState.status === 'error' ? '✗' : '⟳'}</div>
          <div class="summary-label">Pipeline Status</div>
        </div>
        <div class="summary-card">
          <div class="summary-value">${stats.totalFindings}</div>
          <div class="summary-label">Total Findings</div>
        </div>
        <div class="summary-card error">
          <div class="summary-value">${stats.highSeverity}</div>
          <div class="summary-label">High Severity</div>
        </div>
        <div class="summary-card warning">
          <div class="summary-value">${stats.mediumSeverity}</div>
          <div class="summary-label">Medium Severity</div>
        </div>
        <div class="summary-card success">
          <div class="summary-value">${stats.lowSeverity}</div>
          <div class="summary-label">Low Severity</div>
        </div>
        <div class="summary-card">
          <div class="summary-value">${stats.duration.toFixed(1)}s</div>
          <div class="summary-label">Execution Time</div>
        </div>
      </div>
    `;
  }

  private static generatePipelineVisualization(canvasImage: string): string {
    return `
      <h2>Pipeline Structure</h2>
      <div class="pipeline-visualization">
        <img src="${canvasImage}" alt="Pipeline Visualization" class="pipeline-image" />
      </div>
    `;
  }

  private static generateExecutionDetails(pipeline: Pipeline, executionState: PipelineExecutionState): string {
    const nodes = pipeline.nodes.map(node => {
      const nodeState = executionState.nodeStates.get(node.id);
      return `
        <div class="timeline-item">
          <strong>${node.id}</strong> (${node.type})
          <br />
          <span style="color: #6c757d; font-size: 14px;">
            Status: ${nodeState?.status || 'pending'}
            ${nodeState?.duration ? ` • Duration: ${(nodeState.duration / 1000).toFixed(2)}s` : ''}
            ${nodeState?.error ? ` • Error: ${nodeState.error}` : ''}
          </span>
        </div>
      `;
    }).join('');
    
    return `
      <h2>Execution Details</h2>
      <div class="execution-timeline">
        ${nodes}
      </div>
    `;
  }

  private static generateFindingsByNode(pipeline: Pipeline, executionState: PipelineExecutionState): string {
    const analysisNodes = pipeline.nodes.filter(node => 
      node.type.startsWith('analysis-') || node.type === 'output-results'
    );
    
    const sections = analysisNodes.map(node => {
      const nodeState = executionState.nodeStates.get(node.id);
      if (!nodeState || !nodeState.results) return '';
      
      if (nodeState.results.type !== 'findings') return '';
      
      const findings = nodeState.results.data;
      if (findings.length === 0) return '';
      
      const findingsHTML = findings.map((finding: Finding) => `
        <div class="finding ${finding.severity}">
          <div class="finding-header">
            <div>
              <div class="finding-title">${finding.title}</div>
              ${finding.category ? `<span style="color: #6c757d; font-size: 12px;">${finding.category}</span>` : ''}
            </div>
            <span class="severity-badge severity-${finding.severity}">${finding.severity}</span>
          </div>
          <div class="finding-description">${finding.description}</div>
          ${finding.impact ? `<div style="margin-top: 10px;"><strong>Impact:</strong> ${finding.impact}</div>` : ''}
          ${finding.mitigations && finding.mitigations.length > 0 ? `
            <div style="margin-top: 10px;">
              <strong>Mitigations:</strong>
              <ul style="margin-top: 5px; margin-left: 20px;">
                ${finding.mitigations.map(m => `<li>${m}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
          <div class="finding-metadata">
            ${finding.confidence ? `<span>Confidence: ${finding.confidence}%</span>` : ''}
            ${finding.cweId ? `<span>CWE: ${finding.cweId}</span>` : ''}
            ${nodeState.results.modelId ? `<span>Model: ${nodeState.results.modelId}</span>` : ''}
          </div>
        </div>
      `).join('');
      
      return `
        <div class="node-section">
          <div class="node-header">
            <div class="node-title">
              <span class="node-type">${node.type}</span>
              <span>${node.id}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
              <span class="node-status status-${nodeState.status}">${nodeState.status}</span>
              <span class="chevron">▶</span>
            </div>
          </div>
          <div class="node-content">
            ${findingsHTML}
          </div>
        </div>
      `;
    }).filter(section => section !== '').join('');
    
    return sections ? `
      <h2>Security Findings by Analysis Node</h2>
      ${sections}
    ` : '';
  }

  private static generateRawData(pipeline: Pipeline, executionState: PipelineExecutionState): string {
    const sections: string[] = [];
    
    pipeline.nodes.forEach(node => {
      const nodeState = executionState.nodeStates.get(node.id);
      if (!nodeState || !nodeState.results) return;
      
      // Add raw model response if available
      if (nodeState.results.type === 'findings' && nodeState.results.rawResponse) {
        sections.push(`
          <div class="collapsible">
            <div class="collapsible-header">
              <span>Raw Response: ${node.id} (${node.type})</span>
              <span class="chevron">▶</span>
            </div>
            <div class="collapsible-content">
              <div class="code-block">${this.escapeHtml(nodeState.results.rawResponse)}</div>
            </div>
          </div>
        `);
      }
      
      // Add input data if available
      if (nodeState.results.type === 'text') {
        sections.push(`
          <div class="collapsible">
            <div class="collapsible-header">
              <span>Text Input: ${node.id}</span>
              <span class="chevron">▶</span>
            </div>
            <div class="collapsible-content">
              <div class="code-block">${JSON.stringify(nodeState.results.data, null, 2)}</div>
            </div>
          </div>
        `);
      }
      
      // Add node configuration
      if ('config' in node) {
        const config = { ...node.config };
        // Remove sensitive or large data
        if ('file' in config) delete config.file;
        if ('ollamaConfig' in config) delete config.ollamaConfig;
        
        sections.push(`
          <div class="collapsible">
            <div class="collapsible-header">
              <span>Configuration: ${node.id}</span>
              <span class="chevron">▶</span>
            </div>
            <div class="collapsible-content">
              <div class="code-block">${JSON.stringify(config, null, 2)}</div>
            </div>
          </div>
        `);
      }
    });
    
    // Add pipeline metadata
    sections.push(`
      <div class="collapsible">
        <div class="collapsible-header">
          <span>Pipeline Metadata</span>
          <span class="chevron">▶</span>
        </div>
        <div class="collapsible-content">
          <div class="code-block">${JSON.stringify({
            id: pipeline.id,
            name: pipeline.name,
            createdAt: pipeline.createdAt,
            updatedAt: pipeline.updatedAt,
            totalNodes: pipeline.nodes.length,
            totalConnections: pipeline.connections.length
          }, null, 2)}</div>
        </div>
      </div>
    `);
    
    return sections.length > 0 ? `
      <h2>Raw Data & Configuration</h2>
      ${sections.join('')}
    ` : '';
  }

  private static escapeHtml(text: string): string {
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }
}