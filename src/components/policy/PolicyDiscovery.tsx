/**
 * PolicyDiscovery Component
 * Discover healthcare workforce policies using Open States, NewsAPI, and GDELT
 */

import { useState, useCallback } from 'react'
import { Button, LoadingSpinner } from '../common'
import {
  searchOpenStates,
  searchNews,
  searchGdelt,
  SUGGESTED_LEGISLATION_SEARCHES,
  SUGGESTED_NEWS_SEARCHES,
  SUGGESTED_GDELT_SEARCHES,
  GDELT_DATE_RANGES,
  HEALTH_POLICY_DOMAINS,
  getStateName,
  getDateFromDaysAgo
} from '@/services'
import type { OpenStatesBill } from '@/services/openstates'
import type { NewsArticle } from '@/services/newsapi'
import type { GdeltArticle } from '@/services/gdelt'
import type { PolicyInput } from '@/types'

export interface PolicyDiscoveryProps {
  openStatesApiKey: string
  newsApiKey: string
  onImportPolicy: (policy: PolicyInput) => Promise<void>
  existingPolicyTitles?: string[]
}

type TabType = 'legislation' | 'news' | 'historical'

interface LegislationResults {
  bills: OpenStatesBill[]
  totalCount: number
  page: number
  maxPage: number
}

interface NewsResults {
  articles: NewsArticle[]
  totalCount: number
  page: number
}

interface GdeltResults {
  articles: GdeltArticle[]
  totalCount: number
}

const US_STATES = [
  { abbrev: '', name: 'All States' },
  { abbrev: 'AL', name: 'Alabama' }, { abbrev: 'AK', name: 'Alaska' },
  { abbrev: 'AZ', name: 'Arizona' }, { abbrev: 'AR', name: 'Arkansas' },
  { abbrev: 'CA', name: 'California' }, { abbrev: 'CO', name: 'Colorado' },
  { abbrev: 'CT', name: 'Connecticut' }, { abbrev: 'DE', name: 'Delaware' },
  { abbrev: 'FL', name: 'Florida' }, { abbrev: 'GA', name: 'Georgia' },
  { abbrev: 'HI', name: 'Hawaii' }, { abbrev: 'ID', name: 'Idaho' },
  { abbrev: 'IL', name: 'Illinois' }, { abbrev: 'IN', name: 'Indiana' },
  { abbrev: 'IA', name: 'Iowa' }, { abbrev: 'KS', name: 'Kansas' },
  { abbrev: 'KY', name: 'Kentucky' }, { abbrev: 'LA', name: 'Louisiana' },
  { abbrev: 'ME', name: 'Maine' }, { abbrev: 'MD', name: 'Maryland' },
  { abbrev: 'MA', name: 'Massachusetts' }, { abbrev: 'MI', name: 'Michigan' },
  { abbrev: 'MN', name: 'Minnesota' }, { abbrev: 'MS', name: 'Mississippi' },
  { abbrev: 'MO', name: 'Missouri' }, { abbrev: 'MT', name: 'Montana' },
  { abbrev: 'NE', name: 'Nebraska' }, { abbrev: 'NV', name: 'Nevada' },
  { abbrev: 'NH', name: 'New Hampshire' }, { abbrev: 'NJ', name: 'New Jersey' },
  { abbrev: 'NM', name: 'New Mexico' }, { abbrev: 'NY', name: 'New York' },
  { abbrev: 'NC', name: 'North Carolina' }, { abbrev: 'ND', name: 'North Dakota' },
  { abbrev: 'OH', name: 'Ohio' }, { abbrev: 'OK', name: 'Oklahoma' },
  { abbrev: 'OR', name: 'Oregon' }, { abbrev: 'PA', name: 'Pennsylvania' },
  { abbrev: 'RI', name: 'Rhode Island' }, { abbrev: 'SC', name: 'South Carolina' },
  { abbrev: 'SD', name: 'South Dakota' }, { abbrev: 'TN', name: 'Tennessee' },
  { abbrev: 'TX', name: 'Texas' }, { abbrev: 'UT', name: 'Utah' },
  { abbrev: 'VT', name: 'Vermont' }, { abbrev: 'VA', name: 'Virginia' },
  { abbrev: 'WA', name: 'Washington' }, { abbrev: 'WV', name: 'West Virginia' },
  { abbrev: 'WI', name: 'Wisconsin' }, { abbrev: 'WY', name: 'Wyoming' },
  { abbrev: 'DC', name: 'District of Columbia' }
]

