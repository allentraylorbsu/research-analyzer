/**
 * StateRankings Component
 * Display state workforce impact rankings with grades
 * Includes adjustable scoring weights and Medicaid reimbursement display
 */

import { useState, useCallback, useMemo } from 'react'
import { Button, LoadingSpinner } from '../common'
import type { StateRanking, RankingSortBy, ScoringWeights, ScoringJustification } from '@/types'
import { DEFAULT_SCORING_WEIGHTS } from '@/services/stateRankingCalculator'

export interface StateRankingsProps {
  rankings: StateRanking[]
  isLoading?: boolean
  onRefresh?: () => void
  onStateSelect?: (state: string) => void
  selectedState?: string
  scoringWeights?: ScoringWeights
  onWeightsChange?: (weights: ScoringWeights) => void
  scoringJustifications?: ScoringJustification[]
}

export function StateRankings({
  rankings,
  isLoading = false,
  onRefresh,
  onStateSelect,
  selectedState,
  scoringWeights = DEFAULT_SCORING_WEIGHTS,
  onWeightsChange,
  scoringJustifications = []
}: StateRankingsProps) {
  const [sortBy, setSortBy] = useState<RankingSortBy>('score')
  const [expandedState, setExpandedState] = useState<string | null>(null)
  const [showWeights, setShowWeights] = useState(false)

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

  const totalWeight = useMemo(() => {
    return (Object.values(scoringWeights) as number[]).reduce((sum, w) => sum + w, 0)
  }, [scoringWeights])

  const handleWeightChange = useCallback((key: keyof ScoringWeights, value: number) => {
    if (!onWeightsChange) return
    onWeightsChange({ ...scoringWeights, [key]: value })
  }, [scoringWeights, onWeightsChange])

  const handleResetWeights = useCallback(() => {
    if (!onWeightsChange) return
    onWeightsChange({ ...DEFAULT_SCORING_WEIGHTS })
  }, [onWeightsChange])

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
      {/* Scoring Weights Controls */}
      {onWeightsChange && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setShowWeights(!showWeights)}
            className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              <span className="font-medium text-gray-700">Scoring Weights</span>
              {Math.abs(totalWeight - 1.0) > 0.01 && (
                <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full">
                  Total: {(totalWeight * 100).toFixed(0)}% (should be 100%)
                </span>
              )}
            </div>
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform ${showWeights ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showWeights && (
            <div className="p-4 bg-gray-50 border-t space-y-4">
              <p className="text-xs text-gray-500">
                Adjust how much each factor contributes to the final score. Weights should total 100%.
              </p>

              <WeightSlider
                label="Baseline Workforce Data"
                description="HRSA/KFF baseline workforce metrics"
                value={scoringWeights.baseline}
                onChange={(v) => handleWeightChange('baseline', v)}
                justifications={scoringJustifications.filter(j => j.factorId === 'baseline')}
              />
              <WeightSlider
                label="Policy Connections"
                description="Strength and direction of policy-research connections"
                value={scoringWeights.policyConnections}
                onChange={(v) => handleWeightChange('policyConnections', v)}
                justifications={scoringJustifications.filter(j => j.factorId === 'policyConnections')}
              />
              <WeightSlider
                label="Medicaid Reimbursement"
                description="KFF Medicaid-to-Medicare fee index (2024)"
                value={scoringWeights.medicaidReimbursement}
                onChange={(v) => handleWeightChange('medicaidReimbursement', v)}
                justifications={scoringJustifications.filter(j => j.factorId === 'medicaidReimbursement')}
              />
              <WeightSlider
                label="Evidence Quality"
                description="Quality and strength of supporting research evidence"
                value={scoringWeights.evidenceQuality}
                onChange={(v) => handleWeightChange('evidenceQuality', v)}
                justifications={scoringJustifications.filter(j => j.factorId === 'evidenceQuality')}
              />
              <WeightSlider
                label="Population Impact"
                description="Estimated population affected by policies"
                value={scoringWeights.populationImpact}
                onChange={(v) => handleWeightChange('populationImpact', v)}
                justifications={scoringJustifications.filter(j => j.factorId === 'populationImpact')}
              />

              <div className="flex items-center justify-between pt-2 border-t">
                <div className={`text-sm font-medium ${Math.abs(totalWeight - 1.0) > 0.01 ? 'text-red-600' : 'text-green-600'}`}>
                  Total: {(totalWeight * 100).toFixed(0)}%
                </div>
                <Button size="small" variant="secondary" onClick={handleResetWeights}>
                  Reset to Defaults
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

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

          {/* Grade Scale Legend */}
          <div className="mt-4 pt-4 border-t border-blue-200">
            <h4 className="text-sm font-medium text-gray-700 mb-2 text-center">Grade Scale</h4>
            <div className="flex flex-wrap justify-center gap-2 text-xs">
              <GradeScaleItem grade="A+" range="90-100" color="#28a745" />
              <GradeScaleItem grade="A" range="85-89" color="#28a745" />
              <GradeScaleItem grade="A-" range="80-84" color="#28a745" />
              <GradeScaleItem grade="B+" range="75-79" color="#ffc107" />
              <GradeScaleItem grade="B" range="70-74" color="#ffc107" />
              <GradeScaleItem grade="B-" range="65-69" color="#ffc107" />
              <GradeScaleItem grade="C+" range="60-64" color="#fd7e14" />
              <GradeScaleItem grade="C" range="55-59" color="#fd7e14" />
              <GradeScaleItem grade="C-" range="50-54" color="#fd7e14" />
              <GradeScaleItem grade="D" range="40-49" color="#dc3545" />
              <GradeScaleItem grade="F" range="0-39" color="#dc3545" />
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

// ── Weight Slider Component ──────────────────────────────────────────

interface WeightSliderProps {
  label: string
  description: string
  value: number
  onChange: (value: number) => void
  justifications?: ScoringJustification[]
}

function WeightSlider({ label, description, value, onChange, justifications = [] }: WeightSliderProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div>
          <span className="text-sm font-medium text-gray-700">{label}</span>
          <span className="text-xs text-gray-400 ml-2">{description}</span>
        </div>
        <span className="text-sm font-mono font-bold text-gray-900 w-12 text-right">
          {Math.round(value * 100)}%
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={Math.round(value * 100)}
        onChange={(e) => onChange(parseInt(e.target.value) / 100)}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
      />
      {justifications.length > 0 && (
        <div className="mt-1 space-y-1">
          {justifications.map((j, i) => (
            <div key={i} className="flex items-start gap-1 text-xs text-blue-600">
              <svg className="w-3 h-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span>
                <strong>{j.paperTitle}:</strong> {j.relevantFinding}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── State Ranking Row ────────────────────────────────────────────────

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

        {/* Score & Grade */}
        <div className="text-right flex items-center gap-2">
          <GradeBadge grade={ranking.grade.letter} color={ranking.grade.color} />
          <div className="text-2xl font-bold" style={{ color: ranking.grade.color }}>
            {ranking.workforceImpactScore}
          </div>
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
        <div className="p-4 bg-gray-50 border-t space-y-4">
          {/* Core Metrics */}
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

          {/* Medicaid Reimbursement */}
          {ranking.medicaidReimbursementScore !== undefined && (
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Medicaid Reimbursement</h4>
                  <p className="text-xs text-gray-400 mt-0.5">KFF Medicaid-to-Medicare Fee Index (2024)</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold" style={{ color: getReimbursementColor(ranking.medicaidReimbursementRatio) }}>
                    {ranking.medicaidReimbursementRatio != null
                      ? `${ranking.medicaidReimbursementRatio.toFixed(2)}`
                      : 'N/A'}
                  </div>
                  <div className="text-xs text-gray-500">
                    Score: {ranking.medicaidReimbursementScore}/100
                  </div>
                </div>
              </div>
              {ranking.medicaidReimbursementRatio != null && (
                <div className="mt-2">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(ranking.medicaidReimbursementRatio * 100, 100)}%`,
                        backgroundColor: getReimbursementColor(ranking.medicaidReimbursementRatio)
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>0%</span>
                    <span className="text-gray-500 font-medium">
                      {ranking.medicaidReimbursementRatio >= 1.0
                        ? 'At or above Medicare parity'
                        : ranking.medicaidReimbursementRatio >= 0.80
                          ? 'Near CMS target (80%)'
                          : ranking.medicaidReimbursementRatio >= 0.65
                            ? 'Below CMS target'
                            : 'Low reimbursement'}
                    </span>
                    <span>100%+</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Score Breakdown */}
          {ranking.totalConnections > 0 && (
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Score Breakdown</h4>
              <div className="space-y-1.5">
                <ScoreBreakdownRow
                  label="Baseline Workforce"
                  score={ranking.baselineWorkforceScore}
                />
                <ScoreBreakdownRow
                  label="Policy Impact"
                  score={ranking.policyImpactScore}
                />
                {ranking.medicaidReimbursementScore !== undefined && (
                  <ScoreBreakdownRow
                    label="Medicaid Reimbursement"
                    score={ranking.medicaidReimbursementScore}
                  />
                )}
                {ranking.evidenceStrengthScore !== undefined && (
                  <ScoreBreakdownRow
                    label="Evidence Strength"
                    score={ranking.evidenceStrengthScore}
                  />
                )}
                {ranking.populationImpactScore !== undefined && (
                  <ScoreBreakdownRow
                    label="Population Impact"
                    score={ranking.populationImpactScore}
                  />
                )}
              </div>
            </div>
          )}

          {/* Data Quality & Confidence */}
          {ranking.dataQualityFlag && (
            <div className="flex items-center gap-3 text-sm">
              <span className={`
                px-2 py-1 rounded text-xs
                ${ranking.dataQualityFlag === 'RELIABLE_DATA' ? 'bg-green-100 text-green-800' :
                  ranking.dataQualityFlag === 'LIMITED_DATA' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'}
              `}>
                {ranking.dataQualityFlag.replace('_', ' ')}
              </span>
              {ranking.confidenceLevel != null && (
                <span className="text-gray-500">
                  {ranking.confidenceLevel}% confidence
                </span>
              )}
              {ranking.scoreRangeLow != null && ranking.scoreRangeHigh != null && (
                <span className="text-gray-400 text-xs">
                  Range: {ranking.scoreRangeLow}-{ranking.scoreRangeHigh}
                </span>
              )}
            </div>
          )}

          <p className="text-sm text-gray-600">{ranking.grade.description}</p>
        </div>
      )}
    </div>
  )
}

// ── Score Breakdown Row ──────────────────────────────────────────────

function ScoreBreakdownRow({ label, score }: { label: string; score: number }) {
  const clampedScore = Math.max(0, Math.min(score, 100))
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 w-36 flex-shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-blue-400"
          style={{ width: `${clampedScore}%` }}
        />
      </div>
      <span className="text-xs font-mono text-gray-600 w-8 text-right">{Math.round(score)}</span>
    </div>
  )
}

// ── Helper Components ────────────────────────────────────────────────

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

function GradeScaleItem({ grade, range, color }: { grade: string; range: string; color: string }) {
  return (
    <div className="flex items-center gap-1 px-2 py-1 bg-white rounded border border-gray-200">
      <span className="font-bold" style={{ color }}>{grade}</span>
      <span className="text-gray-500">{range}</span>
    </div>
  )
}

// ── Utility Functions ────────────────────────────────────────────────

function getReimbursementColor(ratio: number | undefined | null): string {
  if (ratio == null) return '#6b7280'
  if (ratio >= 1.0) return '#28a745'
  if (ratio >= 0.80) return '#ffc107'
  if (ratio >= 0.65) return '#fd7e14'
  return '#dc3545'
}

function formatStateName(name: string): string {
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export default StateRankings
