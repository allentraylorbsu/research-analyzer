/**
 * Policy Types for Research Analyzer
 * Defines interfaces for policies and LegiScan integration
 */

export interface Policy {
  policyId: string;
  title: string;
  description?: string;
  jurisdiction: string;
  policyType?: PolicyType;
  status?: PolicyStatus;
  effectiveDate?: Date;
  sourceUrl?: string;
  billNumber?: string;
  session?: string;
  estimatedPopulationAffected?: number;
  createdAt: Date;
  updatedAt: Date;
  project?: string;
}

export interface PolicyInput {
  title: string;
  description?: string;
  jurisdiction: string;
  policyType?: PolicyType;
  status?: PolicyStatus;
  effectiveDate?: Date;
  sourceUrl?: string;
  billNumber?: string;
  session?: string;
  estimatedPopulationAffected?: number;
  project?: string;
}

export type PolicyType =
  | 'legislation'
  | 'regulation'
  | 'executive_order'
  | 'agency_rule'
  | 'court_ruling'
  | 'resolution'
  | 'news_coverage'
  | 'other';

export type PolicyStatus =
  | 'introduced'
  | 'passed'
  | 'enacted'
  | 'signed'
  | 'effective'
  | 'vetoed'
  | 'failed'
  | 'pending'
  | 'tracking';

export interface LegiScanBill {
  billId: string | number;
  billNumber: string;
  billType?: string;
  title: string;
  description?: string;
  state: string;
  session?: string;
  status?: string;
  statusDate?: string;
  lastAction?: string;
  lastActionDate?: string;
  url?: string;
  relevanceScore?: number;
}

export interface LegiScanSearchResult {
  searchresult: Record<string, LegiScanBill | { summary?: LegiScanSummary }>;
}

export interface LegiScanSummary {
  page: number;
  range: string;
  relevancy: number;
  count: number;
  page_total: number;
  query: string;
}

export interface PolicyFilters {
  search?: string;
  jurisdiction?: string;
  policyType?: PolicyType;
  status?: PolicyStatus;
  yearFrom?: number;
  yearTo?: number;
  sortBy?: 'title' | 'date' | 'jurisdiction' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export interface LegiScanSearchParams {
  state: string;
  keywords?: string;
  year?: number;
  status?: string;
}

export const DEFAULT_LEGISCAN_KEYWORDS = [
  'healthcare', 'medical', 'physician', 'nurse', 'health', 'hospital',
  'doctor', 'clinic', 'medicine', 'therapy', 'patient', 'insurance',
  'medicaid', 'medicare', 'public health', 'mental health', 'pharmacy',
  'dental', 'vision', 'emergency', 'ambulance', 'paramedic', 'health care',
  'medical device', 'drug', 'prescription', 'treatment', 'surgery',
  'diagnostic', 'preventive', 'wellness', 'telemedicine', 'health information',
  'health record', 'health system', 'health service', 'health plan',
  'health coverage', 'health benefit', 'health policy', 'health regulation',
  'health law', 'health code', 'health safety', 'health quality',
  'health access', 'health equity', 'health workforce', 'health professional',
  'health provider', 'health facility', 'health center', 'health department',
  'health agency', 'health board', 'health commission', 'health authority'
].join(',');
