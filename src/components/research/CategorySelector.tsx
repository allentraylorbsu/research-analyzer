/**
 * CategorySelector Component
 * Multi-select for research paper categories
 */

import { useCallback } from 'react'
import { RESEARCH_CATEGORIES } from '@/types'
import type { ResearchCategory } from '@/types'

export interface CategorySelectorProps {
  selected: ResearchCategory[]
  onChange: (categories: ResearchCategory[]) => void
  maxSelections?: number
  disabled?: boolean
}

export function CategorySelector({
  selected,
  onChange,
  maxSelections = 5,
  disabled = false
}: CategorySelectorProps) {
  const toggleCategory = useCallback((category: ResearchCategory) => {
    if (disabled) return

    if (selected.includes(category)) {
      onChange(selected.filter(c => c !== category))
    } else if (selected.length < maxSelections) {
      onChange([...selected, category])
    }
  }, [selected, onChange, maxSelections, disabled])

  const clearAll = useCallback(() => {
    onChange([])
  }, [onChange])

  const isSelected = useCallback((category: ResearchCategory) => {
    return selected.includes(category)
  }, [selected])

  const canSelectMore = selected.length < maxSelections

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">
          Research Categories
          <span className="ml-2 text-gray-500 font-normal">
            ({selected.length}/{maxSelections} selected)
          </span>
        </label>
        {selected.length > 0 && (
          <button
            onClick={clearAll}
            disabled={disabled}
            className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {RESEARCH_CATEGORIES.map(category => {
          const selected = isSelected(category)
          const canSelect = selected || canSelectMore

          return (
            <button
              key={category}
              onClick={() => toggleCategory(category)}
              disabled={disabled || !canSelect}
              className={`
                px-3 py-1.5 text-sm rounded-full border transition-colors
                ${selected
                  ? 'bg-blue-100 border-blue-300 text-blue-800'
                  : canSelect
                    ? 'bg-white border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                    : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {selected && (
                <svg
                  className="inline w-3 h-3 mr-1 -ml-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              {category}
            </button>
          )
        })}
      </div>

      {!canSelectMore && (
        <p className="text-sm text-amber-600">
          Maximum {maxSelections} categories can be selected
        </p>
      )}
    </div>
  )
}

export default CategorySelector
