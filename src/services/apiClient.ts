/**
 * PAIMANA AI Production Database & Backend API Client
 */

export interface ApiResponse<T> {
  data: T;
  pagination?: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
  filters?: Record<string, any>;
  metadata?: {
    last_updated: string;
    source: string;
  };
}

const API_BASE = '/api/v1';

class ApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  async getDatabaseStatus() {
    const res = await fetch(`${API_BASE}/database/status`, { credentials: 'omit' });
    if (!res.ok) throw new Error('Failed to fetch database status');
    return res.json();
  }

  async seedDatabase() {
    const res = await fetch(`${API_BASE}/database/seed`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to seed database');
    return res.json();
  }

  async getProjects(params?: {
    page?: number;
    page_size?: number;
    search?: string;
    ministry?: string;
    sector?: string;
    risk_level?: string;
    status?: string;
    sort_by?: string;
    sort_order?: string;
  }) {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== '') query.append(key, String(val));
      });
    }
    const res = await fetch(`${API_BASE}/projects?${query.toString()}`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch projects');
    return res.json();
  }

  async getProjectById(id: string) {
    const res = await fetch(`${API_BASE}/projects/${id}`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error(`Failed to fetch project ${id}`);
    return res.json();
  }

  async getDashboardSummary() {
    const res = await fetch(`${API_BASE}/dashboard/summary`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch dashboard summary');
    return res.json();
  }

  async getRiskDistribution() {
    const res = await fetch(`${API_BASE}/dashboard/risk-distribution`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch risk distribution');
    return res.json();
  }

  async getSectorSummary() {
    const res = await fetch(`${API_BASE}/dashboard/sector-summary`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch sector summary');
    return res.json();
  }

  async getAlerts() {
    const res = await fetch(`${API_BASE}/alerts`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch alerts');
    return res.json();
  }

  async acknowledgeAlert(alertId: string, userEmail: string) {
    const res = await fetch(`${API_BASE}/alerts/${alertId}/acknowledge`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ acknowledgedBy: userEmail }),
    });
    if (!res.ok) throw new Error(`Failed to acknowledge alert ${alertId}`);
    return res.json();
  }

  async getInterventions() {
    const res = await fetch(`${API_BASE}/interventions`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch interventions');
    return res.json();
  }

  async getAuditLogs() {
    const res = await fetch(`${API_BASE}/audit-logs`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    return res.json();
  }

  async getDataQuality() {
    const res = await fetch(`${API_BASE}/data-quality/summary`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch data quality summary');
    return res.json();
  }
}

export const apiClient = new ApiClient();
