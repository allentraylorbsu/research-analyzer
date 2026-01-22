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

// Open States API service
export {
  searchOpenStates,
  getBillDetails as getOpenStatesBillDetails,
  SUGGESTED_LEGISLATION_SEARCHES,
  getStateName
} from './openstates'
export type { OpenStatesBill, OpenStatesSearchResult, OpenStatesSearchOptions } from './openstates'

// NewsAPI service
export {
  searchNews,
  searchTopHeadlines,
  buildWorkforceNewsQuery,
  SUGGESTED_NEWS_SEARCHES,
  getDateFromDaysAgo
} from './newsapi'
export type { NewsArticle, NewsSearchResult, NewsSearchOptions } from './newsapi'

// GDELT API service (free historical news)
export {
  searchGdelt,
  SUGGESTED_GDELT_SEARCHES,
  GDELT_DATE_RANGES,
  HEALTH_POLICY_DOMAINS
} from './gdelt'
export type { GdeltArticle, GdeltSearchResult, GdeltSearchOptions } from './gdelt'