export function PolicyDiscovery({
  openStatesApiKey,
  newsApiKey,
  onImportPolicy,
  existingPolicyTitles = []
}: PolicyDiscoveryProps) {
  const [activeTab, setActiveTab] = useState<TabType>('legislation')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedState, setSelectedState] = useState('')
  const [dateRange, setDateRange] = useState('30') // days

  // Legislation search state
  const [legislationResults, setLegislationResults] = useState<LegislationResults | null>(null)
  const [isSearchingLegislation, setIsSearchingLegislation] = useState(false)
  const [legislationError, setLegislationError] = useState<string | null>(null)

  // News search state
  const [newsResults, setNewsResults] = useState<NewsResults | null>(null)
  const [isSearchingNews, setIsSearchingNews] = useState(false)
  const [newsError, setNewsError] = useState<string | null>(null)

  // GDELT search state (historical)
  const [gdeltResults, setGdeltResults] = useState<GdeltResults | null>(null)
  const [isSearchingGdelt, setIsSearchingGdelt] = useState(false)
  const [gdeltError, setGdeltError] = useState<string | null>(null)
  const [gdeltDateRange, setGdeltDateRange] = useState('365') // days - default 1 year
  const [gdeltDomain, setGdeltDomain] = useState('') // empty = all sources

  // Import state
  const [importingId, setImportingId] = useState<string | null>(null)
  const [importSuccess, setImportSuccess] = useState<string | null>(null)
  const [importError, setImportError] = useState<string | null>(null)

  const searchLegislation = useCallback(async (query: string, state?: string, page = 1) => {
    if (!openStatesApiKey) {
      setLegislationError('Open States API key is required')
      return
    }

    if (!query.trim()) {
      setLegislationError('Please enter a search query')
      return
    }

    setIsSearchingLegislation(true)
    setLegislationError(null)

    try {
      const result = await searchOpenStates(openStatesApiKey, {
        query,
        state: state || undefined,
        perPage: 20,
        page
      })

      setLegislationResults({
        bills: result.results,
        totalCount: result.pagination.totalItems,
        page: result.pagination.page,
        maxPage: result.pagination.maxPage
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Search failed'
      setLegislationError(message)
      setLegislationResults(null)
    } finally {
      setIsSearchingLegislation(false)
    }
  }, [openStatesApiKey])

  const searchNewsArticles = useCallback(async (query: string, page = 1) => {
    if (!newsApiKey) {
      setNewsError('NewsAPI key is required')
      return
    }

    if (!query.trim()) {
      setNewsError('Please enter a search query')
      return
    }

    setIsSearchingNews(true)
    setNewsError(null)

    try {
      const fromDate = getDateFromDaysAgo(parseInt(dateRange))

      const result = await searchNews(newsApiKey, {
        query,
        from: fromDate,
        sortBy: 'relevancy',
        pageSize: 20,
        page
      })

      setNewsResults({
        articles: result.articles,
        totalCount: result.totalResults,
        page
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Search failed'
      setNewsError(message)
      setNewsResults(null)
    } finally {
      setIsSearchingNews(false)
    }
  }, [newsApiKey, dateRange])

  const searchGdeltArticles = useCallback(async (query: string) => {
    if (!query.trim()) {
      setGdeltError('Please enter a search query')
      return
    }

    setIsSearchingGdelt(true)
    setGdeltError(null)

    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - parseInt(gdeltDateRange))

      const result = await searchGdelt({
        query,
        startDate,
        endDate: new Date(),
        maxRecords: 75,
        language: 'english',
        domain: gdeltDomain || undefined
      })

      setGdeltResults({
        articles: result.articles,
        totalCount: result.totalResults
      })

      if (result.articles.length === 0) {
        setGdeltError('No articles found. Try different search terms or a longer date range.')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Search failed'
      setGdeltError(message)
      setGdeltResults(null)
    } finally {
      setIsSearchingGdelt(false)
    }
  }, [gdeltDateRange, gdeltDomain])

  const handleSearch = useCallback(() => {
    if (activeTab === 'legislation') {
      searchLegislation(searchQuery, selectedState)
    } else if (activeTab === 'news') {
      searchNewsArticles(searchQuery)
    } else {
      searchGdeltArticles(searchQuery)
    }
  }, [activeTab, searchQuery, selectedState, searchLegislation, searchNewsArticles, searchGdeltArticles])

  const handleSuggestedSearch = useCallback((query: string) => {
    setSearchQuery(query)
    if (activeTab === 'legislation') {
      searchLegislation(query, selectedState)
    } else if (activeTab === 'news') {
      searchNewsArticles(query)
    } else {
      searchGdeltArticles(query)
    }
  }, [activeTab, selectedState, searchLegislation, searchNewsArticles, searchGdeltArticles])

  const importBillAsPolicy = useCallback(async (bill: OpenStatesBill) => {
    setImportingId(bill.id)
    setImportError(null)
    setImportSuccess(null)

    try {
      const policy: PolicyInput = {
        title: bill.title,
        description: bill.description || `${bill.identifier} - ${bill.title}`,
        jurisdiction: bill.jurisdiction.name || getStateName(bill.jurisdiction.id.split(':')[2]?.split('/')[0] || ''),
        policyType: bill.classification.includes('resolution') ? 'resolution' : 'legislation',
        status: bill.latestAction?.description?.toLowerCase().includes('enacted') ||
                bill.latestAction?.description?.toLowerCase().includes('signed')
          ? 'enacted'
          : bill.latestAction?.description?.toLowerCase().includes('passed')
            ? 'passed'
            : 'introduced',
        billNumber: bill.identifier,
        session: bill.session,
        sourceUrl: bill.openstatesUrl
      }

      await onImportPolicy(policy)
      setImportSuccess(`Imported: ${bill.identifier}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Import failed'
      setImportError(message)
    } finally {
      setImportingId(null)
    }
  }, [onImportPolicy])

  const importNewsAsPolicy = useCallback(async (article: NewsArticle) => {
    setImportingId(article.id)
    setImportError(null)
    setImportSuccess(null)

    try {
      const policy: PolicyInput = {
        title: article.title,
        description: article.description || article.content || '',
        jurisdiction: 'Federal', // Default, user can edit
        policyType: 'news_coverage',
        status: 'tracking',
        sourceUrl: article.url
      }

      await onImportPolicy(policy)
      setImportSuccess(`Imported: ${article.title.substring(0, 50)}...`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Import failed'
      setImportError(message)
    } finally {
      setImportingId(null)
    }
  }, [onImportPolicy])

  const importGdeltAsPolicy = useCallback(async (article: GdeltArticle) => {
    setImportingId(article.id)
    setImportError(null)
    setImportSuccess(null)

    try {
      const policy: PolicyInput = {
        title: article.title,
        description: `Source: ${article.domain} | Published: ${new Date(article.seenDate).toLocaleDateString()}`,
        jurisdiction: 'Federal', // Default, user can edit
        policyType: 'news_coverage',
        status: 'tracking',
        sourceUrl: article.url
      }

      await onImportPolicy(policy)
      setImportSuccess(`Imported: ${article.title.substring(0, 50)}...`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Import failed'
      setImportError(message)
    } finally {
      setImportingId(null)
    }
  }, [onImportPolicy])

  const isAlreadyImported = useCallback((title: string) => {
    return existingPolicyTitles.some(t =>
      t.toLowerCase().trim() === title.toLowerCase().trim()
    )
  }, [existingPolicyTitles])

  const hasApiKeys = openStatesApiKey && newsApiKey

  return (
    <div className="space-y-6">
      {/* API Key Warning */}
      {!hasApiKeys && (
        <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg border border-yellow-200">
          <p className="font-medium">API Keys Required</p>
          <p className="text-sm mt-1">
            {!openStatesApiKey && 'Open States API key is missing. '}
            {!newsApiKey && 'NewsAPI key is missing. '}
            Please configure API keys in settings.
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab('legislation')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'legislation'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            State Legislation (Open States)
          </button>
          <button
            onClick={() => setActiveTab('news')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'news'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            News Articles (NewsAPI)
          </button>
          <button
            onClick={() => setActiveTab('historical')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'historical'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Historical News (GDELT - Free)
          </button>
        </nav>
      </div>

      {/* Search Controls */}
      <div className="space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={activeTab === 'legislation'
              ? "Search state legislation..."
              : activeTab === 'news'
                ? "Search recent news (last 30 days)..."
                : "Search historical news (up to 5 years)..."
            }
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />

          {activeTab === 'legislation' && (
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {US_STATES.map(state => (
                <option key={state.abbrev} value={state.abbrev}>
                  {state.name}
                </option>
              ))}
            </select>
          )}

          {activeTab === 'news' && (
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
          )}

          {activeTab === 'historical' && (
            <>
              <select
                value={gdeltDateRange}
                onChange={(e) => setGdeltDateRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {GDELT_DATE_RANGES.map(range => (
                  <option key={range.days} value={String(range.days)}>
                    {range.label}
                  </option>
                ))}
              </select>
              <select
                value={gdeltDomain}
                onChange={(e) => setGdeltDomain(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 max-w-[200px]"
              >
                <optgroup label="All Sources">
                  <option value="">All Sources</option>
                </optgroup>
                <optgroup label="Health Policy Research">
                  {HEALTH_POLICY_DOMAINS.filter(d => d.category === 'research').map(d => (
                    <option key={d.domain} value={d.domain}>{d.label}</option>
                  ))}
                </optgroup>
                <optgroup label="Healthcare Industry">
                  {HEALTH_POLICY_DOMAINS.filter(d => d.category === 'industry').map(d => (
                    <option key={d.domain} value={d.domain}>{d.label}</option>
                  ))}
                </optgroup>
                <optgroup label="Major News">
                  {HEALTH_POLICY_DOMAINS.filter(d => d.category === 'news').map(d => (
                    <option key={d.domain} value={d.domain}>{d.label}</option>
                  ))}
                </optgroup>
              </select>
            </>
          )}

          <Button
            onClick={handleSearch}
            isLoading={isSearchingLegislation || isSearchingNews || isSearchingGdelt}
            disabled={!searchQuery.trim() || (activeTab === 'legislation' && !openStatesApiKey) || (activeTab === 'news' && !newsApiKey)}
          >
            Search
          </Button>
        </div>

        {/* Suggested Searches */}
        <div>
          <p className="text-sm text-gray-600 mb-2">
            {activeTab === 'legislation'
              ? 'Suggested legislation searches:'
              : activeTab === 'news'
                ? 'Suggested news searches:'
                : 'Suggested historical searches:'
            }
          </p>
          <div className="flex flex-wrap gap-2">
            {activeTab === 'legislation'
              ? SUGGESTED_LEGISLATION_SEARCHES.map(({ label, query }) => (
                  <button
                    key={label}
                    onClick={() => handleSuggestedSearch(query)}
                    disabled={!openStatesApiKey}
                    className="px-3 py-1.5 text-sm bg-purple-50 text-purple-700 rounded-full hover:bg-purple-100 transition-colors disabled:opacity-50"
                  >
                    {label}
                  </button>
                ))
              : activeTab === 'news'
                ? SUGGESTED_NEWS_SEARCHES.slice(0, 6).map(({ label, query }) => (
                    <button
                      key={label}
                      onClick={() => handleSuggestedSearch(query)}
                      disabled={!newsApiKey}
                      className="px-3 py-1.5 text-sm bg-green-50 text-green-700 rounded-full hover:bg-green-100 transition-colors disabled:opacity-50"
                    >
                      {label}
                    </button>
                  ))
                : SUGGESTED_GDELT_SEARCHES.slice(0, 6).map(({ label, query }) => (
                    <button
                      key={label}
                      onClick={() => handleSuggestedSearch(query)}
                      className="px-3 py-1.5 text-sm bg-amber-50 text-amber-700 rounded-full hover:bg-amber-100 transition-colors"
                    >
                      {label}
                    </button>
                  ))
            }
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {importSuccess && (
        <div className="p-3 bg-green-50 text-green-700 rounded-lg border border-green-200">
          {importSuccess}
        </div>
      )}

      {importError && (
        <div className="p-3 bg-red-50 text-red-700 rounded-lg border border-red-200">
          {importError}
        </div>
      )}

      {/* Legislation Results */}
      {activeTab === 'legislation' && (
        <>
          {legislationError && (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
              {legislationError}
            </div>
          )}

          {isSearchingLegislation && (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="large" text="Searching Open States..." />
            </div>
          )}

          {legislationResults && !isSearchingLegislation && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Found {legislationResults.totalCount.toLocaleString()} bills
                {selectedState && ` in ${getStateName(selectedState)}`}
              </p>

              <div className="space-y-3">
                {legislationResults.bills.map(bill => {
                  const alreadyImported = isAlreadyImported(bill.title)
                  const isImporting = importingId === bill.id

                  return (
                    <div
                      key={bill.id}
                      className={`border rounded-lg p-4 ${
                        alreadyImported ? 'bg-gray-50 opacity-60' : 'bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded">
                              {bill.identifier}
                            </span>
                            <span className="text-sm text-gray-500">
                              {bill.jurisdiction.name}
                            </span>
                          </div>

                          <h4 className="font-medium text-gray-900 line-clamp-2">
                            {bill.title}
                          </h4>

                          {bill.latestAction && (
                            <p className="text-sm text-gray-600 mt-2">
                              <span className="font-medium">Latest:</span> {bill.latestAction.description}
                              <span className="text-gray-400 ml-2">
                                ({new Date(bill.latestAction.date).toLocaleDateString()})
                              </span>
                            </p>
                          )}

                          {bill.subject.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {bill.subject.slice(0, 3).map(subj => (
                                <span
                                  key={subj}
                                  className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
                                >
                                  {subj}
                                </span>
                              ))}
                            </div>
                          )}

                          <a
                            href={bill.openstatesUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline mt-2 inline-block"
                          >
                            View on Open States
                          </a>
                        </div>

                        <div className="flex-shrink-0">
                          {alreadyImported ? (
                            <span className="text-sm text-green-600 flex items-center gap-1">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Imported
                            </span>
                          ) : (
                            <Button
                              size="small"
                              onClick={() => importBillAsPolicy(bill)}
                              isLoading={isImporting}
                              disabled={isImporting}
                            >
                              Import
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Pagination */}
              {legislationResults.maxPage > 1 && (
                <div className="flex items-center justify-center gap-4">
                  <Button
                    size="small"
                    variant="secondary"
                    onClick={() => searchLegislation(searchQuery, selectedState, legislationResults.page - 1)}
                    disabled={legislationResults.page === 1 || isSearchingLegislation}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {legislationResults.page} of {legislationResults.maxPage}
                  </span>
                  <Button
                    size="small"
                    variant="secondary"
                    onClick={() => searchLegislation(searchQuery, selectedState, legislationResults.page + 1)}
                    disabled={legislationResults.page >= legislationResults.maxPage || isSearchingLegislation}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}

          {!legislationResults && !isSearchingLegislation && !legislationError && (
            <div className="text-center py-12 text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <p className="text-lg font-medium">Search State Legislation</p>
              <p className="mt-2">Find healthcare workforce bills across all 50 US states</p>
            </div>
          )}
        </>
      )}

      {/* News Results */}
      {activeTab === 'news' && (
        <>
          {newsError && (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
              {newsError}
            </div>
          )}

          {isSearchingNews && (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="large" text="Searching news..." />
            </div>
          )}

          {newsResults && !isSearchingNews && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Found {newsResults.totalCount.toLocaleString()} articles
              </p>

              <div className="space-y-3">
                {newsResults.articles.map(article => {
                  const alreadyImported = isAlreadyImported(article.title)
                  const isImporting = importingId === article.id

                  return (
                    <div
                      key={article.id}
                      className={`border rounded-lg p-4 ${
                        alreadyImported ? 'bg-gray-50 opacity-60' : 'bg-white'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        {article.urlToImage && (
                          <img
                            src={article.urlToImage}
                            alt=""
                            className="w-24 h-24 object-cover rounded flex-shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none'
                            }}
                          />
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-green-700">
                              {article.source.name}
                            </span>
                            <span className="text-sm text-gray-400">
                              {new Date(article.publishedAt).toLocaleDateString()}
                            </span>
                          </div>

                          <h4 className="font-medium text-gray-900 line-clamp-2">
                            {article.title}
                          </h4>

                          {article.description && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {article.description}
                            </p>
                          )}

                          {article.author && (
                            <p className="text-sm text-gray-500 mt-1">
                              By {article.author}
                            </p>
                          )}

                          <a
                            href={article.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline mt-2 inline-block"
                          >
                            Read full article
                          </a>
                        </div>

                        <div className="flex-shrink-0">
                          {alreadyImported ? (
                            <span className="text-sm text-green-600 flex items-center gap-1">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Imported
                            </span>
                          ) : (
                            <Button
                              size="small"
                              onClick={() => importNewsAsPolicy(article)}
                              isLoading={isImporting}
                              disabled={isImporting}
                            >
                              Import
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Pagination */}
              {newsResults.totalCount > 20 && (
                <div className="flex items-center justify-center gap-4">
                  <Button
                    size="small"
                    variant="secondary"
                    onClick={() => searchNewsArticles(searchQuery, newsResults.page - 1)}
                    disabled={newsResults.page === 1 || isSearchingNews}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {newsResults.page}
                  </span>
                  <Button
                    size="small"
                    variant="secondary"
                    onClick={() => searchNewsArticles(searchQuery, newsResults.page + 1)}
                    disabled={isSearchingNews}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}

          {!newsResults && !isSearchingNews && !newsError && (
            <div className="text-center py-12 text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
              <p className="text-lg font-medium">Search Healthcare News</p>
              <p className="mt-2">Find news articles about healthcare workforce policies and impacts</p>
            </div>
          )}
        </>
      )}

      {/* GDELT Historical Results */}
      {activeTab === 'historical' && (
        <>
          <div className="p-3 bg-amber-50 text-amber-800 rounded-lg border border-amber-200 text-sm">
            <span className="font-medium">GDELT Historical News:</span> Search years of archived news articles for free.
            No API key required. Great for researching historical policy impacts.
          </div>

          {gdeltError && (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
              {gdeltError}
            </div>
          )}

          {isSearchingGdelt && (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="large" text="Searching GDELT historical archive..." />
            </div>
          )}

          {gdeltResults && !isSearchingGdelt && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Found {gdeltResults.totalCount} articles from the past {gdeltDateRange} days
                {gdeltDomain && (
                  <span className="ml-1">
                    from <span className="font-medium text-amber-700">{gdeltDomain}</span>
                  </span>
                )}
              </p>

              <div className="space-y-3">
                {gdeltResults.articles.map(article => {
                  const alreadyImported = isAlreadyImported(article.title)
                  const isImporting = importingId === article.id

                  return (
                    <div
                      key={article.id}
                      className={`border rounded-lg p-4 ${
                        alreadyImported ? 'bg-gray-50 opacity-60' : 'bg-white'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        {article.socialImage && (
                          <img
                            src={article.socialImage}
                            alt=""
                            className="w-24 h-24 object-cover rounded flex-shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none'
                            }}
                          />
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-amber-700">
                              {article.domain}
                            </span>
                            <span className="text-sm text-gray-400">
                              {new Date(article.seenDate).toLocaleDateString()}
                            </span>
                          </div>

                          <h4 className="font-medium text-gray-900 line-clamp-2">
                            {article.title}
                          </h4>

                          <a
                            href={article.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline mt-2 inline-block"
                          >
                            Read full article
                          </a>
                        </div>

                        <div className="flex-shrink-0">
                          {alreadyImported ? (
                            <span className="text-sm text-green-600 flex items-center gap-1">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Imported
                            </span>
                          ) : (
                            <Button
                              size="small"
                              onClick={() => importGdeltAsPolicy(article)}
                              isLoading={isImporting}
                              disabled={isImporting}
                            >
                              Import
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {!gdeltResults && !isSearchingGdelt && !gdeltError && (
            <div className="text-center py-12 text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-lg font-medium">Search Historical News</p>
              <p className="mt-2">Search up to 5 years of archived news articles - no API key required!</p>
              <p className="text-sm text-amber-600 mt-1">Powered by GDELT Project</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default PolicyDiscovery
