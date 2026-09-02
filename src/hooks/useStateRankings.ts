/**
 * useStateRankings Hook
 * Manages state workforce ranking calculations and display
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import type {
  StateRanking,
  StateRankingFilters,
  StateBaselineWorkforce,
  ScoringWeights
} from '@/types'
import {
  calculateStateRankings,
  sortStateRankings,
  generateMockStateRankings,
  getRankingSummary,
  DEFAULT_SCORING_WEIGHTS
} from '@/services/stateRankingCalculator'
import { connectionService, policyService, baselineWorkforceService, isSupabaseConfigured } from '@/services/supabase'

interface UseStateRankingsReturn {
  rankings: StateRanking[]
  sortedRankings: StateRanking[]
  isLoading: boolean
  error: string | null
  filters: StateRankingFilters
  setFilters: (filters: StateRankingFilters) => void
  scoringWeights: ScoringWeights
  setScoringWeights: (weights: ScoringWeights) => void
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
  const [scoringWeights, setScoringWeights] = useState<ScoringWeights>(DEFAULT_SCORING_WEIGHTS)

  // Store raw data so we can recalculate when weights change
  const [rawData, setRawData] = useState<{
    connections: Parameters<typeof calculateStateRankings>[0]
    policies: Parameters<typeof calculateStateRankings>[1]
    baselineData: StateBaselineWorkforce[]
  } | null>(null)

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

      // Store raw data for recalculation when weights change
      setRawData({ connections, policies, baselineData })

      const calculated = calculateStateRankings(connections, policies, baselineData, scoringWeights)
      setRankings(calculated)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to calculate rankings'
      setError(message)
      console.error('Error calculating rankings:', err)
    } finally {
      setIsLoading(false)
    }
  }, [project, scoringWeights])

  // Recalculate when weights change and we have raw data
  useEffect(() => {
    if (rawData) {
      const recalculated = calculateStateRankings(
        rawData.connections,
        rawData.policies,
        rawData.baselineData,
        scoringWeights
      )
      setRankings(recalculated)
    }
  }, [scoringWeights, rawData])

  useEffect(() => {
    if (isSupabaseConfigured()) {
      calculateRankings()
    }
  // Only fetch on mount, not when scoringWeights change (recalc handles that)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project])

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
    setRawData(null) // Mock data doesn't have raw data for recalculation
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
    scoringWeights,
    setScoringWeights,
    calculateRankings,
    getRankingForState,
    getSummary,
    useMockData
  }
}

export default useStateRankings
