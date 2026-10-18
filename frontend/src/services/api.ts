import {
  TitleSearchResult,
  ReviewVerdict,
  ComparisonResult,
  DiscoveryFeedItem,
  SystemHealth
} from '../types';

const API_BASE = '/api';

export async function searchTitles(query: string): Promise<TitleSearchResult[]> {
  if (!query.trim()) return [];
  const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error('Search request failed');
  return res.json();
}

export async function getTrending(type: string = 'all'): Promise<TitleSearchResult[]> {
  const res = await fetch(`${API_BASE}/trending?type=${encodeURIComponent(type)}`);
  if (!res.ok) throw new Error('Failed to load trending titles');
  return res.json();
}

export async function getCuratedShelves(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/shelves`);
  if (!res.ok) throw new Error('Failed to load curated shelves');
  return res.json();
}

export async function getShelfMore(shelfId: string, page: number = 1, limit: number = 8): Promise<{
  shelf_id: string;
  page: number;
  has_more: boolean;
  items: any[];
}> {
  const res = await fetch(`${API_BASE}/shelves/${encodeURIComponent(shelfId)}/more?page=${page}&limit=${limit}`);
  if (!res.ok) throw new Error('Failed to load more shelf items');
  return res.json();
}

export async function getKnowledgeStats(): Promise<Record<string, any>> {
  const res = await fetch(`${API_BASE}/knowledge/stats`);
  if (!res.ok) throw new Error('Failed to load knowledge store stats');
  return res.json();
}

export async function getKnowledgeRecent(limit: number = 16): Promise<any[]> {
  const res = await fetch(`${API_BASE}/knowledge/recent?limit=${limit}`);
  if (!res.ok) throw new Error('Failed to load recent knowledge items');
  return res.json();
}

export async function getLayaTelemetry(): Promise<Record<string, any>> {
  const res = await fetch(`${API_BASE}/laya/telemetry`);
  if (!res.ok) throw new Error('Failed to load LAYA telemetry');
  return res.json();
}

export async function getDiscovery(query: string): Promise<DiscoveryFeedItem> {
  const res = await fetch(`${API_BASE}/discovery?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error('Failed to execute discovery search');
  return res.json();
}

export async function getTitleAnalysis(canonicalId: string, preliminary: boolean = false): Promise<ReviewVerdict> {
  const res = await fetch(`${API_BASE}/titles/${encodeURIComponent(canonicalId)}?preliminary=${preliminary}`);
  if (!res.ok) throw new Error('Failed to retrieve review analysis');
  return res.json();
}

export async function compareTitles(titleIds: string[]): Promise<ComparisonResult> {
  const res = await fetch(`${API_BASE}/compare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title_ids: titleIds }),
  });
  if (!res.ok) throw new Error('Comparison failed');
  return res.json();
}

export async function getHealth(): Promise<SystemHealth> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Health check failed');
  return res.json();
}

export async function getStats(): Promise<Record<string, any>> {
  const res = await fetch(`${API_BASE}/stats`);
  if (!res.ok) throw new Error('Stats request failed');
  return res.json();
}

export interface StreamProgressUpdate {
  step: 'metadata_resolved' | 'sources_gathered' | 'preliminary_verdict' | 'complete' | 'error';
  title?: string;
  poster_url?: string;
  source_count?: number;
  categories?: string[];
  verdict?: string;
  score?: number;
  confidence?: number;
  data?: ReviewVerdict;
  progress?: number;
  message?: string;
}

export function streamTitleAnalysis(
  canonicalId: string,
  onUpdate: (update: StreamProgressUpdate) => void,
  onError: (err: any) => void
): () => void {
  const eventSource = new EventSource(`${API_BASE}/titles/${encodeURIComponent(canonicalId)}/stream`);

  eventSource.onmessage = (event) => {
    try {
      const parsed: StreamProgressUpdate = JSON.parse(event.data);
      onUpdate(parsed);
      if (parsed.step === 'complete' || parsed.step === 'error') {
        eventSource.close();
      }
    } catch (err) {
      onError(err);
      eventSource.close();
    }
  };

  eventSource.onerror = (err) => {
    onError(err);
    eventSource.close();
  };

  return () => {
    eventSource.close();
  };
}
