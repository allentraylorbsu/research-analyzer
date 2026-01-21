/**
 * useConnections Hook
 * Manages policy-research connection CRUD operations
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import type {
  PolicyConnection,
  PolicyConnectionInput,
  ConnectionFilters,
  ConnectionSummary
} from '@/types'
import { connectionService, isSupabaseConfigured } from '@/services/supabase'

interface UseConnectionsReturn {
  connections: PolicyConnection[]
  filteredConnections: PolicyConnection[]
  isLoading: boolean
  error: string | null
  filters: ConnectionFilters
  setFilters: (filters: ConnectionFilters) => void
  fetchConnections: (project?: string) => Promise<void>
  createConnection: (connection: PolicyConnectionInput) => Promise<PolicyConnection>
  updateConnection: (connectionId: string, updates: Partial<PolicyConnectionInput>) => Promise<PolicyConnection>
  deleteConnection: (connectionId: string) => Promise<void>
  getConnectionsByPolicy: (policyId: string) => PolicyConnection[]
  getConnectionsByPaper: (paperId: string) => PolicyConnection[]
  getConnectionsByState: (state: string) => PolicyConnection[]
  getSummary: () => ConnectionSummary
  clearFilters: () => void
}

const defaultFilters: ConnectionFilters = {
  sortBy: 'date',
  sortOrder: 'desc'
}

/**
 * Hook for managing policy-research connections
 */
export function useConnections(project?: string): UseConnectionsReturn {
  const [connections, setConnections] = useState<PolicyConnection[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<ConnectionFilters>(defaultFilters)

  const fetchConnections = useCallback(async (projectName?: string) => {
    if (!isSupabaseConfigured()) {
      setError('Database not configured')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const data = await connectionService.getAll(projectName || project)
      setConnections(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch connections'
      setError(message)
      console.error('Error fetching connections:', err)
    } finally {
      setIsLoading(false)
    }
  }, [project])

  useEffect(() => {
    if (isSupabaseConfigured()) {
      fetchConnections()
    }
  }, [fetchConnections])

  const createConnection = useCallback(async (
    connection: PolicyConnectionInput
  ): Promise<PolicyConnection> => {
    if (!isSupabaseConfigured()) {
      throw new Error('Database not configured')
    }

    const newConnection = await connectionService.create({
      ...connection,
      project: connection.project || project
    })
    setConnections(prev => [newConnection, ...prev])
    return newConnection
  }, [project])

  const updateConnection = useCallback(async (
    connectionId: string,
    updates: Partial<PolicyConnectionInput>
  ): Promise<PolicyConnection> => {
    if (!isSupabaseConfigured()) {
      throw new Error('Database not configured')
    }

    const updatedConnection = await connectionService.update(connectionId, updates)
    setConnections(prev =>
      prev.map(c => c.connectionId === connectionId ? updatedConnection : c)
    )
    return updatedConnection
  }, [])

  const deleteConnection = useCallback(async (connectionId: string): Promise<void> => {
    if (!isSupabaseConfigured()) {
      throw new Error('Database not configured')
    }

    await connectionService.delete(connectionId)
    setConnections(prev => prev.filter(c => c.connectionId !== connectionId))
  }, [])

  const getConnectionsByPolicy = useCallback((policyId: string): PolicyConnection[] => {
    return connections.filter(c => c.policyId === policyId)
  }, [connections])

  const getConnectionsByPaper = useCallback((paperId: string): PolicyConnection[] => {
    return connections.filter(c => c.paperId === paperId)
  }, [connections])

  const getConnectionsByState = useCallback((state: string): PolicyConnection[] => {
    return connections.filter(c =>
      c.stateJurisdiction.toLowerCase() === state.toLowerCase()
    )
  }, [connections])

  const getSummary = useCallback((): ConnectionSummary => {
    if (connections.length === 0) {
      return {
        totalConnections: 0,
        positiveConnections: 0,
        negativeConnections: 0,
        neutralConnections: 0,
        averageStrength: 0,
        averageEvidence: 0,
        averageRelevance: 0
      }
    }

    const positive = connections.filter(c => c.connectionType === 'POSITIVE').length
    const negative = connections.filter(c => c.connectionType === 'NEGATIVE').length
    const neutral = connections.filter(c => c.connectionType === 'NEUTRAL').length

    const avgStrength = connections.reduce((sum, c) => sum + c.strengthScore, 0) / connections.length
    const avgEvidence = connections.reduce((sum, c) => sum + c.evidenceQuality, 0) / connections.length
    const avgRelevance = connections.reduce((sum, c) => sum + c.workforceRelevance, 0) / connections.length

    return {
      totalConnections: connections.length,
      positiveConnections: positive,
      negativeConnections: negative,
      neutralConnections: neutral,
      averageStrength: Math.round(avgStrength * 10) / 10,
      averageEvidence: Math.round(avgEvidence * 10) / 10,
      averageRelevance: Math.round(avgRelevance * 10) / 10
    }
  }, [connections])

  const clearFilters = useCallback(() => {
    setFilters(defaultFilters)
  }, [])

  // Apply filters and sorting
  const filteredConnections = useMemo(() => {
    let result = [...connections]

    // Policy filter
    if (filters.policyId) {
      result = result.filter(c => c.policyId === filters.policyId)
    }

    // Paper filter
    if (filters.paperId) {
      result = result.filter(c => c.paperId === filters.paperId)
    }

    // State filter
    if (filters.state) {
      result = result.filter(c =>
        c.stateJurisdiction.toLowerCase() === filters.state?.toLowerCase()
      )
    }

    // Connection type filter
    if (filters.connectionType) {
      result = result.filter(c => c.connectionType === filters.connectionType)
    }

    // Minimum strength filter
    if (filters.minStrength !== undefined) {
      result = result.filter(c => c.strengthScore >= filters.minStrength!)
    }

    // Minimum evidence filter
    if (filters.minEvidence !== undefined) {
      result = result.filter(c => c.evidenceQuality >= filters.minEvidence!)
    }

    // Sorting
    result.sort((a, b) => {
      const order = filters.sortOrder === 'asc' ? 1 : -1

      switch (filters.sortBy) {
        case 'strength':
          return order * (a.strengthScore - b.strengthScore)
        case 'evidence':
          return order * (a.evidenceQuality - b.evidenceQuality)
        case 'relevance':
          return order * (a.workforceRelevance - b.workforceRelevance)
        case 'date':
        default:
          return order * (b.createdAt.getTime() - a.createdAt.getTime())
      }
    })

    return result
  }, [connections, filters])

  return {
    connections,
    filteredConnections,
    isLoading,
    error,
    filters,
    setFilters,
    fetchConnections,
    createConnection,
    updateConnection,
    deleteConnection,
    getConnectionsByPolicy,
    getConnectionsByPaper,
    getConnectionsByState,
    getSummary,
    clearFilters
  }
}

export default useConnections
