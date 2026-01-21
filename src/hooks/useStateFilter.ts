/**
 * useStateFilter Hook
 * Manages US state selection and filtering logic
 */

import { useState, useCallback, useMemo } from 'react'
import { US_STATES, US_STATES_LIST, STATE_ABBREVIATIONS } from '@/types'
import type { StateAbbreviation, StateName } from '@/types'

interface UseStateFilterReturn {
  selectedState: string | null
  selectedStateAbbrev: StateAbbreviation | null
  selectedStateName: StateName | null
  setSelectedState: (state: string | null) => void
  clearSelection: () => void
  statesList: Array<{ name: StateName; abbreviation: StateAbbreviation }>
  getStateName: (abbrev: StateAbbreviation) => StateName
  getStateAbbrev: (name: string) => StateAbbreviation | null
  isValidState: (state: string) => boolean
  filterByState: <T extends { jurisdiction?: string; state?: string }>(items: T[]) => T[]
}

/**
 * Hook for managing US state selection and filtering
 */
export function useStateFilter(initialState?: string): UseStateFilterReturn {
  const [selectedState, setSelectedStateInternal] = useState<string | null>(
    initialState || null
  )

  const setSelectedState = useCallback((state: string | null) => {
    if (state === null || state === '') {
      setSelectedStateInternal(null)
      return
    }

    // Accept either full name or abbreviation
    const upperState = state.toUpperCase()

    // Check if it's an abbreviation
    if (upperState in STATE_ABBREVIATIONS) {
      setSelectedStateInternal(STATE_ABBREVIATIONS[upperState as StateAbbreviation])
      return
    }

    // Check if it's a full name
    if (upperState in US_STATES) {
      setSelectedStateInternal(upperState)
      return
    }

    // Try to find a partial match
    const match = US_STATES_LIST.find(s =>
      s.name.toLowerCase().includes(state.toLowerCase()) ||
      s.abbreviation.toLowerCase() === state.toLowerCase()
    )

    if (match) {
      setSelectedStateInternal(match.name)
    } else {
      setSelectedStateInternal(state.toUpperCase())
    }
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedStateInternal(null)
  }, [])

  const selectedStateAbbrev = useMemo((): StateAbbreviation | null => {
    if (!selectedState) return null

    const upperState = selectedState.toUpperCase()

    // If it's already an abbreviation
    if (upperState in STATE_ABBREVIATIONS) {
      return upperState as StateAbbreviation
    }

    // If it's a full name
    if (upperState in US_STATES) {
      return US_STATES[upperState as StateName]
    }

    return null
  }, [selectedState])

  const selectedStateName = useMemo((): StateName | null => {
    if (!selectedState) return null

    const upperState = selectedState.toUpperCase()

    // If it's an abbreviation
    if (upperState in STATE_ABBREVIATIONS) {
      return STATE_ABBREVIATIONS[upperState as StateAbbreviation]
    }

    // If it's a full name
    if (upperState in US_STATES) {
      return upperState as StateName
    }

    return null
  }, [selectedState])

  const getStateName = useCallback((abbrev: StateAbbreviation): StateName => {
    return STATE_ABBREVIATIONS[abbrev]
  }, [])

  const getStateAbbrev = useCallback((name: string): StateAbbreviation | null => {
    const upperName = name.toUpperCase()
    if (upperName in US_STATES) {
      return US_STATES[upperName as StateName]
    }
    if (upperName in STATE_ABBREVIATIONS) {
      return upperName as StateAbbreviation
    }
    return null
  }, [])

  const isValidState = useCallback((state: string): boolean => {
    const upperState = state.toUpperCase()
    return upperState in US_STATES || upperState in STATE_ABBREVIATIONS
  }, [])

  const filterByState = useCallback(<T extends { jurisdiction?: string; state?: string }>(
    items: T[]
  ): T[] => {
    if (!selectedState) return items

    const upperSelected = selectedState.toUpperCase()
    const abbrev = getStateAbbrev(upperSelected)

    return items.filter(item => {
      const itemState = (item.jurisdiction || item.state || '').toUpperCase()

      // Match by full name
      if (itemState === upperSelected) return true

      // Match by abbreviation
      if (abbrev && itemState === abbrev) return true

      // Match abbreviation to full name
      const itemAbbrev = getStateAbbrev(itemState)
      if (itemAbbrev && abbrev && itemAbbrev === abbrev) return true

      return false
    })
  }, [selectedState, getStateAbbrev])

  return {
    selectedState,
    selectedStateAbbrev,
    selectedStateName,
    setSelectedState,
    clearSelection,
    statesList: US_STATES_LIST,
    getStateName,
    getStateAbbrev,
    isValidState,
    filterByState
  }
}

export default useStateFilter
