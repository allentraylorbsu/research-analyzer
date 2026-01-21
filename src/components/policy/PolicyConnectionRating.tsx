/**
 * PolicyConnectionRating Component
 * Rate connection strength, evidence quality, and workforce relevance
 */

import { useCallback } from 'react'
import type { ConnectionRating, ConnectionType } from '@/types'

export interface PolicyConnectionRatingProps {
  rating: ConnectionRating
  connectionType: ConnectionType
  onChange: (rating: ConnectionRating, connectionType: ConnectionType) => void
  disabled?: boolean
}

export function PolicyConnectionRating({
  rating,
  connectionType,
  onChange,
  disabled = false
}: PolicyConnectionRatingProps) {
  const handleStrengthChange = useCallback((value: number) => {
    onChange({ ...rating, strengthScore: value }, connectionType)
  }, [rating, connectionType, onChange])

  const handleEvidenceChange = useCallback((value: number) => {
    onChange({ ...rating, evidenceQuality: value }, connectionType)
  }, [rating, connectionType, onChange])

  const handleRelevanceChange = useCallback((value: number) => {
    onChange({ ...rating, workforceRelevance: value }, connectionType)
  }, [rating, connectionType, onChange])

  const handleTypeChange = useCallback((type: ConnectionType) => {
    onChange(rating, type)
  }, [rating, onChange])

  return (
    <div className="space-y-6">
      {/* Connection Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Connection Type
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {(['POSITIVE', 'NEGATIVE', 'NEUTRAL', 'MIXED'] as ConnectionType[]).map(type => (
            <button
              key={type}
              onClick={() => handleTypeChange(type)}
              disabled={disabled}
              className={`
                px-4 py-2 rounded-md text-sm font-medium transition-colors
                ${connectionType === type
                  ? getTypeActiveStyles(type)
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {getTypeIcon(type)} {type}
            </button>
          ))}
        </div>
        <p className="mt-1 text-xs text-gray-500">
          {getTypeDescription(connectionType)}
        </p>
      </div>

      {/* Strength Score */}
      <RatingSlider
        label="Connection Strength"
        description="How strongly does this policy affect the research outcome?"
        value={rating.strengthScore}
        onChange={handleStrengthChange}
        disabled={disabled}
        min={1}
        max={10}
        lowLabel="Weak"
        highLabel="Strong"
      />

      {/* Evidence Quality */}
      <RatingSlider
        label="Evidence Quality"
        description="How well-supported is this connection by the research?"
        value={rating.evidenceQuality}
        onChange={handleEvidenceChange}
        disabled={disabled}
        min={1}
        max={10}
        lowLabel="Limited"
        highLabel="Strong"
      />

      {/* Workforce Relevance */}
      <RatingSlider
        label="Workforce Relevance"
        description="How relevant is this to physician workforce issues?"
        value={rating.workforceRelevance}
        onChange={handleRelevanceChange}
        disabled={disabled}
        min={1}
        max={10}
        lowLabel="Low"
        highLabel="High"
      />

      {/* Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Rating Summary</h4>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900">{rating.strengthScore}</div>
            <div className="text-xs text-gray-500">Strength</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{rating.evidenceQuality}</div>
            <div className="text-xs text-gray-500">Evidence</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{rating.workforceRelevance}</div>
            <div className="text-xs text-gray-500">Relevance</div>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t text-center">
          <div className="text-lg font-semibold text-gray-900">
            Overall: {Math.round((rating.strengthScore + rating.evidenceQuality + rating.workforceRelevance) / 3 * 10) / 10}/10
          </div>
        </div>
      </div>
    </div>
  )
}

interface RatingSliderProps {
  label: string
  description: string
  value: number
  onChange: (value: number) => void
  disabled?: boolean
  min: number
  max: number
  lowLabel: string
  highLabel: string
}

function RatingSlider({
  label,
  description,
  value,
  onChange,
  disabled,
  min,
  max,
  lowLabel,
  highLabel
}: RatingSliderProps) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <span className="text-sm font-semibold text-blue-600">{value}</span>
      </div>
      <p className="text-xs text-gray-500 mb-2">{description}</p>
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-400 w-12">{lowLabel}</span>
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          disabled={disabled}
          className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 disabled:cursor-not-allowed"
        />
        <span className="text-xs text-gray-400 w-12 text-right">{highLabel}</span>
      </div>
    </div>
  )
}

function getTypeActiveStyles(type: ConnectionType): string {
  switch (type) {
    case 'POSITIVE':
      return 'bg-green-100 text-green-800 border-2 border-green-300'
    case 'NEGATIVE':
      return 'bg-red-100 text-red-800 border-2 border-red-300'
    case 'NEUTRAL':
      return 'bg-gray-200 text-gray-800 border-2 border-gray-400'
    case 'MIXED':
      return 'bg-yellow-100 text-yellow-800 border-2 border-yellow-300'
  }
}

function getTypeIcon(type: ConnectionType): string {
  switch (type) {
    case 'POSITIVE':
      return '+'
    case 'NEGATIVE':
      return '-'
    case 'NEUTRAL':
      return '='
    case 'MIXED':
      return '±'
  }
}

function getTypeDescription(type: ConnectionType): string {
  switch (type) {
    case 'POSITIVE':
      return 'The policy has a beneficial effect on the research outcome'
    case 'NEGATIVE':
      return 'The policy has a detrimental effect on the research outcome'
    case 'NEUTRAL':
      return 'The policy has no significant effect on the research outcome'
    case 'MIXED':
      return 'The policy has both positive and negative effects'
  }
}

export default PolicyConnectionRating
