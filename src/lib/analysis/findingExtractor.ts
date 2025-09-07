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
    console.log("FindingExtractor.extractFindings called");
    console.log("Response length:", response?.length);
    console.log("Analysis type:", analysisType);
    console.log("Model source:", modelSource);
    
    const findings: SecurityFinding[] = [];
    
    // Try to parse structured response first
    const structuredFindings = this.parseStructuredResponse(response);
    console.log("Structured findings found:", structuredFindings.length);
    
    if (structuredFindings.length > 0) {
      return structuredFindings.map((f, index) => ({
        id: `finding_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
        title: f.title || 'Untitled Finding',
        description: f.description || 'No description provided',
        severity: f.severity || 'medium',
        category: f.category || 'General',
        modelSource,
        confidence: f.confidence,
        cweId: f.cweId,
        mitigations: f.mitigations,
        createdAt: new Date().toISOString()
      }));
    }
    
    // Fallback to text parsing
    const sections = this.splitIntoSections(response);
    console.log("Text sections found:", sections.length);
    
    sections.forEach((section, index) => {
      const finding = this.parseSectionToFinding(section, analysisType, modelSource);
      if (finding) {
        console.log(`Finding ${index + 1} parsed:`, finding.title);
        findings.push({
          ...finding,
          id: `finding_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`
        });
      }
    });
    
    console.log("Total findings extracted:", findings.length);
    return findings;
  }

  /**
   * Try to parse JSON or structured format
   */
  private static parseStructuredResponse(response: string): Partial<SecurityFinding>[] {
    // First try to parse as raw JSON (API returns raw JSON)
    try {
      const parsed = JSON.parse(response);
      console.log("Successfully parsed raw JSON:", parsed);
      
      // Handle STRIDE format with categories
      if (parsed.spoofing || parsed.tampering || parsed.repudiation || 
          parsed.information_disclosure || parsed.denial_of_service || 
          parsed.elevation_of_privilege) {
        const findings: Partial<SecurityFinding>[] = [];
        
        // Extract findings from each STRIDE category
        const categories = ['spoofing', 'tampering', 'repudiation', 
                          'information_disclosure', 'denial_of_service', 
                          'elevation_of_privilege'];
        
        for (const category of categories) {
          if (parsed[category] && Array.isArray(parsed[category])) {
            parsed[category].forEach((finding: Partial<SecurityFinding> & {
              vulnerability?: string;
              attack_scenario?: string;
              cwe_id?: string;
              recommended_mitigations?: string;
            }) => {
              findings.push({
                title: finding.vulnerability || finding.title || 'Untitled Finding',
                description: finding.attack_scenario || finding.description || 'No description',
                severity: (finding.severity?.toLowerCase() as 'high' | 'medium' | 'low') || 'medium',
                category: category.toUpperCase().replace('_', ' '),
                cweId: finding.cwe_id,
                mitigations: finding.recommended_mitigations ? 
                  [finding.recommended_mitigations] : finding.mitigations
              });
            });
          }
        }
        
        console.log("Extracted STRIDE findings:", findings.length);
        return findings;
      }
      
      // Handle array format
      if (Array.isArray(parsed)) {
        return parsed;
      }
      
      // Handle object with findings array
      if (parsed.findings && Array.isArray(parsed.findings)) {
        return parsed.findings;
      }
    } catch (e) {
      console.log("Failed to parse as raw JSON, trying markdown format");
    }
    
    // Try to extract JSON from markdown code blocks
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
    
    // Look for numbered headers with bold text pattern: ### 1. **Title**
    const numberedHeaderPattern = /(?:^|\n)###\s*\d+\.\s*\*\*/gm;
    const numberedHeaderMatches = response.match(numberedHeaderPattern);
    if (numberedHeaderMatches && numberedHeaderMatches.length > 0) {
      const parts = response.split(numberedHeaderPattern);
      // Keep only non-empty sections with substantial content
      const validSections = parts.filter(s => s.trim().length > 50);
      if (validSections.length > 0) {
        return validSections;
      }
    }
    
    // Look for the specific pattern we see in the response: ### number. **title**
    const specificPattern = /(?:^|\n)###\s*\d+\.\s*/gm;
    const specificMatches = response.match(specificPattern);
    if (specificMatches && specificMatches.length > 0) {
      const parts = response.split(specificPattern);
      const validSections = parts.filter(s => s.trim().length > 50);
      if (validSections.length > 0) {
        return validSections;
      }
    }
    
    // First, check for STRIDE-specific section headers
    if (response.includes('## SPOOFING') || response.includes('## TAMPERING')) {
      // Split by ## CATEGORY THREATS pattern
      const categoryPattern = /(?:^|\n)##\s*[A-Z\s]+THREATS?\s*\n/gm;
      const categoryMatches = response.match(categoryPattern);
      if (categoryMatches && categoryMatches.length > 0) {
        // For each category section, extract individual findings
        const categorySections = response.split(categoryPattern);
        const allFindings: string[] = [];
        
        for (const section of categorySections) {
          if (section.trim().length < 50) continue;
          
          // Within each category, split by ### numbered items
          const findingPattern = /(?:^|\n)###\s*\d+\./gm;
          const findingParts = section.split(findingPattern);
          allFindings.push(...findingParts.filter(s => s.trim().length > 50));
        }
        
        if (allFindings.length > 0) {
          return allFindings;
        }
      }
    }
    
    // Split by numbered items with headers (###)
    const numberedWithHeaderPattern = /(?:^|\n)###?\s*\d+[\.\)]\s+/gm;
    const numberedWithHeaderMatches = response.match(numberedWithHeaderPattern);
    if (numberedWithHeaderMatches && numberedWithHeaderMatches.length > 2) {
      const numberedSections = response.split(numberedWithHeaderPattern);
      return numberedSections.filter(s => s.trim().length > 50);
    }
    
    // Split by headers (##, ###, etc.)
    const headerPattern = /(?:^|\n)#{2,}\s+/gm;
    const headerMatches = response.match(headerPattern);
    if (headerMatches && headerMatches.length > 2) {
      const headerSections = response.split(headerPattern);
      return headerSections.filter(s => s.trim().length > 50);
    }
    
    // If no clear sections found, try to split by double newlines
    const paragraphs = response.split(/\n\n+/).filter(p => p.trim().length > 50);
    if (paragraphs.length > 1) {
      return paragraphs;
    }
    
    // Return as single section if nothing else works
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
    if (lines.length === 0 || section.trim().length < 20) return null;
    
    // Extract title - be more flexible
    let title = '';
    
    // Try to find a title in various formats
    const titlePatterns = [
      /\*\*(.*?)\*\*/,                    // **Bold text**
      /^#+\s*(.+)$/m,                      // # Header
      /^(?:Threat|Finding|Issue|Risk):\s*(.+)$/mi,  // Threat: Title
      /^(?:\d+[\.\)]\s*)?(.+?)(?:\n|$)/   // First line (with optional number)
    ];
    
    for (const pattern of titlePatterns) {
      const match = section.match(pattern);
      if (match && match[1]) {
        title = match[1].trim();
        break;
      }
    }
    
    // If still no title, use first meaningful line
    if (!title) {
      title = lines.find(l => l.length > 10 && !l.match(/^[\s\-\*#]+$/)) || 'Security Finding';
    }
    
    // Clean up title
    title = title.replace(/^[\d\.\)\-\*#\s]+/, '').trim();
    
    // Extract severity with more patterns
    const severityPatterns = [
      /severity[:\s]*(high|critical|medium|moderate|low|minimal)/i,
      /\b(high|critical|medium|moderate|low|minimal)\s+(?:severity|risk|priority)/i,
      /(?:risk|threat)\s+level[:\s]*(high|critical|medium|moderate|low|minimal)/i
    ];
    
    let severity: 'high' | 'medium' | 'low' = 'medium';
    for (const pattern of severityPatterns) {
      const match = section.match(pattern);
      if (match) {
        const level = match[1].toLowerCase();
        if (level === 'critical' || level === 'high') severity = 'high';
        else if (level === 'moderate' || level === 'medium') severity = 'medium';
        else if (level === 'minimal' || level === 'low') severity = 'low';
        break;
      }
    }
    
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
    const description = this.extractDescription(section, title) || section.substring(0, 500);
    
    // Don't create finding if title and description are too similar or too short
    if (title.length < 3 || description.length < 10) {
      console.log('Skipping finding - title or description too short');
      return null;
    }
    
    return {
      id: '', // Will be set by caller
      title: title.substring(0, 200), // Limit title length
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