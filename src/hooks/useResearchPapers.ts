/**
 * useResearchPapers Hook
 * Manages research paper CRUD operations with duplicate detection
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import type { ResearchPaper, ResearchPaperInput, ResearchFilters, DuplicateGroup } from '@/types'
import { researchPaperService, isSupabaseConfigured } from '@/services/supabase'

interface UseResearchPapersReturn {
  papers: ResearchPaper[]
  filteredPapers: ResearchPaper[]
  isLoading: boolean
  error: string | null
  filters: ResearchFilters
  setFilters: (filters: ResearchFilters) => void
  fetchPapers: (project?: string) => Promise<void>
  createPaper: (paper: ResearchPaperInput) => Promise<ResearchPaper>
  updatePaper: (paperId: string, updates: Partial<ResearchPaperInput>) => Promise<ResearchPaper>
  deletePaper: (paperId: string) => Promise<void>
  findDuplicates: () => DuplicateGroup[]
  checkForDuplicate: (title: string) => ResearchPaper | undefined
  clearFilters: () => void
}

const defaultFilters: ResearchFilters = {
  search: '',
  categories: [],
  sortBy: 'date',
  sortOrder: 'desc'
}

/**
 * Normalize title for duplicate comparison
 */
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
}

/**
 * Hook for managing research papers with duplicate detection
 */
export function useResearchPapers(project?: string): UseResearchPapersReturn {
  const [papers, setPapers] = useState<ResearchPaper[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<ResearchFilters>(defaultFilters)

  const fetchPapers = useCallback(async (projectName?: string) => {
    if (!isSupabaseConfigured()) {
      setError('Database not configured')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const data = await researchPaperService.getAll(projectName || project)
      setPapers(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch papers'
      setError(message)
      console.error('Error fetching papers:', err)
    } finally {
      setIsLoading(false)
    }
  }, [project])

  useEffect(() => {
    if (isSupabaseConfigured()) {
      fetchPapers()
    }
  }, [fetchPapers])

  const createPaper = useCallback(async (paper: ResearchPaperInput): Promise<ResearchPaper> => {
    if (!isSupabaseConfigured()) {
      throw new Error('Database not configured')
    }

    const newPaper = await researchPaperService.create({
      ...paper,
      project: paper.project || project
    })
    setPapers(prev => [newPaper, ...prev])
    return newPaper
  }, [project])

  const updatePaper = useCallback(async (
    paperId: string,
    updates: Partial<ResearchPaperInput>
  ): Promise<ResearchPaper> => {
    if (!isSupabaseConfigured()) {
      throw new Error('Database not configured')
    }

    const updatedPaper = await researchPaperService.update(paperId, updates)
    setPapers(prev =>
      prev.map(p => p.id === paperId ? updatedPaper : p)
    )
    return updatedPaper
  }, [])

  const deletePaper = useCallback(async (paperId: string): Promise<void> => {
    if (!isSupabaseConfigured()) {
      throw new Error('Database not configured')
    }

    await researchPaperService.delete(paperId)
    setPapers(prev => prev.filter(p => p.id !== paperId))
  }, [])

  const checkForDuplicate = useCallback((title: string): ResearchPaper | undefined => {
    const normalized = normalizeTitle(title)
    return papers.find(p => normalizeTitle(p.title) === normalized)
  }, [papers])

  const findDuplicates = useCallback((): DuplicateGroup[] => {
    const titleGroups: Record<string, ResearchPaper[]> = {}

    papers.forEach(paper => {
      const normalized = normalizeTitle(paper.title)
      if (!titleGroups[normalized]) {
        titleGroups[normalized] = []
      }
      titleGroups[normalized].push(paper)
    })

    return Object.entries(titleGroups)
      .filter(([, group]) => group.length > 1)
      .map(([normalizedTitle, group]) => ({
        normalizedTitle,
        papers: group
      }))
  }, [papers])

  const clearFilters = useCallback(() => {
    setFilters(defaultFilters)
  }, [])

  // Apply filters and sorting
  const filteredPapers = useMemo(() => {
    let result = [...papers]

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      result = result.filter(p =>
        p.title.toLowerCase().includes(searchLower) ||
        p.firstAuthor?.toLowerCase().includes(searchLower) ||
        p.allAuthors?.toLowerCase().includes(searchLower) ||
        p.journal?.toLowerCase().includes(searchLower) ||
        p.abstract?.toLowerCase().includes(searchLower)
      )
    }

    // Category filter
    if (filters.categories && filters.categories.length > 0) {
      result = result.filter(p =>
        filters.categories!.some(cat => p.categories.includes(cat))
      )
    }

    // State filter
    if (filters.state) {
      // This would require papers to have a state field
      // For now, we'll skip this filter
    }

    // Year range filter
    if (filters.yearFrom || filters.yearTo) {
      result = result.filter(p => {
        if (!p.publicationYear) return false
        if (filters.yearFrom && p.publicationYear < filters.yearFrom) return false
        if (filters.yearTo && p.publicationYear > filters.yearTo) return false
        return true
      })
    }

    // Sorting
    result.sort((a, b) => {
      const order = filters.sortOrder === 'asc' ? 1 : -1

      switch (filters.sortBy) {
        case 'title':
          return order * a.title.localeCompare(b.title)
        case 'relevance':
          // Relevance would need a score field
          return 0
        case 'date':
        default:
          return order * (b.createdAt.getTime() - a.createdAt.getTime())
      }
    })

    return result
  }, [papers, filters])

  return {
    papers,
    filteredPapers,
    isLoading,
    error,
    filters,
    setFilters,
    fetchPapers,
    createPaper,
    updatePaper,
    deletePaper,
    findDuplicates,
    checkForDuplicate,
    clearFilters
  }
}

export default useResearchPapers
