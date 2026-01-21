/**
 * Connection Types for Research Analyzer
 * Defines interfaces for policy-research connections and ratings
 */

export interface PolicyConnection {
  connectionId: string;
  policyId: string;
  paperId: string;
  stateJurisdiction: string;
  connectionType: ConnectionType;
  strengthScore: number;
  evidenceQuality: number;
  workforceRelevance: number;
  rationale?: string;
  outcomeAffected?: string;
  createdAt: Date;
  updatedAt: Date;
  project?: string;
}

export interface PolicyConnectionInput {
  policyId: string;
  paperId: string;
  stateJurisdiction: string;
  connectionType: ConnectionType;
  strengthScore: number;
  evidenceQuality: number;
  workforceRelevance: number;
  rationale?: string;
  outcomeAffected?: string;
  project?: string;
}

export type ConnectionType = 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' | 'MIXED';

export interface ConnectionRating {
  strengthScore: number;      // 1-10: How strongly the policy affects the outcome
  evidenceQuality: number;    // 1-10: Quality of evidence supporting the connection
  workforceRelevance: number; // 1-10: How relevant to physician workforce
}

export interface ConnectionFilters {
  policyId?: string;
  paperId?: string;
  state?: string;
  connectionType?: ConnectionType;
  minStrength?: number;
  minEvidence?: number;
  sortBy?: 'strength' | 'evidence' | 'relevance' | 'date';
  sortOrder?: 'asc' | 'desc';
}

export interface ConnectionSummary {
  totalConnections: number;
  positiveConnections: number;
  negativeConnections: number;
  neutralConnections: number;
  averageStrength: number;
  averageEvidence: number;
  averageRelevance: number;
}

export interface ConnectionWithDetails extends PolicyConnection {
  policyTitle?: string;
  paperTitle?: string;
}

/**
 * Evidence quality categories based on score
 */
export function getEvidenceCategory(score: number): 'strong' | 'moderate' | 'weak' {
  if (score >= 8) return 'strong';
  if (score >= 5) return 'moderate';
  return 'weak';
}

/**
 * Connection strength labels
 */
export function getStrengthLabel(score: number): string {
  if (score >= 9) return 'Very Strong';
  if (score >= 7) return 'Strong';
  if (score >= 5) return 'Moderate';
  if (score >= 3) return 'Weak';
  return 'Very Weak';
}
