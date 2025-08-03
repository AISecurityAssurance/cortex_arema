import { PromptTemplate, ProcessedPrompt } from '@/types';

export class PromptProcessor {
  /**
   * Process a template with variables to create final prompt
   */
  static processTemplate(
    template: PromptTemplate,
    variables: Record<string, string>
  ): ProcessedPrompt {
    let resolvedPrompt = template.template;
    
    // Replace all variables in template
    template.variables.forEach(varName => {
      const value = variables[varName] || `[${varName}]`;
      const regex = new RegExp(`{{\\s*${varName}\\s*}}`, 'g');
      resolvedPrompt = resolvedPrompt.replace(regex, value);
    });
    
    // Add output format instructions if structured
    if (template.expectedOutputFormat === 'structured') {
      resolvedPrompt += this.getStructuredOutputInstructions(template.analysisType);
    }
    
    // Estimate expected findings based on template type
    const expectedFindings = this.estimateExpectedFindings(template.analysisType);
    
    return {
      template,
      resolvedPrompt,
      expectedFindings,
      validationCriteria: template.validationCriteria || []
    };
  }

  /**
   * Get structured output instructions
   */
  private static getStructuredOutputInstructions(analysisType: string): string {
    return `

Please provide your findings in the following structured format:

For each security finding:
1. **Title**: A clear, concise title for the vulnerability
2. **Severity**: High, Medium, or Low
3. **Category**: The relevant category (e.g., for STRIDE: Spoofing, Tampering, etc.)
4. **Description**: Detailed explanation of the vulnerability
5. **Attack Scenario**: How an attacker could exploit this
6. **Mitigations**: Specific steps to address the vulnerability
7. **CWE ID**: If applicable
8. **Confidence**: Your confidence level (0-100%)

Format each finding clearly with these sections labeled.`;
  }

  /**
   * Estimate expected number of findings
   */
  private static estimateExpectedFindings(analysisType: string): number {
    switch (analysisType) {
      case 'stride':
        return 6; // One per STRIDE category minimum
      case 'stpa-sec':
        return 8; // Various control and feedback issues
      case 'custom':
      default:
        return 5; // General estimate
    }
  }

  /**
   * Build system prompt for security analysis
   */
  static buildSystemPrompt(analysisType: string): string {
    const basePrompt = `You are an expert security analyst specializing in ${
      analysisType === 'stride' ? 'STRIDE threat modeling' :
      analysisType === 'stpa-sec' ? 'STPA-SEC system analysis' :
      'comprehensive security assessment'
    }.

Your analysis should be:
- Specific and actionable
- Based on industry best practices
- Technically accurate
- Risk-focused

Always provide concrete examples and specific technical details.
Reference relevant CWE IDs where applicable.
Consider both technical and business impact.`;

    return basePrompt;
  }

  /**
   * Validate that all required variables are provided
   */
  static validateVariables(
    template: PromptTemplate,
    variables: Record<string, string>
  ): { valid: boolean; missing: string[] } {
    const missing = template.variables.filter(v => !variables[v] || variables[v].trim() === '');
    return {
      valid: missing.length === 0,
      missing
    };
  }

  /**
   * Extract variables from user input if using natural language
   */
  static extractVariablesFromInput(
    input: string,
    template: PromptTemplate
  ): Record<string, string> {
    const variables: Record<string, string> = {};
    
    // Simple extraction based on common patterns
    template.variables.forEach(varName => {
      switch (varName) {
        case 'systemDescription':
          variables[varName] = input; // Use full input as system description
          break;
        case 'architectureComponents':
          // Try to extract components mentioned
          const componentMatch = input.match(/components?[:\s]+([^.]+)/i);
          variables[varName] = componentMatch ? componentMatch[1] : 'Not specified';
          break;
        case 'applicationType':
          const appTypeMatch = input.match(/(web|mobile|desktop|api|microservice)/i);
          variables[varName] = appTypeMatch ? appTypeMatch[1] : 'Web application';
          break;
        case 'techStack':
          const techMatch = input.match(/(react|angular|vue|node|python|java|\.net)/gi);
          variables[varName] = techMatch ? techMatch.join(', ') : 'Not specified';
          break;
        default:
          variables[varName] = 'Not specified';
      }
    });
    
    return variables;
  }

  /**
   * Combine prompt with image context
   */
  static addImageContext(prompt: string, hasImage: boolean): string {
    if (!hasImage) return prompt;
    
    return `${prompt}

Additionally, please analyze the provided architecture diagram image and incorporate any security concerns visible in the diagram into your analysis. Pay special attention to:
- Data flows between components
- Trust boundaries
- External interfaces
- Authentication/authorization points
- Potential attack surfaces`;
  }
}