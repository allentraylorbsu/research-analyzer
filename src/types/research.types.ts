/**
 * Research Types for Physician Workforce Research Analyzer
 * Defines interfaces for research papers and analysis
 */

export interface ResearchPaper {
  id: string;
  title: string;
  firstAuthor?: string;
  allAuthors?: string;
  journal?: string;
  publicationYear?: number;
  abstract?: string;
  researchText?: string;
  categories: ResearchCategory[];
  createdAt: Date;
  updatedAt: Date;
  project?: string;
  pmid?: string;
  doi?: string;
  sourceUrl?: string;
}

export interface ResearchPaperInput {
  title: string;
  firstAuthor?: string;
  allAuthors?: string;
  journal?: string;
  publicationYear?: number;
  abstract?: string;
  researchText?: string;
  categories?: ResearchCategory[];
  project?: string;
  pmid?: string;
  doi?: string;
  sourceUrl?: string;
}

export interface AnalysisResult {
  id: string;
  paperId: string;
  paperTitle: string;
  outcomes: HealthOutcome[];
  studyQuality: StudyQuality;
  analysisSummary: string;
  policyConnections: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface HealthOutcome {
  outcomeName: string;
  effectDirection: 'positive' | 'negative' | 'neutral' | 'mixed';
  effectSize?: string;
  confidence: 'high' | 'moderate' | 'low';
  populationAffected?: string;
  description?: string;
}

export interface StudyQuality {
  qualityScoreEstimate: number;
  studyDesign?: string;
  sampleSize?: string;
  limitations?: string[];
  strengths?: string[];
}

/**
 * Research categories for physician workforce research
 */
export const RESEARCH_CATEGORIES = [
  'Healthcare Workforce',
  'Rural Health',
  'Primary Care',
  'Specialty Care',
  'Mental Health',
  'Public Health',
  'Health Policy',
  'Medical Education',
  'Telemedicine',
  'Healthcare Access',
  'Healthcare Quality',
  'Healthcare Economics',
  'Physician Burnout',
  'Healthcare Delivery',
  'Population Health',
  'Health Disparities',
  'Preventive Care',
  'Chronic Disease Management',
  'Emergency Medicine',
  'Pediatric Healthcare'
] as const;

export type ResearchCategory = typeof RESEARCH_CATEGORIES[number];

export interface ResearchFilters {
  search?: string;
  categories?: ResearchCategory[];
  state?: string;
  yearFrom?: number;
  yearTo?: number;
  sortBy?: 'title' | 'date' | 'relevance';
  sortOrder?: 'asc' | 'desc';
}

export interface DuplicateGroup {
  normalizedTitle: string;
  papers: ResearchPaper[];
}
