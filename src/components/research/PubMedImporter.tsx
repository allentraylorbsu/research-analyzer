/**
 * PubMedImporter Component
 * Search PubMed and import research papers into the database
 */

import { useState, useCallback } from 'react'
import { Button, LoadingSpinner } from '../common'
import { usePubMed } from '@/hooks'
import { SUGGESTED_SEARCHES, PubMedSearchResult } from '@/services/pubmed'
import type { ResearchPaperInput, ResearchCategory } from '@/types'

export interface PubMedImporterProps {
  onImport: (papers: ResearchPaperInput[]) => Promise<void>
  existingPmids?: string[]
}

export function PubMedImporter({ onImport, existingPmids = [] }: PubMedImporterProps) {
  const {
    results,
    totalCount,
    isLoading,
    error,
    query,
    page,
    search,
    nextPage,
    prevPage
  } = usePubMed()

  const [searchInput, setSearchInput] = useState('')
  const [selectedPapers, setSelectedPapers] = useState<Set<string>>(new Set())
  const [isImporting, setIsImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [importSuccess, setImportSuccess] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'relevance' | 'date'>('relevance')
  const [expandedAbstract, setExpandedAbstract] = useState<string | null>(null)

  const handleSearch = useCallback(async (customQuery?: string) => {
    const queryToUse = customQuery || searchInput
    if (!queryToUse.trim()) return

    setSelectedPapers(new Set())
    setImportError(null)
    setImportSuccess(null)
    await search(queryToUse, { sortBy })
  }, [searchInput, sortBy, search])

  const handleSuggestedSearch = useCallback((suggestedQuery: string) => {
    setSearchInput(suggestedQuery)
    handleSearch(suggestedQuery)
  }, [handleSearch])

  const togglePaperSelection = useCallback((pmid: string) => {
    setSelectedPapers(prev => {
      const newSet = new Set(prev)
      if (newSet.has(pmid)) {
        newSet.delete(pmid)
      } else {
        newSet.add(pmid)
      }
      return newSet
    })
  }, [])

  const selectAll = useCallback(() => {
    const selectablePmids = results
      .filter(r => !existingPmids.includes(r.pmid))
      .map(r => r.pmid)
    setSelectedPapers(new Set(selectablePmids))
  }, [results, existingPmids])

  const deselectAll = useCallback(() => {
    setSelectedPapers(new Set())
  }, [])

  const handleImport = useCallback(async () => {
    if (selectedPapers.size === 0) return

    setIsImporting(true)
    setImportError(null)
    setImportSuccess(null)

    try {
      const papersToImport: ResearchPaperInput[] = results
        .filter(r => selectedPapers.has(r.pmid))
        .map(paper => ({
          title: paper.title,
          firstAuthor: paper.authors[0] || undefined,
          allAuthors: paper.authors.length > 0 ? paper.authors.join(', ') : undefined,
          journal: paper.journal || undefined,
          publicationYear: paper.publicationYear || undefined,
          abstract: paper.abstract || undefined,
          doi: paper.doi || undefined,
          pmid: paper.pmid,
          researchText: paper.abstract || 'No abstract available',
          categories: inferCategories(paper),
          sourceUrl: `https://pubmed.ncbi.nlm.nih.gov/${paper.pmid}/`
        }))

      await onImport(papersToImport)

      setImportSuccess(`Successfully imported ${papersToImport.length} paper${papersToImport.length !== 1 ? 's' : ''}`)
      setSelectedPapers(new Set())
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Import failed'
      setImportError(message)
    } finally {
      setIsImporting(false)
    }
  }, [selectedPapers, results, onImport])

  const totalPages = Math.ceil(totalCount / 20)
  const hasResults = results.length > 0

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <div className="space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search PubMed for research papers..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'relevance' | 'date')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="relevance">Relevance</option>
            <option value="date">Date</option>
          </select>
          <Button
            onClick={() => handleSearch()}
            isLoading={isLoading}
            disabled={!searchInput.trim() || isLoading}
          >
            Search
          </Button>
        </div>

        {/* Suggested Searches */}
        <div>
          <p className="text-sm text-gray-600 mb-2">Suggested searches for workforce research:</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_SEARCHES.map(({ label, query: suggestedQuery }) => (
              <button
                key={label}
                onClick={() => handleSuggestedSearch(suggestedQuery)}
                className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition-colors"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {importError && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
          {importError}
        </div>
      )}

      {importSuccess && (
        <div className="p-4 bg-green-50 text-green-700 rounded-lg border border-green-200">
          {importSuccess}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center py-8">
          <LoadingSpinner size="large" text="Searching PubMed..." />
        </div>
      )}

      {/* Results */}
      {hasResults && !isLoading && (
        <div className="space-y-4">
          {/* Results Header */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                Showing {(page - 1) * 20 + 1}-{Math.min(page * 20, totalCount)} of {totalCount.toLocaleString()} results
                for "<span className="font-medium">{query}</span>"
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {selectedPapers.size} selected
              </span>
              <Button size="small" variant="ghost" onClick={selectAll}>
                Select All
              </Button>
              <Button size="small" variant="ghost" onClick={deselectAll}>
                Deselect All
              </Button>
            </div>
          </div>

          {/* Import Button */}
          {selectedPapers.size > 0 && (
            <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex-1">
                <p className="font-medium text-blue-900">
                  {selectedPapers.size} paper{selectedPapers.size !== 1 ? 's' : ''} selected
                </p>
                <p className="text-sm text-blue-700">
                  Import to your database to analyze and connect to policies
                </p>
              </div>
              <Button
                onClick={handleImport}
                isLoading={isImporting}
                disabled={isImporting}
              >
                Import Selected
              </Button>
            </div>
          )}

          {/* Results List */}
          <div className="space-y-3">
            {results.map(paper => {
              const isSelected = selectedPapers.has(paper.pmid)
              const alreadyImported = existingPmids.includes(paper.pmid)
              const isExpanded = expandedAbstract === paper.pmid

              return (
                <div
                  key={paper.pmid}
                  className={`
                    border rounded-lg p-4 transition-all
                    ${alreadyImported
                      ? 'border-gray-200 bg-gray-50 opacity-60'
                      : isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }
                  `}
                >
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <div className="pt-1">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={alreadyImported}
                        onChange={() => togglePaperSelection(paper.pmid)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900">
                        {paper.title}
                      </h4>

                      <p className="text-sm text-gray-600 mt-1">
                        {paper.authors.slice(0, 3).join(', ')}
                        {paper.authors.length > 3 && ` et al.`}
                      </p>

                      <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                        {paper.journal && <span>{paper.journal}</span>}
                        {paper.publicationYear && <span>{paper.publicationYear}</span>}
                        <a
                          href={`https://pubmed.ncbi.nlm.nih.gov/${paper.pmid}/`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          PMID: {paper.pmid}
                        </a>
                      </div>

                      {/* Abstract */}
                      {paper.abstract && (
                        <div className="mt-3">
                          <p className={`text-sm text-gray-600 ${isExpanded ? '' : 'line-clamp-3'}`}>
                            {paper.abstract}
                          </p>
                          <button
                            onClick={() => setExpandedAbstract(isExpanded ? null : paper.pmid)}
                            className="text-sm text-blue-600 hover:underline mt-1"
                          >
                            {isExpanded ? 'Show less' : 'Show more'}
                          </button>
                        </div>
                      )}

                      {/* MeSH Terms */}
                      {paper.meshTerms.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {paper.meshTerms.slice(0, 5).map(term => (
                            <span
                              key={term}
                              className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
                            >
                              {term}
                            </span>
                          ))}
                          {paper.meshTerms.length > 5 && (
                            <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-500 rounded">
                              +{paper.meshTerms.length - 5} more
                            </span>
                          )}
                        </div>
                      )}

                      {alreadyImported && (
                        <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Already imported
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4">
              <Button
                size="small"
                variant="secondary"
                onClick={prevPage}
                disabled={page === 1 || isLoading}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </span>
              <Button
                size="small"
                variant="secondary"
                onClick={nextPage}
                disabled={page >= totalPages || isLoading}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!hasResults && !isLoading && !error && (
        <div className="text-center py-12 text-gray-500">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <p className="text-lg font-medium">Search PubMed for Research Papers</p>
          <p className="mt-2">Enter a search query or use one of the suggested searches above</p>
        </div>
      )}
    </div>
  )
}

/**
 * Infer research categories from PubMed paper metadata
 */
function inferCategories(paper: PubMedSearchResult): ResearchCategory[] {
  const categories: ResearchCategory[] = []
  const textToSearch = `${paper.title} ${paper.abstract} ${paper.meshTerms.join(' ')} ${paper.keywords.join(' ')}`.toLowerCase()

  const categoryKeywords: Record<ResearchCategory, string[]> = {
    'Healthcare Workforce': ['workforce', 'physician supply', 'healthcare workers', 'staffing'],
    'Rural Health': ['rural', 'underserved', 'remote area', 'medically underserved'],
    'Primary Care': ['primary care', 'family medicine', 'general practice', 'family physician'],
    'Specialty Care': ['specialist', 'specialty', 'subspecialty'],
    'Mental Health': ['mental health', 'psychiatry', 'behavioral health', 'psychological'],
    'Public Health': ['public health', 'population health', 'community health', 'epidemiology'],
    'Health Policy': ['health policy', 'healthcare policy', 'legislation', 'regulation'],
    'Medical Education': ['medical education', 'residency', 'graduate medical', 'training program'],
    'Telemedicine': ['telemedicine', 'telehealth', 'remote care', 'virtual care'],
    'Healthcare Access': ['access to care', 'healthcare access', 'availability', 'barriers'],
    'Healthcare Quality': ['quality of care', 'patient outcomes', 'quality improvement', 'patient safety'],
    'Healthcare Economics': ['healthcare costs', 'economics', 'reimbursement', 'payment'],
    'Physician Burnout': ['burnout', 'wellness', 'stress', 'job satisfaction', 'work-life'],
    'Healthcare Delivery': ['care delivery', 'healthcare delivery', 'care model', 'integrated care'],
    'Population Health': ['population health', 'health disparities', 'social determinants'],
    'Health Disparities': ['disparities', 'inequities', 'minority', 'underrepresented'],
    'Preventive Care': ['preventive', 'prevention', 'screening', 'immunization'],
    'Chronic Disease Management': ['chronic disease', 'diabetes', 'hypertension', 'chronic care'],
    'Emergency Medicine': ['emergency', 'urgent care', 'emergency department', 'trauma'],
    'Pediatric Healthcare': ['pediatric', 'children', 'child health', 'adolescent']
  }

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(kw => textToSearch.includes(kw))) {
      categories.push(category as ResearchCategory)
    }
  }

  // Always include Healthcare Workforce for papers found with workforce queries
  if (!categories.includes('Healthcare Workforce')) {
    categories.unshift('Healthcare Workforce')
  }

  // Limit to 5 categories
  return categories.slice(0, 5)
}

export default PubMedImporter
