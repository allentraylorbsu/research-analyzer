/**
 * StateFilter Component
 * US States dropdown selector
 */

import { useCallback, useMemo } from 'react'
import { US_STATES_LIST } from '@/types'

export interface StateFilterProps {
  selectedState: string | null
  onStateChange: (state: string | null) => void
  placeholder?: string
  disabled?: boolean
  size?: 'small' | 'medium' | 'large'
  showAbbreviation?: boolean
  includeAllOption?: boolean
  className?: string
}

export function StateFilter({
  selectedState,
  onStateChange,
  placeholder = 'Select state...',
  disabled = false,
  size = 'medium',
  showAbbreviation = true,
  includeAllOption = true,
  className = ''
}: StateFilterProps) {
  const handleChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    onStateChange(value === '' ? null : value)
  }, [onStateChange])

  const sizeClasses = {
    small: 'px-2 py-1 text-sm',
    medium: 'px-3 py-2 text-base',
    large: 'px-4 py-3 text-lg'
  }

  const sortedStates = useMemo(() => {
    return [...US_STATES_LIST].sort((a, b) => a.name.localeCompare(b.name))
  }, [])

  return (
    <select
      value={selectedState || ''}
      onChange={handleChange}
      disabled={disabled}
      className={`
        w-full border border-gray-300 rounded-md
        focus:ring-2 focus:ring-blue-500 focus:border-blue-500
        disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {includeAllOption && (
        <option value="">{placeholder}</option>
      )}
      {sortedStates.map(state => (
        <option key={state.abbreviation} value={state.name}>
          {showAbbreviation
            ? `${formatStateName(state.name)} (${state.abbreviation})`
            : formatStateName(state.name)
          }
        </option>
      ))}
    </select>
  )
}

/**
 * Format state name to title case
 */
function formatStateName(name: string): string {
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export default StateFilter
