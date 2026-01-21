/**
 * usePolicies Hook
 * Manages policy CRUD operations and filtering
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import type { Policy, PolicyInput, PolicyFilters } from '@/types'
import { policyService, isSupabaseConfigured } from '@/services/supabase'

interface UsePoliciesReturn {
  policies: Policy[]
  filteredPolicies: Policy[]
  isLoading: boolean
  error: string | null
  filters: PolicyFilters
  setFilters: (filters: PolicyFilters) => void
  fetchPolicies: (project?: string) => Promise<void>
  createPolicy: (policy: PolicyInput) => Promise<Policy>
  updatePolicy: (policyId: string, updates: Partial<PolicyInput>) => Promise<Policy>
  deletePolicy: (policyId: string) => Promise<void>
  bulkCreatePolicies: (policies: PolicyInput[]) => Promise<Policy[]>
  getPoliciesByState: (state: string) => Policy[]
  clearFilters: () => void
}

const defaultFilters: PolicyFilters = {
  search: '',
  sortBy: 'date',
  sortOrder: 'desc'
}

/**
 * Hook for managing policies with CRUD operations
 */
export function usePolicies(project?: string): UsePoliciesReturn {
  const [policies, setPolicies] = useState<Policy[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<PolicyFilters>(defaultFilters)

  const fetchPolicies = useCallback(async (projectName?: string) => {
    if (!isSupabaseConfigured()) {
      setError('Database not configured')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const data = await policyService.getAll(projectName || project)
      setPolicies(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch policies'
      setError(message)
      console.error('Error fetching policies:', err)
    } finally {
      setIsLoading(false)
    }
  }, [project])

  useEffect(() => {
    if (isSupabaseConfigured()) {
      fetchPolicies()
    }
  }, [fetchPolicies])

  const createPolicy = useCallback(async (policy: PolicyInput): Promise<Policy> => {
    if (!isSupabaseConfigured()) {
      throw new Error('Database not configured')
    }

    const newPolicy = await policyService.create({
      ...policy,
      project: policy.project || project
    })
    setPolicies(prev => [newPolicy, ...prev])
    return newPolicy
  }, [project])

  const updatePolicy = useCallback(async (
    policyId: string,
    updates: Partial<PolicyInput>
  ): Promise<Policy> => {
    if (!isSupabaseConfigured()) {
      throw new Error('Database not configured')
    }

    const updatedPolicy = await policyService.update(policyId, updates)
    setPolicies(prev =>
      prev.map(p => p.policyId === policyId ? updatedPolicy : p)
    )
    return updatedPolicy
  }, [])

  const deletePolicy = useCallback(async (policyId: string): Promise<void> => {
    if (!isSupabaseConfigured()) {
      throw new Error('Database not configured')
    }

    await policyService.delete(policyId)
    setPolicies(prev => prev.filter(p => p.policyId !== policyId))
  }, [])

  const bulkCreatePolicies = useCallback(async (
    newPolicies: PolicyInput[]
  ): Promise<Policy[]> => {
    if (!isSupabaseConfigured()) {
      throw new Error('Database not configured. Please click "Save & Test Connection" in API Configuration.')
    }

    const policiesWithProject = newPolicies.map(p => ({
      ...p,
      project: p.project || project
    }))

    try {
      const created = await policyService.bulkCreate(policiesWithProject)
      setPolicies(prev => [...created, ...prev])
      return created
    } catch (err) {
      console.error('Bulk create error:', err)
      if (err instanceof Error) {
        // Check for common Supabase errors
        if (err.message.includes('relation') && err.message.includes('does not exist')) {
          throw new Error('Database table "policies" does not exist. Please run the database migrations.')
        }
        if (err.message.includes('permission denied')) {
          throw new Error('Database permission denied. Check your Supabase RLS policies.')
        }
        throw err
      }
      throw new Error('Failed to save policies to database')
    }
  }, [project])

  const getPoliciesByState = useCallback((state: string): Policy[] => {
    return policies.filter(p =>
      p.jurisdiction.toLowerCase() === state.toLowerCase()
    )
  }, [policies])

  const clearFilters = useCallback(() => {
    setFilters(defaultFilters)
  }, [])

  // Apply filters and sorting
  const filteredPolicies = useMemo(() => {
    let result = [...policies]

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      result = result.filter(p =>
        p.title.toLowerCase().includes(searchLower) ||
        p.description?.toLowerCase().includes(searchLower) ||
        p.jurisdiction.toLowerCase().includes(searchLower) ||
        p.billNumber?.toLowerCase().includes(searchLower)
      )
    }

    // Jurisdiction filter
    if (filters.jurisdiction) {
      result = result.filter(p =>
        p.jurisdiction.toLowerCase() === filters.jurisdiction?.toLowerCase()
      )
    }

    // Policy type filter
    if (filters.policyType) {
      result = result.filter(p => p.policyType === filters.policyType)
    }

    // Status filter
    if (filters.status) {
      result = result.filter(p => p.status === filters.status)
    }

    // Year range filter
    if (filters.yearFrom || filters.yearTo) {
      result = result.filter(p => {
        if (!p.effectiveDate) return false
        const year = p.effectiveDate.getFullYear()
        if (filters.yearFrom && year < filters.yearFrom) return false
        if (filters.yearTo && year > filters.yearTo) return false
        return true
      })
    }

    // Sorting
    result.sort((a, b) => {
      const order = filters.sortOrder === 'asc' ? 1 : -1

      switch (filters.sortBy) {
        case 'title':
          return order * a.title.localeCompare(b.title)
        case 'jurisdiction':
          return order * a.jurisdiction.localeCompare(b.jurisdiction)
        case 'status':
          return order * (a.status || '').localeCompare(b.status || '')
        case 'date':
        default:
          return order * (b.createdAt.getTime() - a.createdAt.getTime())
      }
    })

    return result
  }, [policies, filters])

  return {
    policies,
    filteredPolicies,
    isLoading,
    error,
    filters,
    setFilters,
    fetchPolicies,
    createPolicy,
    updatePolicy,
    deletePolicy,
    bulkCreatePolicies,
    getPoliciesByState,
    clearFilters
  }
}

export default usePolicies
