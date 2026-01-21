/**
 * StateRankings Component
 * Display state workforce impact rankings with grades
 */

import { useState, useCallback, useMemo } from 'react'
import { Button, LoadingSpinner } from '../common'
import type { StateRanking, RankingSortBy } from '@/types'

export interface StateRankingsProps {
  rankings: StateRanking[]
  isLoading?: boolean
  onRefresh?: () => void
  onStateSelect?: (state: string) => void
  selectedState?: string
}

export function StateRankings({
  rankings,
  isLoading = false,
  onRefresh,
  onStateSelect,
  selectedState
}: StateRankingsProps) {
  const [sortBy, setSortBy] = useState<RankingSortBy>('score')
  const [expandedState, setExpandedState] = useState<string | null>(null)

  const sortedRankings = useMemo(() => {
    const sorted = [...rankings]
    switch (sortBy) {
      case 'alpha':
        return sorted.sort((a, b) => a.state.localeCompare(b.state))
      case 'connections':
        return sorted.sort((a, b) => b.totalConnections - a.totalConnections)
      case 'policies':
        return sorted.sort((a, b) => b.policies - a.policies)
      case 'score':
      default:
        return sorted.sort((a, b) => b.workforceImpactScore - a.workforceImpactScore)
    }
  }, [rankings, sortBy])

  const summary = useMemo(() => {
    if (rankings.length === 0) return null

    const scores = rankings.map(r => r.workforceImpactScore)
    const gradeCount: Record<string, number> = {}
    rankings.forEach(r => {
      gradeCount[r.grade.letter] = (gradeCount[r.grade.letter] || 0) + 1
    })

    return {
      totalStates: rankings.length,
      averageScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      highestScore: Math.max(...scores),
      lowestScore: Math.min(...scores),
      gradeCount
    }
  }, [rankings])

  const toggleExpanded = useCallback((state: string) => {
    setExpandedState(prev => prev === state ? null : state)
  }, [])

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="large" text="Calculating rankings..." />
      </div>
    )
  }

  if (rankings.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">No state rankings available</p>
        {onRefresh && (
          <Button onClick={onRefresh}>Calculate Rankings</Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      {summary && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Rankings Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">{summary.totalStates}</div>
              <div className="text-sm text-gray-500">States Ranked</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{summary.averageScore}</div>
              <div className="text-sm text-gray-500">Average Score</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{summary.highestScore}</div>
              <div className="text-sm text-gray-500">Highest Score</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{summary.lowestScore}</div>
              <div className="text-sm text-gray-500">Lowest Score</div>
            </div>
          </div>

          {/* Grade Distribution */}
          <div className="mt-4 pt-4 border-t border-blue-200">
            <div className="flex items-center justify-center gap-4 flex-wrap">
              {Object.entries(summary.gradeCount)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([grade, count]) => (
                  <div key={grade} className="flex items-center gap-1">
                    <GradeBadge grade={grade} size="small" />
                    <span className="text-sm text-gray-600">x{count}</span>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as RankingSortBy)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="score">Score (High to Low)</option>
            <option value="alpha">Alphabetical</option>
            <option value="connections">Connections</option>
            <option value="policies">Policies</option>
          </select>
        </div>
        {onRefresh && (
          <Button size="small" variant="secondary" onClick={onRefresh}>
            Refresh
          </Button>
        )}
      </div>

      {/* Rankings List */}
      <div className="space-y-2">
        {sortedRankings.map((ranking, index) => (
          <StateRankingRow
            key={ranking.state}
            ranking={ranking}
            rank={sortBy === 'score' ? index + 1 : undefined}
            isExpanded={expandedState === ranking.state}
            isSelected={selectedState === ranking.state}
            onToggleExpand={() => toggleExpanded(ranking.state)}
            onSelect={onStateSelect ? () => onStateSelect(ranking.state) : undefined}
          />
        ))}
      </div>
    </div>
  )
}

interface StateRankingRowProps {
  ranking: StateRanking
  rank?: number
  isExpanded: boolean
  isSelected: boolean
  onToggleExpand: () => void
  onSelect?: () => void
}

function StateRankingRow({
  ranking,
  rank,
  isExpanded,
  isSelected,
  onToggleExpand,
  onSelect
}: StateRankingRowProps) {
  return (
    <div
      className={`
        border rounded-lg overflow-hidden transition-colors
        ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
      `}
    >
      <div
        className={`
          flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50
          ${isSelected ? 'hover:bg-blue-100' : ''}
        `}
        onClick={onSelect || onToggleExpand}
      >
        {/* Rank */}
        {rank !== undefined && (
          <div className="w-8 text-center">
            <span className="text-lg font-bold text-gray-400">#{rank}</span>
          </div>
        )}

        {/* State Name */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900">
            {formatStateName(ranking.state)}
          </h3>
          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
            <span>{ranking.totalConnections} connections</span>
            <span>{ranking.policies} policies</span>
            <span>{ranking.researchPapers} papers</span>
          </div>
        </div>

        {/* Score Bar */}
        <div className="w-32 hidden md:block">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${ranking.workforceImpactScore}%`,
                backgroundColor: ranking.grade.color
              }}
            />
          </div>
        </div>

        {/* Score */}
        <div className="text-right">
          <div className="text-2xl font-bold" style={{ color: ranking.grade.color }}>
            {ranking.workforceImpactScore}
          </div>
          <GradeBadge grade={ranking.grade.letter} color={ranking.grade.color} />
        </div>

        {/* Expand Button */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleExpand() }}
          className="p-1 text-gray-400 hover:text-gray-600"
        >
          <svg
            className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="p-4 bg-gray-50 border-t">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              label="Positive Rate"
              value={`${Math.round(ranking.positiveConnectionRate * 100)}%`}
            />
            <MetricCard
              label="Avg Strength"
              value={ranking.averageStrength.toFixed(1)}
            />
            <MetricCard
              label="Evidence Score"
              value={ranking.evidenceQualityScore.toFixed(1)}
            />
            <MetricCard
              label="Baseline Score"
              value={ranking.baselineWorkforceScore.toString()}
            />
          </div>

          {ranking.dataQualityFlag && (
            <div className="mt-3 text-sm">
              <span className={`
                px-2 py-1 rounded text-xs
                ${ranking.dataQualityFlag === 'RELIABLE_DATA' ? 'bg-green-100 text-green-800' :
                  ranking.dataQualityFlag === 'LIMITED_DATA' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'}
              `}>
                {ranking.dataQualityFlag.replace('_', ' ')}
              </span>
              {ranking.confidenceLevel && (
                <span className="ml-2 text-gray-500">
                  {ranking.confidenceLevel}% confidence
                </span>
              )}
            </div>
          )}

          <p className="mt-3 text-sm text-gray-600">{ranking.grade.description}</p>
        </div>
      )}
    </div>
  )
}

function GradeBadge({ grade, color, size = 'medium' }: { grade: string; color?: string; size?: 'small' | 'medium' }) {
  const sizeClasses = size === 'small' ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-sm'
  return (
    <span
      className={`inline-flex items-center justify-center ${sizeClasses} rounded-full font-bold text-white`}
      style={{ backgroundColor: color || '#6b7280' }}
    >
      {grade}
    </span>
  )
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="text-lg font-semibold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  )
}

function formatStateName(name: string): string {
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export default StateRankings
