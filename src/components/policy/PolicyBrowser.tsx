/**
 * PolicyBrowser Component
 * Browse, search, and filter policies
 */

import { useState, useCallback } from 'react'
import { Button, LoadingSpinner, Modal } from '../common'
import { StateFilter } from '../visualization'
import type { Policy, PolicyFilters, PolicyType, PolicyStatus } from '@/types'

export interface PolicyBrowserProps {
  policies: Policy[]
  filters: PolicyFilters
  onFiltersChange: (filters: PolicyFilters) => void
  isLoading?: boolean
  onPolicySelect?: (policy: Policy) => void
  onPolicyEdit?: (policy: Policy) => void
  onPolicyDelete?: (policy: Policy) => void
  selectedPolicyId?: string
}

export function PolicyBrowser({
  policies,
  filters,
  onFiltersChange,
  isLoading = false,
  onPolicySelect,
  onPolicyEdit,
  onPolicyDelete,
  selectedPolicyId
}: PolicyBrowserProps) {
  const [viewingPolicy, setViewingPolicy] = useState<Policy | null>(null)

  const handleSearchChange = useCallback((search: string) => {
    onFiltersChange({ ...filters, search })
  }, [filters, onFiltersChange])

  const handleStateChange = useCallback((state: string | null) => {
    onFiltersChange({ ...filters, jurisdiction: state || undefined })
  }, [filters, onFiltersChange])

  const handleTypeChange = useCallback((policyType: PolicyType | '') => {
    onFiltersChange({ ...filters, policyType: policyType || undefined })
  }, [filters, onFiltersChange])

  const handleStatusChange = useCallback((status: PolicyStatus | '') => {
    onFiltersChange({ ...filters, status: status || undefined })
  }, [filters, onFiltersChange])

  const handleSortChange = useCallback((sortBy: PolicyFilters['sortBy']) => {
    onFiltersChange({ ...filters, sortBy })
  }, [filters, onFiltersChange])

  const clearFilters = useCallback(() => {
    onFiltersChange({
      search: '',
      sortBy: 'date',
      sortOrder: 'desc'
    })
  }, [onFiltersChange])

  const hasActiveFilters = !!(
    filters.search ||
    filters.jurisdiction ||
    filters.policyType ||
    filters.status
  )

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="space-y-3">
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            value={filters.search || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search policies..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <svg
            className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* Filter Row */}
        <div className="flex flex-wrap gap-3">
          <div className="w-40">
            <StateFilter
              selectedState={filters.jurisdiction || null}
              onStateChange={handleStateChange}
              placeholder="All states"
              size="small"
            />
          </div>

          <select
            value={filters.policyType || ''}
            onChange={(e) => handleTypeChange(e.target.value as PolicyType | '')}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All types</option>
            <option value="legislation">Legislation</option>
            <option value="regulation">Regulation</option>
            <option value="executive_order">Executive Order</option>
            <option value="agency_rule">Agency Rule</option>
          </select>

          <select
            value={filters.status || ''}
            onChange={(e) => handleStatusChange(e.target.value as PolicyStatus | '')}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All statuses</option>
            <option value="introduced">Introduced</option>
            <option value="passed">Passed</option>
            <option value="enacted">Enacted</option>
            <option value="signed">Signed</option>
            <option value="vetoed">Vetoed</option>
            <option value="failed">Failed</option>
          </select>

          <select
            value={filters.sortBy || 'date'}
            onChange={(e) => handleSortChange(e.target.value as PolicyFilters['sortBy'])}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="date">Sort by Date</option>
            <option value="title">Sort by Title</option>
            <option value="jurisdiction">Sort by State</option>
            <option value="status">Sort by Status</option>
          </select>

          {hasActiveFilters && (
            <Button size="small" variant="ghost" onClick={clearFilters}>
              Clear filters
            </Button>
          )}
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-500">
        {policies.length} {policies.length === 1 ? 'policy' : 'policies'} found
      </div>

      {/* Policy List */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      ) : policies.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No policies found. Try adjusting your filters.
        </div>
      ) : (
        <div className="space-y-2">
          {policies.map(policy => (
            <PolicyRow
              key={policy.policyId}
              policy={policy}
              isSelected={policy.policyId === selectedPolicyId}
              onSelect={onPolicySelect}
              onView={() => setViewingPolicy(policy)}
              onEdit={onPolicyEdit}
              onDelete={onPolicyDelete}
            />
          ))}
        </div>
      )}

      {/* Policy Detail Modal */}
      {viewingPolicy && (
        <Modal
          isOpen={true}
          onClose={() => setViewingPolicy(null)}
          title={viewingPolicy.title}
          size="large"
        >
          <PolicyDetail policy={viewingPolicy} />
        </Modal>
      )}
    </div>
  )
}

