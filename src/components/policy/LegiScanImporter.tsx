/**
 * LegiScanImporter Component
 * Search and import legislation from LegiScan API
 */

import { useState, useCallback } from 'react'
import { Button, StatusMessage } from '../common'
import { StateFilter } from '../visualization'
import { useLegiScan } from '@/hooks'
import type { LegiScanBill, PolicyInput } from '@/types'

export interface LegiScanImporterProps {
  apiKey: string | undefined
  onImport: (policies: PolicyInput[]) => Promise<void>
  onError?: (error: string) => void
}

// Timeline options matching LegiScan API year parameter
const TIMELINE_OPTIONS = [
  { value: '1', label: 'Current Session' },
  { value: '2', label: 'Recent (Last 2 Years)' },
  { value: '3', label: 'Prior Sessions' },
  { value: '4', label: 'All Time' }
]

export function LegiScanImporter({
  apiKey,
  onImport,
  onError
}: LegiScanImporterProps) {
  const [selectedState, setSelectedState] = useState<string | null>(null)
  const [keywords, setKeywords] = useState('')
  const [timeline, setTimeline] = useState('1') // Default to current session
  const [selectedBills, setSelectedBills] = useState<Set<string>>(new Set())
  const [isImporting, setIsImporting] = useState(false)

  const {
    bills,
    isSearching,
    error,
    searchBills,
    convertToPolicyInput,
    clearResults,
    clearError
  } = useLegiScan(apiKey)

  const handleSearch = useCallback(async () => {
    if (!selectedState) {
      onError?.('Please select a state')
      return
    }

    clearError()
    setSelectedBills(new Set())
    await searchBills({
      state: selectedState,
      keywords: keywords || undefined,
      year: parseInt(timeline, 10)
    })
  }, [selectedState, keywords, timeline, searchBills, clearError, onError])

  const handleToggleBill = useCallback((billId: string) => {
    setSelectedBills(prev => {
      const next = new Set(prev)
      if (next.has(billId)) {
        next.delete(billId)
      } else {
        next.add(billId)
      }
      return next
    })
  }, [])

  const handleSelectAll = useCallback(() => {
    if (selectedBills.size === bills.length) {
      setSelectedBills(new Set())
    } else {
      setSelectedBills(new Set(bills.map(b => String(b.billId))))
    }
  }, [bills, selectedBills])

  const handleImport = useCallback(async () => {
    const billsToImport = bills.filter(b => selectedBills.has(String(b.billId)))
    if (billsToImport.length === 0) {
      onError?.('Please select at least one bill to import')
      return
    }

    setIsImporting(true)
    try {
      const policies = billsToImport.map(convertToPolicyInput)
      await onImport(policies)
      clearResults()
      setSelectedBills(new Set())
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setIsImporting(false)
    }
  }, [bills, selectedBills, convertToPolicyInput, onImport, clearResults, onError])

  if (!apiKey) {
    return (
      <StatusMessage
        type="warning"
        message="LegiScan API key required"
        details="Add your LegiScan API key in the API Keys section to search legislation"
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* Search Form */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            State
          </label>
          <StateFilter
            selectedState={selectedState}
            onStateChange={setSelectedState}
            placeholder="Select a state..."
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Keywords (optional)
          </label>
          <input
            type="text"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="healthcare, physician workforce..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="w-48">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Timeline
          </label>
          <select
            value={timeline}
            onChange={(e) => setTimeline(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            {TIMELINE_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <Button
            onClick={handleSearch}
            disabled={!selectedState || isSearching}
            isLoading={isSearching}
          >
            Search Bills
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <StatusMessage
          type="error"
          message={error}
          onDismiss={clearError}
        />
      )}

      {/* Search Results */}
      {bills.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-gray-50 p-3 flex items-center justify-between border-b">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={selectedBills.size === bills.length}
                onChange={handleSelectAll}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                {selectedBills.size} of {bills.length} bills selected
              </span>
            </div>
            <Button
              size="small"
              onClick={handleImport}
              disabled={selectedBills.size === 0 || isImporting}
              isLoading={isImporting}
            >
              Import Selected
            </Button>
          </div>

          <div className="max-h-96 overflow-y-auto divide-y">
            {bills.map(bill => (
              <BillRow
                key={bill.billId}
                bill={bill}
                isSelected={selectedBills.has(String(bill.billId))}
                onToggle={() => handleToggleBill(String(bill.billId))}
              />
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {!isSearching && bills.length === 0 && selectedState && (
        <div className="text-center py-8 text-gray-500">
          No bills found. Try different keywords or search a different state.
        </div>
      )}
    </div>
  )
}

interface BillRowProps {
  bill: LegiScanBill
  isSelected: boolean
  onToggle: () => void
}

function BillRow({ bill, isSelected, onToggle }: BillRowProps) {
  return (
    <div
      className={`p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 ${isSelected ? 'bg-indigo-50 border-indigo-200' : ''}`}
      onClick={onToggle}
    >
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggle}
          onClick={(e) => e.stopPropagation()}
          className="mt-1 w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-indigo-700">{bill.billNumber}</span>
            <span className="px-2 py-0.5 text-xs font-medium bg-gray-200 rounded-full text-gray-700">
              {bill.state}
            </span>
            {bill.status && (
              <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 rounded-full text-blue-700">
                {bill.status}
              </span>
            )}
            {bill.relevanceScore && (
              <span className="px-2 py-0.5 text-xs font-medium bg-green-100 rounded-full text-green-700">
                {bill.relevanceScore}% match
              </span>
            )}
          </div>

          {/* Bill Summary/Title */}
          <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
            <p className="text-sm font-medium text-gray-800 mb-1">Summary:</p>
            <p className="text-sm text-gray-700 leading-relaxed">
              {bill.title}
            </p>
            {bill.description && bill.description !== bill.title && !bill.description.startsWith('http') && (
              <p className="text-sm text-gray-600 mt-2 italic">
                {bill.description}
              </p>
            )}
          </div>

          {/* Last Action */}
          {bill.lastAction && (
            <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>
                <strong>Last action:</strong> {bill.lastAction}
                {bill.lastActionDate && <span className="text-gray-400"> ({bill.lastActionDate})</span>}
              </span>
            </div>
          )}

          {/* Link to full bill */}
          {bill.url && (
            <a
              href={bill.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="mt-2 inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              View full bill on LegiScan
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

export default LegiScanImporter
