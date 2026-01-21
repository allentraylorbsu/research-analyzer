/**
 * useStateRankings Hook
 * Manages state workforce ranking calculations and display
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import type {
  StateRanking,
  StateRankingFilters,
  StateBaselineWorkforce
} from '@/types'
import {
  calculateStateRankings,
  sortStateRankings,
  generateMockStateRankings,
  getRankingSummary
} from '@/services/stateRankingCalculator'
import { connectionService, policyService, baselineWorkforceService, isSupabaseConfigured } from '@/services/supabase'

interface UseStateRankingsReturn {
  rankings: StateRanking[]
  sortedRankings: StateRanking[]
  isLoading: boolean
  error: string | null
  filters: StateRankingFilters
  setFilters: (filters: StateRankingFilters) => void
  calculateRankings: (project?: string) => Promise<void>
  getRankingForState: (state: string) => StateRanking | undefined
  getSummary: () => ReturnType<typeof getRankingSummary>
  useMockData: () => void
}

const defaultFilters: StateRankingFilters = {
  sortBy: 'score'
}

/**
 * Hook for managing state workforce rankings
 */
export function useStateRankings(project?: string): UseStateRankingsReturn {
  const [rankings, setRankings] = useState<StateRanking[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<StateRankingFilters>(defaultFilters)

  const calculateRankings = useCallback(async (projectName?: string) => {
    if (!isSupabaseConfigured()) {
      setError('Database not configured')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Fetch all required data
      const [connections, policies, baselineData] = await Promise.all([
        connectionService.getAll(projectName || project),
        policyService.getAll(projectName || project),
        baselineWorkforceService.getAll().catch(() => [] as StateBaselineWorkforce[])
      ])

      const calculated = calculateStateRankings(connections, policies, baselineData)
      setRankings(calculated)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to calculate rankings'
      setError(message)
      console.error('Error calculating rankings:', err)
    } finally {
      setIsLoading(false)
    }
  }, [project])

  useEffect(() => {
    if (isSupabaseConfigured()) {
      calculateRankings()
    }
  }, [calculateRankings])

  const getRankingForState = useCallback((state: string): StateRanking | undefined => {
    return rankings.find(r =>
      r.state.toLowerCase() === state.toLowerCase()
    )
  }, [rankings])

  const getSummary = useCallback(() => {
    return getRankingSummary(rankings)
  }, [rankings])

  const useMockData = useCallback(() => {
    const mockStates = [
      'CALIFORNIA', 'TEXAS', 'FLORIDA', 'NEW YORK', 'PENNSYLVANIA',
      'ILLINOIS', 'OHIO', 'GEORGIA', 'NORTH CAROLINA', 'MICHIGAN',
      'ARIZONA', 'MASSACHUSETTS', 'WASHINGTON', 'COLORADO', 'MINNESOTA'
    ]
    const mockRankings = generateMockStateRankings(mockStates)
    setRankings(mockRankings)
  }, [])

  // Apply filters and sorting
  const sortedRankings = useMemo(() => {
    let result = [...rankings]

    // Apply score filters
    if (filters.minScore !== undefined) {
      result = result.filter(r => r.workforceImpactScore >= filters.minScore!)
    }
    if (filters.maxScore !== undefined) {
      result = result.filter(r => r.workforceImpactScore <= filters.maxScore!)
    }

    // Filter by data availability
    if (filters.hasData !== undefined) {
      result = result.filter(r =>
        filters.hasData ? r.totalConnections > 0 : true
      )
    }

    // Apply sorting
    return sortStateRankings(result, filters.sortBy)
  }, [rankings, filters])

  return {
    rankings,
    sortedRankings,
    isLoading,
    error,
    filters,
    setFilters,
    calculateRankings,
    getRankingForState,
    getSummary,
    useMockData
  }
}

export default useStateRankings