interface PolicyRowProps {
  policy: Policy
  isSelected: boolean
  onSelect?: (policy: Policy) => void
  onView: () => void
  onEdit?: (policy: Policy) => void
  onDelete?: (policy: Policy) => void
}

function PolicyRow({
  policy,
  isSelected,
  onSelect,
  onView,
  onEdit,
  onDelete
}: PolicyRowProps) {
  return (
    <div
      className={`
        border rounded-lg p-4 transition-colors
        ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}
        ${onSelect ? 'cursor-pointer' : ''}
      `}
      onClick={onSelect ? () => onSelect(policy) : undefined}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-medium text-gray-900">{policy.billNumber || policy.title}</h3>
            <span className="px-2 py-0.5 text-xs bg-gray-100 rounded-full text-gray-600">
              {policy.jurisdiction}
            </span>
            {policy.status && (
              <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusStyles(policy.status)}`}>
                {policy.status}
              </span>
            )}
          </div>
          {policy.billNumber && (
            <p className="text-sm text-gray-700 mt-1">{policy.title}</p>
          )}
          {policy.description && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{policy.description}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button size="small" variant="ghost" onClick={(e) => { e.stopPropagation(); onView() }}>
            View
          </Button>
          {onEdit && (
            <Button size="small" variant="ghost" onClick={(e) => { e.stopPropagation(); onEdit(policy) }}>
              Edit
            </Button>
          )}
          {onDelete && (
            <Button
              size="small"
              variant="ghost"
              onClick={(e) => { e.stopPropagation(); onDelete(policy) }}
              className="text-red-600 hover:text-red-800"
            >
              Delete
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function PolicyDetail({ policy }: { policy: Policy }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-500">Jurisdiction</label>
          <p className="text-gray-900">{policy.jurisdiction}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">Status</label>
          <p className="text-gray-900">{policy.status || 'Unknown'}</p>
        </div>
        {policy.billNumber && (
          <div>
            <label className="text-sm font-medium text-gray-500">Bill Number</label>
            <p className="text-gray-900">{policy.billNumber}</p>
          </div>
        )}
        {policy.policyType && (
          <div>
            <label className="text-sm font-medium text-gray-500">Type</label>
            <p className="text-gray-900 capitalize">{policy.policyType.replace('_', ' ')}</p>
          </div>
        )}
      </div>

      {policy.description && (
        <div>
          <label className="text-sm font-medium text-gray-500">Description</label>
          <p className="text-gray-900 mt-1">{policy.description}</p>
        </div>
      )}

      {policy.sourceUrl && (
        <div>
          <label className="text-sm font-medium text-gray-500">Source</label>
          <a
            href={policy.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline block mt-1"
          >
            {policy.sourceUrl}
          </a>
        </div>
      )}
    </div>
  )
}

function getStatusStyles(status: PolicyStatus): string {
  switch (status) {
    case 'enacted':
    case 'signed':
    case 'effective':
      return 'bg-green-100 text-green-800'
    case 'passed':
      return 'bg-blue-100 text-blue-800'
    case 'introduced':
    case 'pending':
      return 'bg-yellow-100 text-yellow-800'
    case 'vetoed':
    case 'failed':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export default PolicyBrowser
