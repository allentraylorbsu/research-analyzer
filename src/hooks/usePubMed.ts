/**
 * usePubMed Hook
 * Manages PubMed search state and operations
 */

import { useState, useCallback } from 'react'
import { searchPubMed, PubMedSearchResult, PubMedSearchResponse } from '@/services/pubmed'

interface UsePubMedReturn {
  results: PubMedSearchResult[]
  totalCount: number
  isLoading: boolean
  error: string | null
  query: string
  page: number
  search: (query: string, options?: { page?: number; sortBy?: 'relevance' | 'date' }) => Promise<void>
  nextPage: () => Promise<void>
  prevPage: () => Promise<void>
  clearResults: () => void
}

export function usePubMed(): UsePubMedReturn {
  const [results, setResults] = useState<PubMedSearchResult[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState<'relevance' | 'date'>('relevance')

  const search = useCallback(async (
    searchQuery: string,
    options: { page?: number; sortBy?: 'relevance' | 'date' } = {}
  ) => {
    const searchPage = options.page || 1
    const searchSort = options.sortBy || sortBy

    setIsLoading(true)
    setError(null)
    setQuery(searchQuery)
    setPage(searchPage)
    setSortBy(searchSort)

    try {
      const response: PubMedSearchResponse = await searchPubMed(searchQuery, {
        maxResults: 20,
        page: searchPage,
        sortBy: searchSort
      })

      setResults(response.results)
      setTotalCount(response.totalCount)

      if (response.results.length === 0 && searchPage === 1) {
        setError('No results found. Try different search terms.')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Search failed'
      setError(message)
      setResults([])
      setTotalCount(0)
    } finally {
      setIsLoading(false)
    }
  }, [sortBy])

  const nextPage = useCallback(async () => {
    if (query && (page * 20) < totalCount) {
      await search(query, { page: page + 1, sortBy })
    }
  }, [query, page, totalCount, sortBy, search])

  const prevPage = useCallback(async () => {
    if (query && page > 1) {
      await search(query, { page: page - 1, sortBy })
    }
  }, [query, page, sortBy, search])

  const clearResults = useCallback(() => {
    setResults([])
    setTotalCount(0)
    setQuery('')
    setPage(1)
    setError(null)
  }, [])

  return {
    results,
    totalCount,
    isLoading,
    error,
    query,
    page,
    search,
    nextPage,
    prevPage,
    clearResults
  }
}

export default usePubMed
