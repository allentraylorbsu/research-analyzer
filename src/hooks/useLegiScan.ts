/**
 * useLegiScan Hook
 * Manages LegiScan API search and import operations
 */

import { useState, useCallback } from 'react'
import type { LegiScanBill, LegiScanSearchParams, PolicyInput } from '@/types'
import { searchLegiScanBills, getBillDetails, getStateSessions } from '@/services/legiscan'
import { stateNameToAbbrev } from '@/services/legiscan'

interface SessionInfo {
  sessionId: number
  sessionName: string
  yearStart: number
  yearEnd: number
}

interface UseLegiScanReturn {
  bills: LegiScanBill[]
  sessions: SessionInfo[]
  isSearching: boolean
  isLoadingSessions: boolean
  error: string | null
  lastSearch: LegiScanSearchParams | null
  searchBills: (params: LegiScanSearchParams) => Promise<LegiScanBill[]>
  getBill: (billId: string | number) => Promise<LegiScanBill | null>
  fetchSessions: (state: string) => Promise<SessionInfo[]>
  convertToPolicyInput: (bill: LegiScanBill) => PolicyInput
  clearResults: () => void
  clearError: () => void
}

/**
 * Hook for LegiScan API operations
 */
export function useLegiScan(apiKey: string | undefined): UseLegiScanReturn {
  const [bills, setBills] = useState<LegiScanBill[]>([])
  const [sessions, setSessions] = useState<SessionInfo[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isLoadingSessions, setIsLoadingSessions] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastSearch, setLastSearch] = useState<LegiScanSearchParams | null>(null)

  const searchBills = useCallback(async (
    params: LegiScanSearchParams
  ): Promise<LegiScanBill[]> => {
    if (!apiKey) {
      setError('LegiScan API key required')
      return []
    }

    setIsSearching(true)
    setError(null)
    setLastSearch(params)

    try {
      const results = await searchLegiScanBills(apiKey, params.state, params.keywords, params.year)
      setBills(results)
      return results
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Search failed'
      setError(message)
      return []
    } finally {
      setIsSearching(false)
    }
  }, [apiKey])

  const getBill = useCallback(async (
    billId: string | number
  ): Promise<LegiScanBill | null> => {
    if (!apiKey) {
      setError('LegiScan API key required')
      return null
    }

    try {
      return await getBillDetails(apiKey, billId)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get bill details'
      setError(message)
      return null
    }
  }, [apiKey])

  const fetchSessions = useCallback(async (state: string): Promise<SessionInfo[]> => {
    if (!apiKey) {
      setError('LegiScan API key required')
      return []
    }

    setIsLoadingSessions(true)
    setError(null)

    try {
      const result = await getStateSessions(apiKey, state)
      setSessions(result)
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch sessions'
      setError(message)
      return []
    } finally {
      setIsLoadingSessions(false)
    }
  }, [apiKey])

  const convertToPolicyInput = useCallback((bill: LegiScanBill): PolicyInput => {
    return {
      title: bill.title,
      description: bill.description || bill.lastAction,
      jurisdiction: bill.state,
      policyType: 'legislation',
      status: mapBillStatus(bill.status),
      sourceUrl: bill.url,
      billNumber: bill.billNumber,
      session: bill.session
    }
  }, [])

  const clearResults = useCallback(() => {
    setBills([])
    setLastSearch(null)
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    bills,
    sessions,
    isSearching,
    isLoadingSessions,
    error,
    lastSearch,
    searchBills,
    getBill,
    fetchSessions,
    convertToPolicyInput,
    clearResults,
    clearError
  }
}

/**
 * Map LegiScan bill status to PolicyStatus
 */
function mapBillStatus(status: string | undefined): PolicyInput['status'] {
  if (!status) return undefined

  const statusLower = status.toLowerCase()

  if (statusLower.includes('introduced')) return 'introduced'
  if (statusLower.includes('passed')) return 'passed'
  if (statusLower.includes('enacted') || statusLower.includes('signed')) return 'enacted'
  if (statusLower.includes('vetoed')) return 'vetoed'
  if (statusLower.includes('failed')) return 'failed'

  return 'pending'
}

// Re-export utility function
export { stateNameToAbbrev }

export default useLegiScan
