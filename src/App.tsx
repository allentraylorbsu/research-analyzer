/**
 * Physician Workforce Research Analyzer
 * Main Application Component
 */

import { useState, useCallback } from 'react'
import {
  Button,
  CollapsibleSection,
  StatusMessage,
  ErrorBoundary
} from './components/common'
import { PdfUploader, CategorySelector, ResearchPaperCard, PubMedImporter } from './components/research'
import { PolicyBrowser, LegiScanImporter, PolicyConnectionRating, PolicyDiscovery } from './components/policy'
import { StateRankings } from './components/visualization'
import {
  useApiKeys,
  usePolicies,
  useResearchPapers,
  useConnections,
  useStateRankings,
  useStateFilter
} from './hooks'
import { analyzeResearchPaper, AnalysisResponse, suggestPolicyConnections, ConnectionSuggestion } from './services/openai'
import type {
  ApiKeys,
  ResearchCategory,
  ConnectionRating,
  ConnectionType,
  PolicyInput,
  ResearchPaper,
  Policy
} from './types'
import './App.css'

function App() {
  // Hooks
  const {
    apiKeys,
    connectionStatus,
    isLoading: isTestingConnection,
    setApiKeys,
    testConnections
  } = useApiKeys()

  const { policies, filteredPolicies, filters: policyFilters, setFilters: setPolicyFilters, bulkCreatePolicies } = usePolicies()
  const { papers, createPaper, deletePaper } = useResearchPapers()
  const { createConnection } = useConnections()
  const { sortedRankings, isLoading: isLoadingRankings, calculateRankings, useMockData } = useStateRankings()
  const { selectedState, setSelectedState } = useStateFilter()

  // Local state
  const [activeSection, setActiveSection] = useState<string>('api-keys')
  const [selectedCategories, setSelectedCategories] = useState<ResearchCategory[]>([])
  const [uploadedText, setUploadedText] = useState<string>('')
  const [uploadedTitle, setUploadedTitle] = useState<string>('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isSavingPaper, setIsSavingPaper] = useState(false)
  const [paperSaved, setPaperSaved] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null)
  const [selectedPaper, setSelectedPaper] = useState<ResearchPaper | null>(null)
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null)
  const [connectionRating, setConnectionRating] = useState<ConnectionRating>({
    strengthScore: 5,
    evidenceQuality: 5,
    workforceRelevance: 5
  })
  const [connectionType, setConnectionType] = useState<ConnectionType>('NEUTRAL')
  const [importError, setImportError] = useState<string | null>(null)
  const [paperSearchQuery, setPaperSearchQuery] = useState('')
  const [connectionSuggestions, setConnectionSuggestions] = useState<ConnectionSuggestion[]>([])
  const [isFindingConnections, setIsFindingConnections] = useState(false)
  const [suggestionError, setSuggestionError] = useState<string | null>(null)

  // API Key form state
  const [openaiKey, setOpenaiKey] = useState(import.meta.env.VITE_OPENAI_API_KEY || '')
  const [supabaseUrl, setSupabaseUrl] = useState(import.meta.env.VITE_SUPABASE_URL || '')
  const [supabaseKey, setSupabaseKey] = useState(import.meta.env.VITE_SUPABASE_ANON_KEY || '')
  const [legiscanKey, setLegiscanKey] = useState(import.meta.env.VITE_LEGISCAN_API_KEY || '')
  const [openStatesKey, setOpenStatesKey] = useState(import.meta.env.VITE_OPENSTATES_API_KEY || '')
  const [newsApiKey, setNewsApiKey] = useState(import.meta.env.VITE_NEWSAPI_KEY || '')

  // Handlers
  const handleSaveApiKeys = useCallback(() => {
    const keys: ApiKeys = {
      openaiKey,
      supabaseUrl,
      supabaseKey,
      legiscanKey: legiscanKey || undefined
    }
    setApiKeys(keys)
    testConnections()
  }, [openaiKey, supabaseUrl, supabaseKey, legiscanKey, setApiKeys, testConnections])

  const handlePdfUpload = useCallback((result: { text: string; title: string }) => {
    setUploadedText(result.text)
    setUploadedTitle(result.title)
    setActiveSection('research')
    setPaperSaved(false)
    setAnalysisResult(null)
  }, [])

  const handleAnalyze = useCallback(async () => {
    if (!apiKeys?.openaiKey || !uploadedText) return

    setIsAnalyzing(true)
    setAnalysisResult(null)
    try {
      const result = await analyzeResearchPaper(apiKeys.openaiKey, {
        paperTitle: uploadedTitle,
        paperText: uploadedText,
        categories: selectedCategories
      })
      setAnalysisResult(result)

      // Update title if AI extracted a better one
      if (result.title && result.title.length > 5) {
        setUploadedTitle(result.title)
      }
    } catch (err) {
      console.error('Analysis error:', err)
    } finally {
      setIsAnalyzing(false)
    }
  }, [apiKeys, uploadedText, uploadedTitle, selectedCategories])

  const handleSavePaper = useCallback(async () => {
    if (!uploadedText || !uploadedTitle) return

    setIsSavingPaper(true)
    try {
      await createPaper({
        title: uploadedTitle,
        researchText: uploadedText,
        categories: selectedCategories
      })
      setPaperSaved(true)
    } catch (err) {
      console.error('Save error:', err)
    } finally {
      setIsSavingPaper(false)
    }
  }, [uploadedText, uploadedTitle, selectedCategories, createPaper])

  const handleImportPolicies = useCallback(async (newPolicies: PolicyInput[]) => {
    setImportError(null)
    try {
      await bulkCreatePolicies(newPolicies)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Import failed'
      setImportError(message)
      throw err // Re-throw so LegiScanImporter knows it failed
    }
  }, [bulkCreatePolicies])

  const handleImportSinglePolicy = useCallback(async (policy: PolicyInput) => {
    await bulkCreatePolicies([policy])
  }, [bulkCreatePolicies])

  const handleImportError = useCallback((error: string) => {
    setImportError(error)
  }, [])

  const handleCreateConnection = useCallback(async () => {
    if (!selectedPaper || !selectedPolicy) return

    await createConnection({
      paperId: selectedPaper.id,
      policyId: selectedPolicy.policyId,
      stateJurisdiction: selectedPolicy.jurisdiction,
      connectionType,
      ...connectionRating
    })

    setSelectedPaper(null)
    setSelectedPolicy(null)
    setConnectionSuggestions([])
  }, [selectedPaper, selectedPolicy, connectionType, connectionRating, createConnection])

  const handleFindConnections = useCallback(async () => {
    if (!selectedPaper || !apiKeys?.openaiKey || policies.length === 0) return

    setIsFindingConnections(true)
    setSuggestionError(null)
    setConnectionSuggestions([])

    try {
      const suggestions = await suggestPolicyConnections(
        apiKeys.openaiKey,
        selectedPaper,
        policies,
        5
      )
      setConnectionSuggestions(suggestions)

      if (suggestions.length === 0) {
        setSuggestionError('No matching policies found. Try adding more policies or adjusting the research categories.')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to find connections'
      setSuggestionError(message)
    } finally {
      setIsFindingConnections(false)
    }
  }, [selectedPaper, apiKeys, policies])

  const handleApplySuggestion = useCallback((suggestion: ConnectionSuggestion) => {
    const policy = policies.find(p => p.policyId === suggestion.policyId)
    if (policy) {
      setSelectedPolicy(policy)
      setConnectionType(suggestion.connectionType)
      setConnectionRating({
        strengthScore: suggestion.suggestedStrength,
        evidenceQuality: suggestion.suggestedEvidenceQuality,
        workforceRelevance: 5
      })
    }
  }, [policies])

  const handlePubMedImport = useCallback(async (papersToImport: Parameters<typeof createPaper>[0][]) => {
    // Import papers sequentially to avoid overwhelming the database
    for (const paper of papersToImport) {
      await createPaper(paper)
    }
  }, [createPaper])

  // Get list of already imported PMIDs to prevent duplicates
  const existingPmids = papers
    .filter(p => p.pmid)
    .map(p => p.pmid as string)

  // Get list of existing policy titles to prevent duplicates
  const existingPolicyTitles = policies.map(p => p.title)

  return (
    <ErrorBoundary>
      <div className="min-h-screen">
        {/* Header */}
        <header className="app-header-gradient text-white shadow-xl">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <h1 className="text-3xl font-bold tracking-tight">
              Physician Workforce Research Analyzer
            </h1>
            <p className="text-white/90 mt-2 text-lg">
              Analyze research findings and connect them to healthcare workforce policies
            </p>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-6 py-10 space-y-8">
          {/* Section 1: API Keys */}
          <CollapsibleSection
            title="API Configuration"
            defaultOpen={!apiKeys}
            badge={connectionStatus.openai.connected ? 'Connected' : 'Setup Required'}
          >
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    OpenAI API Key *
                  </label>
                  <input
                    type="password"
                    value={openaiKey}
                    onChange={(e) => setOpenaiKey(e.target.value)}
                    placeholder="sk-..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    LegiScan API Key
                  </label>
                  <input
                    type="password"
                    value={legiscanKey}
                    onChange={(e) => setLegiscanKey(e.target.value)}
                    placeholder="Your LegiScan key..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Open States API Key
                  </label>
                  <input
                    type="password"
                    value={openStatesKey}
                    onChange={(e) => setOpenStatesKey(e.target.value)}
                    placeholder="Your Open States key..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    NewsAPI Key
                  </label>
                  <input
                    type="password"
                    value={newsApiKey}
                    onChange={(e) => setNewsApiKey(e.target.value)}
                    placeholder="Your NewsAPI key..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Supabase URL
                  </label>
                  <input
                    type="text"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    placeholder="https://your-project.supabase.co"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Supabase Anon Key
                  </label>
                  <input
                    type="password"
                    value={supabaseKey}
                    onChange={(e) => setSupabaseKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIs..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <Button
                onClick={handleSaveApiKeys}
                isLoading={isTestingConnection}
              >
                Save & Test Connection
              </Button>

              {connectionStatus.openai.connected && (
                <StatusMessage type="success" message="OpenAI connected successfully" />
              )}
            </div>
          </CollapsibleSection>

          {/* ========== RESEARCH PAPERS SECTION GROUP ========== */}
          <div className="mt-8 mb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Research Papers</h2>
                <p className="text-sm text-gray-600">Upload your own papers or search PubMed to find research</p>
              </div>
            </div>
          </div>

          {/* Section 2: Research Analysis */}
          <CollapsibleSection
            title="Upload & Analyze Paper"
            badge={papers.length}
            defaultOpen={activeSection === 'research'}
          >
            <div className="space-y-6">
              <PdfUploader onUpload={handlePdfUpload} />

              {uploadedText && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Paper Title
                    </label>
                    <input
                      type="text"
                      value={uploadedTitle}
                      onChange={(e) => setUploadedTitle(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  <CategorySelector
                    selected={selectedCategories}
                    onChange={setSelectedCategories}
                    maxSelections={5}
                  />

                  <div className="flex items-center gap-3 flex-wrap">
                    <Button
                      onClick={handleAnalyze}
                      disabled={!apiKeys?.openaiKey || isAnalyzing}
                      isLoading={isAnalyzing}
                    >
                      Analyze Research
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={handleSavePaper}
                      disabled={isSavingPaper || paperSaved}
                      isLoading={isSavingPaper}
                    >
                      {paperSaved ? 'Saved to Database' : 'Save Paper'}
                    </Button>
                    {paperSaved && (
                      <span className="text-green-600 text-sm flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Paper saved with {selectedCategories.length} categories
                      </span>
                    )}
                  </div>

                  {analysisResult && (
                    <div className="space-y-6 mt-6">
                      {/* Summary/Abstract */}
                      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-5 rounded-xl border border-indigo-100">
                        <h4 className="text-lg font-semibold text-indigo-900 mb-2 flex items-center gap-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Summary
                        </h4>
                        <p className="text-gray-700 leading-relaxed">{analysisResult.summary}</p>
                      </div>

                      {/* Key Findings */}
                      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                        <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                          </svg>
                          Key Findings
                        </h4>
                        <ul className="space-y-2">
                          {analysisResult.keyFindings.map((finding, idx) => (
                            <li key={idx} className="flex items-start gap-3">
                              <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-sm font-medium">
                                {idx + 1}
                              </span>
                              <span className="text-gray-700">{finding}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Health Outcomes */}
                      {analysisResult.outcomes.length > 0 && (
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                          <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            Health Outcomes
                          </h4>
                          <div className="space-y-3">
                            {analysisResult.outcomes.map((outcome, idx) => (
                              <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-gray-900">{outcome.outcomeName}</span>
                                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                    outcome.effectDirection === 'positive' ? 'bg-green-100 text-green-700' :
                                    outcome.effectDirection === 'negative' ? 'bg-red-100 text-red-700' :
                                    outcome.effectDirection === 'mixed' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-gray-100 text-gray-700'
                                  }`}>
                                    {outcome.effectDirection}
                                  </span>
                                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                    outcome.confidence === 'high' ? 'bg-blue-100 text-blue-700' :
                                    outcome.confidence === 'moderate' ? 'bg-blue-50 text-blue-600' :
                                    'bg-gray-100 text-gray-600'
                                  }`}>
                                    {outcome.confidence} confidence
                                  </span>
                                </div>
                                {outcome.description && (
                                  <p className="text-sm text-gray-600">{outcome.description}</p>
                                )}
                                {outcome.populationAffected && (
                                  <p className="text-xs text-gray-500 mt-1">Population: {outcome.populationAffected}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Study Quality */}
                      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                        <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          Study Quality
                        </h4>
                        <div className="flex items-center gap-4 mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Quality Score:</span>
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                              analysisResult.studyQuality.qualityScoreEstimate >= 7 ? 'bg-green-100 text-green-700' :
                              analysisResult.studyQuality.qualityScoreEstimate >= 4 ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {analysisResult.studyQuality.qualityScoreEstimate}/10
                            </span>
                          </div>
                          {analysisResult.studyQuality.studyDesign && (
                            <span className="text-sm text-gray-600">
                              Design: <span className="font-medium">{analysisResult.studyQuality.studyDesign}</span>
                            </span>
                          )}
                        </div>
                        {analysisResult.studyQuality.strengths && analysisResult.studyQuality.strengths.length > 0 && (
                          <div className="mb-2">
                            <span className="text-sm font-medium text-green-700">Strengths: </span>
                            <span className="text-sm text-gray-600">{analysisResult.studyQuality.strengths.join(', ')}</span>
                          </div>
                        )}
                        {analysisResult.studyQuality.limitations && analysisResult.studyQuality.limitations.length > 0 && (
                          <div>
                            <span className="text-sm font-medium text-orange-700">Limitations: </span>
                            <span className="text-sm text-gray-600">{analysisResult.studyQuality.limitations.join(', ')}</span>
                          </div>
                        )}
                      </div>

                      {/* Policy Implications */}
                      {analysisResult.policyImplications.length > 0 && (
                        <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-5 rounded-xl border border-amber-100">
                          <h4 className="text-lg font-semibold text-amber-900 mb-3 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            Policy Implications
                          </h4>
                          <ul className="space-y-2">
                            {analysisResult.policyImplications.map((implication, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <svg className="w-4 h-4 text-amber-600 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                                <span className="text-gray-700">{implication}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </CollapsibleSection>

          {/* Section 2.5: PubMed Research Search */}
          <CollapsibleSection
            title="Search PubMed"
            badge={papers.filter(p => p.pmid).length > 0 ? `${papers.filter(p => p.pmid).length} imported` : undefined}
          >
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-green-50 to-teal-50 p-4 rounded-lg border border-green-100">
                <h4 className="font-medium text-green-900 mb-1">Find Research Papers on PubMed</h4>
                <p className="text-sm text-green-700">
                  Don't have a paper yet? Search PubMed for peer-reviewed research on physician workforce, migration, retention, and healthcare policy.
                </p>
              </div>
              <PubMedImporter
                onImport={handlePubMedImport}
                existingPmids={existingPmids}
              />
            </div>
          </CollapsibleSection>

          {/* ========== POLICIES SECTION GROUP ========== */}
          <div className="mt-10 mb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Policies</h2>
                <p className="text-sm text-gray-600">Import from LegiScan or discover policies via Open States & news sources</p>
              </div>
            </div>
          </div>

          {/* Section 3: Policy Import */}
          <CollapsibleSection
            title="LegiScan Import"
            badge={policies.length}
          >
            {importError && (
              <StatusMessage
                type="error"
                message={importError}
                onDismiss={() => setImportError(null)}
              />
            )}
            <LegiScanImporter
              apiKey={apiKeys?.legiscanKey}
              onImport={handleImportPolicies}
              onError={handleImportError}
            />
          </CollapsibleSection>

          {/* Section 3.5: Policy Discovery */}
          <CollapsibleSection
            title="Discover Policies (Open States & News)"
            badge={openStatesKey || newsApiKey ? 'Active' : 'Setup Required'}
          >
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-lg border border-purple-100">
                <h4 className="font-medium text-purple-900 mb-1">Search for Policies Across Multiple Sources</h4>
                <p className="text-sm text-purple-700">
                  Search state legislation (Open States), recent news (NewsAPI), or historical news (GDELT - up to 5 years, free).
                  Filter by trusted sources like KFF.org, Health Affairs, and more.
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <a
                    href="https://openstates.org/accounts/login/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-600 hover:text-purple-800 underline"
                  >
                    Get Open States API Key (Free)
                  </a>
                  <span className="text-purple-300">|</span>
                  <a
                    href="https://newsapi.org/register"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-600 hover:text-purple-800 underline"
                  >
                    Get NewsAPI Key (Free tier: 100 requests/day)
                  </a>
                </div>
              </div>
              <PolicyDiscovery
                openStatesApiKey={openStatesKey}
                newsApiKey={newsApiKey}
                onImportPolicy={handleImportSinglePolicy}
                existingPolicyTitles={existingPolicyTitles}
              />
            </div>
          </CollapsibleSection>

          {/* ========== ANALYSIS & CONNECTIONS SECTION GROUP ========== */}
          <div className="mt-10 mb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Analysis & Connections</h2>
                <p className="text-sm text-gray-600">Browse data, create connections between research and policies, and view state rankings</p>
              </div>
            </div>
          </div>

          {/* Section 4: Policy Browser */}
          <CollapsibleSection
            title="Policy Browser"
            badge={filteredPolicies.length}
          >
            <PolicyBrowser
              policies={filteredPolicies}
              filters={policyFilters}
              onFiltersChange={setPolicyFilters}
              onPolicySelect={setSelectedPolicy}
              selectedPolicyId={selectedPolicy?.policyId}
            />
          </CollapsibleSection>

          {/* Section 5: Create Connection */}
          <CollapsibleSection title="Create Policy-Research Connection">
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Select Research Paper</h4>
                  <input
                    type="text"
                    placeholder="Search papers by title or author..."
                    value={paperSearchQuery}
                    onChange={(e) => setPaperSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 mb-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {papers.length === 0 ? (
                      <p className="text-gray-500 text-sm py-4">
                        No saved papers yet. Upload and save a paper in the Research Paper Analysis section above.
                      </p>
                    ) : (
                      (() => {
                        const filteredPapers = papers.filter(paper => {
                          if (!paperSearchQuery.trim()) return true
                          const query = paperSearchQuery.toLowerCase()
                          return (
                            paper.title.toLowerCase().includes(query) ||
                            paper.firstAuthor?.toLowerCase().includes(query) ||
                            paper.allAuthors?.toLowerCase().includes(query)
                          )
                        })

                        if (filteredPapers.length === 0) {
                          return (
                            <p className="text-gray-500 text-sm py-4">
                              No papers match "{paperSearchQuery}"
                            </p>
                          )
                        }

                        return filteredPapers.slice(0, 20).map(paper => (
                          <ResearchPaperCard
                            key={paper.id}
                            paper={paper}
                            showActions={true}
                            isSelected={selectedPaper?.id === paper.id}
                            onSelect={() => {
                              setSelectedPaper(paper)
                              setConnectionSuggestions([])
                              setSuggestionError(null)
                            }}
                            onDelete={async (p) => {
                              if (confirm(`Delete "${p.title}"?`)) {
                                await deletePaper(p.id)
                                if (selectedPaper?.id === p.id) {
                                  setSelectedPaper(null)
                                }
                              }
                            }}
                          />
                        ))
                      })()
                    )}
                  </div>
                  {papers.length > 0 && (
                    <p className="text-xs text-gray-500 mt-2">
                      {paperSearchQuery ? `Showing filtered results` : `${papers.length} paper${papers.length !== 1 ? 's' : ''} total`}
                    </p>
                  )}

                  {/* Find Connections Button */}
                  {selectedPaper && policies.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <Button
                        onClick={handleFindConnections}
                        isLoading={isFindingConnections}
                        disabled={!apiKeys?.openaiKey || isFindingConnections}
                        size="small"
                      >
                        {isFindingConnections ? 'Finding...' : '✨ Find Matching Policies'}
                      </Button>
                      {!apiKeys?.openaiKey && (
                        <p className="text-xs text-amber-600 mt-1">OpenAI API key required</p>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-medium mb-2">Select Policy</h4>
                  {selectedPolicy ? (
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="font-medium">{selectedPolicy.title}</p>
                      <p className="text-sm text-gray-600">{selectedPolicy.jurisdiction}</p>
                      <Button
                        size="small"
                        variant="ghost"
                        onClick={() => setSelectedPolicy(null)}
                        className="mt-2"
                      >
                        Change
                      </Button>
                    </div>
                  ) : (
                    <p className="text-gray-500">Select a policy from the Policy Browser above, or use "Find Matching Policies"</p>
                  )}
                </div>
              </div>

              {/* AI Suggestions */}
              {suggestionError && (
                <StatusMessage
                  type="error"
                  message={suggestionError}
                  onDismiss={() => setSuggestionError(null)}
                />
              )}

              {connectionSuggestions.length > 0 && (
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-5 border border-purple-100">
                  <h4 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    AI-Suggested Connections
                  </h4>
                  <p className="text-sm text-purple-700 mb-4">
                    Based on "{selectedPaper?.title}", these policies may be relevant:
                  </p>
                  <div className="space-y-3">
                    {connectionSuggestions.map((suggestion, idx) => (
                      <div
                        key={suggestion.policyId}
                        className="bg-white rounded-lg p-4 border border-purple-200 hover:border-purple-400 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-purple-600">#{idx + 1}</span>
                              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                suggestion.connectionType === 'POSITIVE' ? 'bg-green-100 text-green-700' :
                                suggestion.connectionType === 'NEGATIVE' ? 'bg-red-100 text-red-700' :
                                suggestion.connectionType === 'MIXED' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {suggestion.connectionType}
                              </span>
                              <span className="text-xs text-gray-500">
                                Confidence: {suggestion.confidence}/10
                              </span>
                            </div>
                            <h5 className="font-medium text-gray-900 truncate" title={suggestion.policyTitle}>
                              {suggestion.policyTitle}
                            </h5>
                            <p className="text-sm text-gray-600 mt-1">{suggestion.reasoning}</p>
                            {suggestion.keyOverlap.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {suggestion.keyOverlap.map(keyword => (
                                  <span key={keyword} className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded">
                                    {keyword}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <Button
                            size="small"
                            onClick={() => handleApplySuggestion(suggestion)}
                          >
                            Use
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    size="small"
                    onClick={() => setConnectionSuggestions([])}
                    className="mt-3"
                  >
                    Clear Suggestions
                  </Button>
                </div>
              )}

              {selectedPaper && selectedPolicy && (
                <>
                  <PolicyConnectionRating
                    rating={connectionRating}
                    connectionType={connectionType}
                    onChange={(rating, type) => {
                      setConnectionRating(rating)
                      setConnectionType(type)
                    }}
                  />
                  <Button onClick={handleCreateConnection}>
                    Create Connection
                  </Button>
                </>
              )}
            </div>
          </CollapsibleSection>

          {/* Section 6: State Rankings */}
          <CollapsibleSection
            title="State Workforce Rankings"
            badge={sortedRankings.length}
          >
            <div className="space-y-4">
              <div className="flex gap-4">
                <Button onClick={() => calculateRankings()}>
                  Calculate from Data
                </Button>
                <Button variant="secondary" onClick={useMockData}>
                  Load Demo Data
                </Button>
              </div>

              <StateRankings
                rankings={sortedRankings}
                isLoading={isLoadingRankings}
                onStateSelect={setSelectedState}
                selectedState={selectedState || undefined}
              />
            </div>
          </CollapsibleSection>
        </main>

        {/* Footer */}
        <footer className="bg-gray-800 mt-16 py-8">
          <div className="max-w-7xl mx-auto px-6 text-center text-gray-400 text-sm">
            <p className="font-medium text-gray-300">Physician Workforce Research Analyzer</p>
            <p className="mt-1">Open Source Healthcare Policy Research Tool</p>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  )
}

export default App
