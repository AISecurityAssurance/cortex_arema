import { PromptTemplate } from '@/types';

const TEMPLATE_STORAGE_KEY = 'cortex_security_templates';

const DEFAULT_TEMPLATES: PromptTemplate[] = [
  {
    id: 'stride-default',
    name: 'STRIDE Analysis',
    description: 'Analyze security threats using the STRIDE methodology',
    template: `Analyze the following system architecture for security vulnerabilities using the STRIDE methodology:

- Spoofing: Can an attacker pretend to be someone/something else?
- Tampering: Can an attacker modify data or code?
- Repudiation: Can an attacker deny their actions?
- Information Disclosure: Can an attacker access unauthorized information?
- Denial of Service: Can an attacker prevent legitimate use?
- Elevation of Privilege: Can an attacker gain unauthorized permissions?

System Description:
{{systemDescription}}

Architecture Components:
{{architectureComponents}}

Please provide:
1. Specific vulnerabilities for each STRIDE category
2. Risk severity (High/Medium/Low)
3. Concrete attack scenarios
4. Recommended mitigations
5. CWE IDs where applicable`,
    variables: ['systemDescription', 'architectureComponents'],
    analysisType: 'stride',
    expectedOutputFormat: 'structured',
    version: '1.0',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'stpa-sec-default',
    name: 'STPA-SEC Analysis',
    description: 'System-Theoretic Process Analysis for Security',
    template: `Perform a STPA-SEC (System-Theoretic Process Analysis for Security) on the following system:

System Description:
{{systemDescription}}

Control Structure:
{{controlStructure}}

Please identify:
1. Unsafe control actions that could lead to security losses
2. Scenarios where safe control actions are not followed
3. Missing or inadequate feedback
4. Component failures or compromises
5. Unsafe interactions between components

For each identified issue:
- Describe the security loss scenario
- Assess the impact severity
- Provide specific constraints to prevent the loss
- Suggest implementation mechanisms`,
    variables: ['systemDescription', 'controlStructure'],
    analysisType: 'stpa-sec',
    expectedOutputFormat: 'structured',
    version: '1.0',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'owasp-top10-default',
    name: 'OWASP Top 10 Analysis',
    description: 'Analyze for OWASP Top 10 vulnerabilities',
    template: `Analyze the following application for OWASP Top 10 vulnerabilities:

Application Type: {{applicationType}}
Technology Stack: {{techStack}}
Authentication Method: {{authMethod}}

Please check for:
1. Broken Access Control
2. Cryptographic Failures
3. Injection
4. Insecure Design
5. Security Misconfiguration
6. Vulnerable and Outdated Components
7. Identification and Authentication Failures
8. Software and Data Integrity Failures
9. Security Logging and Monitoring Failures
10. Server-Side Request Forgery

For each finding provide:
- Specific vulnerability description
- Attack scenario
- Impact assessment
- Remediation steps
- Testing approach`,
    variables: ['applicationType', 'techStack', 'authMethod'],
    analysisType: 'custom',
    expectedOutputFormat: 'structured',
    version: '1.0',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export class TemplateStorage {
  static getAllTemplates(): PromptTemplate[] {
    if (typeof window === 'undefined') return DEFAULT_TEMPLATES;
    
    const stored = localStorage.getItem(TEMPLATE_STORAGE_KEY);
    if (!stored) {
      // Initialize with default templates
      localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(DEFAULT_TEMPLATES));
      return DEFAULT_TEMPLATES;
    }
    
    try {
      return JSON.parse(stored);
    } catch (error) {
      console.error('Error parsing templates:', error);
      return DEFAULT_TEMPLATES;
    }
  }

  static getTemplate(id: string): PromptTemplate | null {
    const templates = this.getAllTemplates();
    return templates.find(t => t.id === id) || null;
  }

  static saveTemplate(template: PromptTemplate): void {
    if (typeof window === 'undefined') return;
    
    const templates = this.getAllTemplates();
    const existingIndex = templates.findIndex(t => t.id === template.id);
    
    const updatedTemplate = {
      ...template,
      updatedAt: new Date().toISOString()
    };
    
    if (existingIndex >= 0) {
      templates[existingIndex] = updatedTemplate;
    } else {
      templates.push(updatedTemplate);
    }
    
    localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(templates));
  }

  static createTemplate(
    name: string,
    description: string,
    template: string,
    variables: string[],
    analysisType: 'stride' | 'stpa-sec' | 'custom' = 'custom'
  ): PromptTemplate {
    const now = new Date().toISOString();
    const newTemplate: PromptTemplate = {
      id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      template,
      variables,
      analysisType,
      expectedOutputFormat: 'structured',
      version: '1.0',
      isActive: true,
      createdAt: now,
      updatedAt: now
    };
    
    this.saveTemplate(newTemplate);
    return newTemplate;
  }

  static deleteTemplate(id: string): void {
    if (typeof window === 'undefined') return;
    
    // Don't delete default templates
    if (id.includes('-default')) return;
    
    const templates = this.getAllTemplates();
    const filtered = templates.filter(t => t.id !== id);
    localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(filtered));
  }

  static duplicateTemplate(id: string, newName: string): PromptTemplate | null {
    const original = this.getTemplate(id);
    if (!original) return null;
    
    const duplicate = {
      ...original,
      id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: newName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.saveTemplate(duplicate);
    return duplicate;
  }

  static getActiveTemplates(): PromptTemplate[] {
    return this.getAllTemplates().filter(t => t.isActive);
  }

  static toggleTemplateActive(id: string): void {
    const template = this.getTemplate(id);
    if (!template) return;
    
    template.isActive = !template.isActive;
    this.saveTemplate(template);
  }
}