/**
 * ScoringJustificationPanel Component
 * Links research papers to scoring factors to justify weight decisions
 */

import { useState, useCallback } from 'react'
import { Button } from '../common'
import type { ScoringJustification, ResearchPaper } from '@/types'

const SCORING_FACTORS = [
  { id: 'baseline', label: 'Baseline Workforce Data', description: 'HRSA/KFF physician density and workforce metrics' },
  { id: 'policyConnections', label: 'Policy Connections', description: 'Strength and direction of policy-research connections' },
  { id: 'medicaidReimbursement', label: 'Medicaid Reimbursement', description: 'KFF Medicaid-to-Medicare fee index rates' },
  { id: 'evidenceQuality', label: 'Evidence Quality', description: 'Research methodology and evidence strength' },
  { id: 'populationImpact', label: 'Population Impact', description: 'Estimated population affected by policies' }
]

export interface ScoringJustificationPanelProps {
  justifications: ScoringJustification[]
  papers: ResearchPaper[]
  onAddJustification: (justification: ScoringJustification) => void
  onRemoveJustification: (index: number) => void
}

export function ScoringJustificationPanel({
  justifications,
  papers,
  onAddJustification,
  onRemoveJustification
}: ScoringJustificationPanelProps) {
  const [selectedFactorId, setSelectedFactorId] = useState('')
  const [selectedPaperId, setSelectedPaperId] = useState('')
  const [relevantFinding, setRelevantFinding] = useState('')
  const [suggestedWeight, setSuggestedWeight] = useState<string>('')
  const [isAdding, setIsAdding] = useState(false)

  const handleAdd = useCallback(() => {
    if (!selectedFactorId || !selectedPaperId || !relevantFinding.trim()) return

    const paper = papers.find(p => p.id === selectedPaperId)
    if (!paper) return

    onAddJustification({
      factorId: selectedFactorId,
      paperId: selectedPaperId,
      paperTitle: paper.title,
      relevantFinding: relevantFinding.trim(),
      suggestedWeight: suggestedWeight ? parseFloat(suggestedWeight) / 100 : undefined,
      addedAt: new Date()
    })

    // Reset form
    setSelectedFactorId('')
    setSelectedPaperId('')
    setRelevantFinding('')
    setSuggestedWeight('')
    setIsAdding(false)
  }, [selectedFactorId, selectedPaperId, relevantFinding, suggestedWeight, papers, onAddJustification])

  // Group justifications by factor
  const groupedJustifications = SCORING_FACTORS.map(factor => ({
    ...factor,
    justifications: justifications.filter(j => j.factorId === factor.id)
  }))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">Research Justifications</h3>
          <p className="text-sm text-gray-500 mt-1">
            Link uploaded research papers to scoring factors to justify weight decisions
          </p>
        </div>
        {!isAdding && papers.length > 0 && (
          <Button size="small" onClick={() => setIsAdding(true)}>
            Add Justification
          </Button>
        )}
      </div>

      {papers.length === 0 && (
        <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <p className="text-sm text-gray-500">Upload research papers first, then link them here to justify scoring weights.</p>
        </div>
      )}

      {/* Add Justification Form */}
      {isAdding && (
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 space-y-3">
          <h4 className="text-sm font-medium text-blue-900">Link Research to Scoring Factor</h4>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Scoring Factor</label>
            <select
              value={selectedFactorId}
              onChange={(e) => setSelectedFactorId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a factor...</option>
              {SCORING_FACTORS.map(f => (
                <option key={f.id} value={f.id}>{f.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Research Paper</label>
            <select
              value={selectedPaperId}
              onChange={(e) => setSelectedPaperId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a paper...</option>
              {papers.map(p => (
                <option key={p.id} value={p.id}>
                  {p.title.length > 80 ? p.title.substring(0, 80) + '...' : p.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Relevant Finding</label>
            <textarea
              value={relevantFinding}
              onChange={(e) => setRelevantFinding(e.target.value)}
              placeholder="Describe the key finding from this paper that justifies the weight..."
              rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Suggested Weight (optional, 0-100%)
            </label>
            <input
              type="number"
              value={suggestedWeight}
              onChange={(e) => setSuggestedWeight(e.target.value)}
              placeholder="e.g., 25"
              min={0}
              max={100}
              step={5}
              className="w-32 px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-2">
            <Button
              size="small"
              onClick={handleAdd}
              disabled={!selectedFactorId || !selectedPaperId || !relevantFinding.trim()}
            >
              Add
            </Button>
            <Button size="small" variant="secondary" onClick={() => setIsAdding(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Justifications by Factor */}
      {justifications.length > 0 && (
        <div className="space-y-3">
          {groupedJustifications
            .filter(g => g.justifications.length > 0)
            .map(group => (
              <div key={group.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-3 py-2 bg-gray-50 border-b">
                  <span className="text-sm font-medium text-gray-700">{group.label}</span>
                  <span className="text-xs text-gray-400 ml-2">{group.description}</span>
                </div>
                <div className="divide-y divide-gray-100">
                  {group.justifications.map((j, idx) => {
                    const globalIdx = justifications.indexOf(j)
                    return (
                      <div key={idx} className="px-3 py-2 flex items-start gap-2">
                        <svg className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                        </svg>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-800 truncate">{j.paperTitle}</p>
                          <p className="text-xs text-gray-600 mt-0.5">{j.relevantFinding}</p>
                          {j.suggestedWeight != null && (
                            <span className="inline-block mt-1 text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">
                              Suggests {Math.round(j.suggestedWeight * 100)}% weight
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => onRemoveJustification(globalIdx)}
                          className="p-1 text-gray-400 hover:text-red-500 flex-shrink-0"
                          title="Remove justification"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))
          }
        </div>
      )}
    </div>
  )
}

export default ScoringJustificationPanel
