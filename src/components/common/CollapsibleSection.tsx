/**
 * CollapsibleSection Component
 * Expandable/collapsible content section
 */

import { useState, ReactNode } from 'react'

export interface CollapsibleSectionProps {
  title: string
  children: ReactNode
  defaultOpen?: boolean
  badge?: string | number
  icon?: ReactNode
  className?: string
}

export function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
  badge,
  icon,
  className = ''
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className={`bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden transition-all duration-200 hover:shadow-lg ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 bg-gradient-to-r from-gray-50 to-white hover:from-gray-100 hover:to-gray-50 transition-all duration-200"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          {icon && <span className="text-indigo-500">{icon}</span>}
          <h3 className="font-semibold text-gray-800 text-lg">{title}</h3>
          {badge !== undefined && (
            <span className="px-3 py-1 text-xs font-semibold bg-indigo-100 text-indigo-700 rounded-full">
              {badge}
            </span>
          )}
        </div>
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 group-hover:bg-gray-200">
          <svg
            className={`w-5 h-5 text-gray-600 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>
      {isOpen && (
        <div className="p-6 border-t border-gray-100 bg-white animate-fadeIn">
          {children}
        </div>
      )}
    </div>
  )
}

export default CollapsibleSection
