// Platform API client. The web app talks ONLY to the platform API — never to
// the AI Engine directly. Evidence and metadata arrive as contract payloads.

export const API_BASE =
  process.env.NEXT_PUBLIC_PLATFORM_API ?? "http://localhost:8000";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("token");
}

export async function api<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Token ${token}`);
  if (!(init.body instanceof FormData) && init.method && init.method !== "GET") {
    headers.set("Content-Type", "application/json");
  }
  const resp = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (resp.status === 401 && typeof window !== "undefined") {
    window.location.href = "/login";
  }
  if (!resp.ok) {
    throw new Error(`${resp.status}: ${await resp.text()}`);
  }
  return resp.json();
}

// --- contract shapes used by slice 1 (mirrors tender-contracts v1) ---

export interface EvidenceReference {
  document_id: string;
  filename?: string | null;
  page?: number | null;
  section_path?: string | null;
  clause?: string | null;
  block_id?: string | null;
  quote: string;
  method: string;
  confidence: number;
  verified: boolean;
}

export interface MetadataField {
  value: string | null;
  evidence: EvidenceReference[];
  confidence?: number | null;
  needs_review: boolean;
}

export type TenderMetadata = Record<string, MetadataField>;

export interface TenderDocument {
  id: string;
  filename: string;
  content_type: string;
  size: number;
  ingestion_status: "pending" | "processing" | "ingested" | "failed";
  ingestion_error: string;
  engine_document_id: string;
  created_at: string;
}

export interface Tender {
  id: string;
  reference: string;
  title: string;
  client_name: string;
  country: string;
  deadline: string | null;
  status: string;
  decision: string;
  decision_reason: string;
  ai_metadata: TenderMetadata | null;
  documents: TenderDocument[];
  created_at: string;
}

export interface DocumentBlock {
  id: string;
  document_id: string;
  page: number | null;
  order: number;
  block_type: string;
  section_path: string | null;
  text: string;
  table_data: string[][] | null;
}
