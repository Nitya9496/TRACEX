export type EvidenceItem = {
  id: string;
  evidence_type: string;
  source: string;
  source_record?: string | null;
  timestamp: string;
  related_entities?: string | null;
  description: string;
  status: string;
  actor_id?: string | null;
};

export type InfraRecord = {
  id: string;
  onion_id?: string | null;
  onion_address?: string | null;
  clearnet_domain?: string | null;
  ssl_cn?: string | null;
  ssl_fingerprint?: string | null;
  server_banner?: string | null;
  misconfig?: string | null;
  descriptor_anomaly?: string | null;
  actor_id?: string | null;
  first_seen?: string;
  evidence?: EvidenceItem[];
};

export type GraphEdge = {
  id: string;
  source: string;
  target: string;
  type: string;
  explanation: string;
  confidence: string;
  origin?: string;
  timestamp?: string | null;
  evidence?: string | null;
};

export type GraphNode = {
  id: string;
  label: string;
  type: string;
};

export type Investigation = {
  id: string;
  name: string;
  description?: string;
  search_identifier?: string;
  identifier_type?: string;
  category?: string;
  priority?: string;
  status: string;
  created_at: string;
  actor_ids?: string[];
  primary_actor_id?: string | null;
};
