import { SecurityFinding, ThreatAnnotation, CategorizedFindings } from '@/types';

export class FindingExtractor {
  /**
   * Extract security findings from model response text
   */
  static extractFindings(
    response: string, 
    analysisType: 'stride' | 'stpa-sec' | 'custom',
    modelSource: string
  ): SecurityFinding[] {
    const findings: SecurityFinding[] = [];
    
    // Try to parse structured response first
    const structuredFindings = this.parseStructuredResponse(response);
    if (structuredFindings.length > 0) {
      return structuredFindings.map(f => ({
        ...f,
        modelSource,
        createdAt: new Date().toISOString()
      }));
    }
    
    // Fallback to text parsing
    const sections = this.splitIntoSections(response);
    
    sections.forEach((section, index) => {
      const finding = this.parseSectionToFinding(section, analysisType, modelSource);
      if (finding) {
        findings.push({
          ...finding,
          id: `finding_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`
        });
      }
    });
    
    return findings;
  }

  /**
   * Try to parse JSON or structured format
   */
  private static parseStructuredResponse(response: string): Partial<SecurityFinding>[] {
    // Try to extract JSON from response
    const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        if (Array.isArray(parsed)) {
          return parsed;
        }
        if (parsed.findings && Array.isArray(parsed.findings)) {
          return parsed.findings;
        }
      } catch (e) {
        // Continue with text parsing
      }
    }
    
    return [];
  }

  /**
   * Split response into logical sections
   */
  private static splitIntoSections(response: string): string[] {
    const sections: string[] = [];
    
    // Split by numbered items (1., 2., etc.)
    const numberedSections = response.split(/\n\d+\.\s+/);
    if (numberedSections.length > 1) {
      return numberedSections.slice(1); // Skip first empty element
    }
    
    // Split by headers (##, ###, etc.)
    const headerSections = response.split(/\n#{2,}\s+/);
    if (headerSections.length > 1) {
      return headerSections.slice(1);
    }
    
    // Split by bullet points
    const bulletSections = response.split(/\n[\*\-]\s+/);
    if (bulletSections.length > 1) {
      return bulletSections.slice(1);
    }
    
    // Return as single section
    return [response];
  }

  /**
   * Parse a text section into a finding
   */
  private static parseSectionToFinding(
    section: string, 
    analysisType: string,
    modelSource: string
  ): SecurityFinding | null {
    const lines = section.split('\n').filter(l => l.trim());
    if (lines.length === 0) return null;
    
    // Extract title (first line or bold text)
    const titleMatch = lines[0].match(/\*\*(.*?)\*\*/);
    const title = titleMatch ? titleMatch[1] : lines[0].replace(/^#+\s*/, '');
    
    // Extract severity
    const severityMatch = section.match(/severity[:\s]*(high|medium|low)/i);
    const severity = (severityMatch?.[1]?.toLowerCase() || 'medium') as 'high' | 'medium' | 'low';
    
    // Extract category based on analysis type
    const category = this.extractCategory(section, analysisType);
    
    // Extract CWE ID
    const cweMatch = section.match(/CWE[-\s]?(\d+)/i);
    const cweId = cweMatch?.[1];
    
    // Extract confidence
    const confidenceMatch = section.match(/confidence[:\s]*(\d+)%?/i);
    const confidence = confidenceMatch ? parseInt(confidenceMatch[1]) : undefined;
    
    // Extract mitigations
    const mitigations = this.extractMitigations(section);
    
    // Build description from remaining content
    const description = this.extractDescription(section, title);
    
    return {
      id: '', // Will be set by caller
      title: title.trim(),
      description: description.trim(),
      severity,
      category,
      modelSource,
      confidence,
      cweId,
      mitigations,
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Extract category based on analysis type
   */
  private static extractCategory(section: string, analysisType: string): string {
    if (analysisType === 'stride') {
      const strideCategories = [
        'Spoofing', 'Tampering', 'Repudiation', 
        'Information Disclosure', 'Denial of Service', 'Elevation of Privilege'
      ];
      
      for (const category of strideCategories) {
        if (section.toLowerCase().includes(category.toLowerCase())) {
          return category;
        }
      }
    }
    
    if (analysisType === 'stpa-sec') {
      if (section.toLowerCase().includes('unsafe control')) return 'Unsafe Control Action';
      if (section.toLowerCase().includes('missing feedback')) return 'Missing Feedback';
      if (section.toLowerCase().includes('component failure')) return 'Component Failure';
    }
    
    // Try to extract from explicit category mention
    const categoryMatch = section.match(/category[:\s]*([^\n]+)/i);
    if (categoryMatch) {
      return categoryMatch[1].trim();
    }
    
    return 'General';
  }

  /**
   * Extract mitigations from text
   */
  private static extractMitigations(section: string): string[] {
    const mitigations: string[] = [];
    
    // Look for mitigation section
    const mitigationSection = section.match(/mitigations?[:\s]*\n([\s\S]*?)(?=\n\n|$)/i);
    if (mitigationSection) {
      const mitigationText = mitigationSection[1];
      const items = mitigationText.split(/\n[\*\-\d\.]\s+/).filter(m => m.trim());
      mitigations.push(...items.map(m => m.trim()));
    }
    
    // Look for recommendations
    const recommendationSection = section.match(/recommendations?[:\s]*\n([\s\S]*?)(?=\n\n|$)/i);
    if (recommendationSection) {
      const recommendationText = recommendationSection[1];
      const items = recommendationText.split(/\n[\*\-\d\.]\s+/).filter(m => m.trim());
      mitigations.push(...items.map(m => m.trim()));
    }
    
    return mitigations.filter((m, i, arr) => arr.indexOf(m) === i); // Remove duplicates
  }

  /**
   * Extract description from section
   */
  private static extractDescription(section: string, title: string): string {
    // Remove title from section
    let description = section.replace(title, '').replace(/\*\*(.*?)\*\*/, '');
    
    // Remove severity, category, CWE mentions
    description = description.replace(/severity[:\s]*(high|medium|low)/gi, '');
    description = description.replace(/CWE[-\s]?\d+/gi, '');
    description = description.replace(/confidence[:\s]*\d+%?/gi, '');
    
    // Remove mitigation section
    description = description.replace(/mitigations?[:\s]*\n[\s\S]*?(?=\n\n|$)/gi, '');
    description = description.replace(/recommendations?[:\s]*\n[\s\S]*?(?=\n\n|$)/gi, '');
    
    // Clean up
    description = description.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join(' ');
    
    // Limit length
    if (description.length > 500) {
      description = description.substring(0, 497) + '...';
    }
    
    return description;
  }

  /**
   * Categorize findings by different dimensions
   */
  static categorizeFindings(findings: SecurityFinding[]): CategorizedFindings {
    const byCategory = new Map<string, SecurityFinding[]>();
    const bySeverity = new Map<string, SecurityFinding[]>();
    const byModel = new Map<string, SecurityFinding[]>();
    
    findings.forEach(finding => {
      // By category
      const categoryFindings = byCategory.get(finding.category) || [];
      categoryFindings.push(finding);
      byCategory.set(finding.category, categoryFindings);
      
      // By severity
      const severityFindings = bySeverity.get(finding.severity) || [];
      severityFindings.push(finding);
      bySeverity.set(finding.severity, severityFindings);
      
      // By model
      const modelFindings = byModel.get(finding.modelSource) || [];
      modelFindings.push(finding);
      byModel.set(finding.modelSource, modelFindings);
    });
    
    return { byCategory, bySeverity, byModel };
  }

  /**
   * Generate threat annotations from findings
   */
  static generateThreatAnnotations(findings: SecurityFinding[]): ThreatAnnotation[] {
    const annotations: ThreatAnnotation[] = [];
    const categorized = this.categorizeFindings(findings);
    
    let refIndex = 1;
    categorized.bySeverity.forEach((severityFindings, severity) => {
      severityFindings.forEach(finding => {
        annotations.push({
          id: `threat_${finding.id}`,
          referenceId: `T${refIndex}`,
          title: finding.title,
          severity: severity as 'high' | 'medium' | 'low',
          linkedFindings: [finding.id]
        });
        refIndex++;
      });
    });
    
    return annotations;
  }
}