/**
 * Report Service - Handles report upload, sharing, and management
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface ReportMetadata {
  name: string;
  description?: string;
  tags?: string[];
  analyst?: string;
}

export interface ReportUploadResponse {
  report_id: string;
  share_url: string;
  expires_at: string;
  expiration_minutes: number;
}

export interface ReportMetadataResponse {
  report_id: string;
  share_url: string;
  expires_at: string;
  metadata: Record<string, string>;
  exists: boolean;
}

class ReportService {
  /**
   * Upload a report HTML to S3 and get a shareable link
   */
  async uploadReport(
    htmlContent: string,
    metadata: ReportMetadata
  ): Promise<ReportUploadResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/reports/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          html_content: htmlContent,
          metadata: {
            name: metadata.name,
            description: metadata.description || '',
            tags: metadata.tags?.join(',') || '',
            analyst: metadata.analyst || '',
          },
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to upload report';
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorMessage;
        } catch {
          errorMessage = await response.text() || errorMessage;
        }
        
        // Check for common configuration issues
        if (response.status === 503) {
          throw new Error('Report sharing is not configured on the server. Please check S3 settings.');
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Report upload failed:', error);
      throw error;
    }
  }

  /**
   * Get report metadata and refresh the shareable URL
   */
  async getReportMetadata(reportId: string): Promise<ReportMetadataResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/reports/${reportId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get report metadata: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to get report metadata:', error);
      throw error;
    }
  }

  /**
   * Delete a report from S3
   */
  async deleteReport(reportId: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/reports/${reportId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.warn('Report not found, may have already expired');
          return true;
        }
        throw new Error(`Failed to delete report: ${response.statusText}`);
      }

      return true;
    } catch (error) {
      console.error('Failed to delete report:', error);
      throw error;
    }
  }

  /**
   * Calculate remaining time until expiration
   */
  calculateTimeRemaining(expiresAt: string): {
    minutes: number;
    seconds: number;
    isExpired: boolean;
  } {
    const now = new Date().getTime();
    const expiration = new Date(expiresAt).getTime();
    const difference = expiration - now;

    if (difference <= 0) {
      return { minutes: 0, seconds: 0, isExpired: true };
    }

    const minutes = Math.floor(difference / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    return { minutes, seconds, isExpired: false };
  }

  /**
   * Format expiration time for display
   */
  formatExpirationTime(expiresAt: string): string {
    const { minutes, seconds, isExpired } = this.calculateTimeRemaining(expiresAt);
    
    if (isExpired) {
      return 'Expired';
    }
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    
    return `${seconds}s`;
  }
}

export const reportService = new ReportService();