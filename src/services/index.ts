/**
 * Services Index
 * Central export for all service modules
 */

// Supabase service
export {
  initializeSupabase,
  getSupabaseClient,
  isSupabaseConfigured,
  policyService,
  researchPaperService,
  connectionService,
  baselineWorkforceService
} from './supabase'

// LegiScan API service
export {
  searchLegiScanBills,
  getBillDetails,
  getStateSessions,
  stateNameToAbbrev
} from './legiscan'

// OpenAI service
export {
  testConnection as testOpenAIConnection,
  analyzeResearchPaper,
  analyzeConnection,
  suggestPolicyConnections
} from './openai'
export type { AnalysisRequest, AnalysisResponse, ConnectionSuggestion } from './openai'

// PubMed service
export {
  searchPubMed,
  fetchPubMedDetails,
  fetchPubMedArticle,
  buildWorkforceSearchQuery,
  SUGGESTED_SEARCHES
} from './pubmed'
export type { PubMedSearchResult, PubMedSearchResponse } from './pubmed'

// PDF processor service
export {
  extractTextFromPdf,
  extractTextFromUrl,
  estimateReadingTime,
  extractAbstract,
  extractTitle,
  extractAuthors
} from './pdfProcessor'
export type { PdfExtractionResult, PdfMetadata, PdfProcessingOptions } from './pdfProcessor'

// State ranking calculator
export {
  getWorkforceImpactGrade,
  calculateStateRankings,
  sortStateRankings,
  generateMockStateRankings,
  getRankingSummary
} from './stateRankingCalculator'
