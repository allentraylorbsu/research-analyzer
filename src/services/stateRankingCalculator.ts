/**
 * State Ranking Calculator Service
 * Calculates workforce impact scores and rankings for US states
 */

import type {
  StateRanking,
  WorkforceGrade,
  StateBaselineWorkforce,
  PolicyConnection,
  Policy
} from '@/types'

/**
 * Get workforce impact grade based on score
 */
export function getWorkforceImpactGrade(score: number): WorkforceGrade {
  if (score >= 90) return { letter: 'A+', color: '#28a745', description: 'Excellent workforce policies' }
  if (score >= 85) return { letter: 'A', color: '#28a745', description: 'Very strong workforce impact' }
  if (score >= 80) return { letter: 'A-', color: '#28a745', description: 'Strong workforce support' }
  if (score >= 75) return { letter: 'B+', color: '#ffc107', description: 'Good workforce policies' }
  if (score >= 70) return { letter: 'B', color: '#ffc107', description: 'Adequate workforce support' }
  if (score >= 65) return { letter: 'B-', color: '#ffc107', description: 'Mixed workforce impact' }
  if (score >= 60) return { letter: 'C+', color: '#fd7e14', description: 'Limited workforce benefits' }
  if (score >= 55) return { letter: 'C', color: '#fd7e14', description: 'Neutral workforce impact' }
  if (score >= 50) return { letter: 'C-', color: '#fd7e14', description: 'Minimal workforce support' }
  if (score >= 40) return { letter: 'D', color: '#dc3545', description: 'Concerning workforce policies' }
  return { letter: 'F', color: '#dc3545', description: 'Critical workforce deficiencies' }
}

interface StateScoreAccumulator {
  state: string
  totalConnections: number
  positiveConnections: number
  negativeConnections: number
  totalStrengthScore: number
  workforceRelevanceTotal: number
  strongEvidence: number
  moderateEvidence: number
  weakEvidence: number
  policies: Set<string>
  researchPapers: Set<string>
}

/**
 * Calculate state rankings from connections and policies
 */
export function calculateStateRankings(
  connections: PolicyConnection[],
  policies: Policy[],
  baselineData: StateBaselineWorkforce[] = []
): StateRanking[] {
  // Create baseline lookup
  const baselineLookup: Record<string, StateBaselineWorkforce> = {}
  baselineData.forEach(baseline => {
    baselineLookup[baseline.stateName] = baseline
  })

  // Aggregate scores by state
  const stateScores: Record<string, StateScoreAccumulator> = {}

  connections.forEach(conn => {
    const state = conn.stateJurisdiction
    if (!stateScores[state]) {
      stateScores[state] = {
        state,
        totalConnections: 0,
        positiveConnections: 0,
        negativeConnections: 0,
        totalStrengthScore: 0,
        workforceRelevanceTotal: 0,
        strongEvidence: 0,
        moderateEvidence: 0,
        weakEvidence: 0,
        policies: new Set(),
        researchPapers: new Set()
      }
    }

    const score = stateScores[state]
    score.totalConnections++
    score.totalStrengthScore += conn.strengthScore
    score.workforceRelevanceTotal += conn.workforceRelevance || 5

    if (conn.connectionType === 'POSITIVE') score.positiveConnections++
    if (conn.connectionType === 'NEGATIVE') score.negativeConnections++

    // Evidence quality categorization
    const evidenceScore = conn.evidenceQuality || 5
    if (evidenceScore >= 8) score.strongEvidence++
    else if (evidenceScore >= 5) score.moderateEvidence++
    else score.weakEvidence++

    score.policies.add(conn.policyId)
    score.researchPapers.add(conn.paperId)
  })

  // Calculate rankings for states with connections
  const rankings: StateRanking[] = Object.values(stateScores).map(score => {
    return calculateStateRankingFromScore(score, policies, baselineLookup)
  })

  // Add states with baseline data but no connections
  baselineData.forEach(baseline => {
    const stateName = baseline.stateName
    if (!rankings.find(r => r.state === stateName)) {
      rankings.push(createBaselineOnlyRanking(baseline))
    }
  })

  // Sort by workforce impact score
  return rankings.sort((a, b) => b.workforceImpactScore - a.workforceImpactScore)
}

/**
 * Calculate ranking for a single state
 */
function calculateStateRankingFromScore(
  score: StateScoreAccumulator,
  policies: Policy[],
  baselineLookup: Record<string, StateBaselineWorkforce>
): StateRanking {
  const avgStrength = score.totalConnections > 0
    ? score.totalStrengthScore / score.totalConnections
    : 0
  const avgWorkforceRelevance = score.totalConnections > 0
    ? score.workforceRelevanceTotal / score.totalConnections
    : 0
  const positiveRate = score.totalConnections > 0
    ? score.positiveConnections / score.totalConnections
    : 0

  // Evidence quality scoring
  const baseEvidenceQuality = (
    score.strongEvidence * 3 +
    score.moderateEvidence * 2 +
    score.weakEvidence * 1
  ) / Math.max(score.totalConnections, 1)

  const researchQualityBonus = Math.min(score.researchPapers.size * 0.1, 1.0)
  const methodologyStrengthFactor = avgStrength > 7 ? 1.2 : avgStrength < 4 ? 0.8 : 1.0
  const evidenceQualityScore = baseEvidenceQuality * methodologyStrengthFactor + researchQualityBonus

  // Get baseline data
  const baseline = baselineLookup[score.state]
  const baselineScore = baseline?.baselineWorkforceScore || 50

  // Population impact scaling
  const statePolicies = policies.filter(p => p.jurisdiction === score.state)
  const averagePopulationAffected = statePolicies.length > 0
    ? statePolicies.reduce((sum, p) => sum + (p.estimatedPopulationAffected || 100000), 0) / statePolicies.length
    : 100000
  const populationScaleFactor = Math.min(averagePopulationAffected / 500000, 2.0)

  // Healthcare workforce shortage adjustment
  const shortageAreaBonus = baseline?.physicianDensity && baseline.physicianDensity < 2.5 ? 1.15 : 1.0

  // Policy implementation status scoring
  const implementedPolicies = statePolicies.filter(p =>
    p.status?.toLowerCase().includes('enacted') ||
    p.status?.toLowerCase().includes('signed') ||
    p.status?.toLowerCase().includes('effective')
  ).length
  const totalPolicies = statePolicies.length || 1
  const implementationRate = implementedPolicies / totalPolicies
  const implementationStatusMultiplier = 0.7 + (implementationRate * 0.6)

  // Policy impact score calculation
  let policyImpactScore = 50
  if (score.totalConnections > 0) {
    const negativeRate = score.negativeConnections / score.totalConnections
    const netPositiveRate = positiveRate - negativeRate
    let basePolicy = 50 + (netPositiveRate * 25)

    const strengthBonus = (avgStrength - 5) * 3
    const relevanceBonus = (avgWorkforceRelevance - 5) * 3
    const evidenceBonus = (evidenceQualityScore - 1.5) * 5
    const implementationBonus = (implementationStatusMultiplier - 1) * 20
    const populationBonus = (populationScaleFactor - 1) * 10

    policyImpactScore = Math.max(0, Math.min(
      basePolicy + strengthBonus + relevanceBonus + evidenceBonus + implementationBonus + populationBonus,
      100
    ))
  }

  // Multi-dimensional scores
  const policyEffectivenessScore = Math.round(policyImpactScore * implementationStatusMultiplier)
  const evidenceStrengthScore = Math.round(evidenceQualityScore * 20)
  const populationImpactScore = Math.round(populationScaleFactor * 50)

  // Combined score calculation
  let combinedScore = baselineScore
  if (score.totalConnections > 0) {
    const policyWeight = 0.35
    const evidenceWeight = 0.15
    const populationWeight = 0.10
    const baselineWeight = 1 - (policyWeight + evidenceWeight + populationWeight)

    combinedScore = Math.round(
      (baselineScore * baselineWeight) +
      (policyImpactScore * policyWeight) +
      (evidenceStrengthScore * evidenceWeight) +
      (populationImpactScore * populationWeight)
    ) * shortageAreaBonus
  }

  const workforceImpactScore = Math.max(0, Math.min(Math.round(combinedScore), 100))

  // Confidence metrics
  const dataPointsCount = score.totalConnections + (baseline ? 1 : 0) + score.researchPapers.size
  const minDataPoints = 3
  const confidenceLevel = Math.min(dataPointsCount / minDataPoints, 1.0)
  const uncertaintyRange = Math.round((1 - confidenceLevel) * 15)
  const dataQualityFlag = dataPointsCount < minDataPoints
    ? 'INSUFFICIENT_DATA' as const
    : dataPointsCount < 6
      ? 'LIMITED_DATA' as const
      : 'RELIABLE_DATA' as const

  return {
    state: score.state,
    workforceImpactScore,
    grade: getWorkforceImpactGrade(workforceImpactScore),
    totalConnections: score.totalConnections,
    positiveConnections: score.positiveConnections,
    negativeConnections: score.negativeConnections,
    averageStrength: avgStrength,
    averageWorkforceRelevance: avgWorkforceRelevance,
    positiveConnectionRate: positiveRate,
    evidenceQualityScore,
    strongEvidence: score.strongEvidence,
    moderateEvidence: score.moderateEvidence,
    weakEvidence: score.weakEvidence,
    policies: score.policies.size,
    researchPapers: score.researchPapers.size,
    baselineWorkforceScore: baselineScore,
    policyImpactScore: Math.round(policyImpactScore),
    hasBaselineData: !!baseline,
    policyEffectivenessScore,
    evidenceStrengthScore,
    populationImpactScore,
    workforceSupplyScore: baselineScore,
    implementationRate: Math.round(implementationRate * 100),
    implementationStatusMultiplier,
    populationScaleFactor,
    shortageAreaBonus,
    averagePopulationAffected,
    confidenceLevel: Math.round(confidenceLevel * 100),
    uncertaintyRange,
    dataQualityFlag,
    dataPointsCount,
    scoreRangeLow: Math.max(0, workforceImpactScore - uncertaintyRange),
    scoreRangeHigh: Math.min(100, workforceImpactScore + uncertaintyRange)
  }
}

/**
 * Create ranking for state with only baseline data
 */
function createBaselineOnlyRanking(baseline: StateBaselineWorkforce): StateRanking {
  const score = Math.round(baseline.baselineWorkforceScore || 50)
  return {
    state: baseline.stateName,
    workforceImpactScore: score,
    grade: getWorkforceImpactGrade(score),
    totalConnections: 0,
    positiveConnections: 0,
    negativeConnections: 0,
    averageStrength: 0,
    averageWorkforceRelevance: 0,
    positiveConnectionRate: 0,
    evidenceQualityScore: 0,
    strongEvidence: 0,
    moderateEvidence: 0,
    weakEvidence: 0,
    policies: 0,
    researchPapers: 0,
    baselineWorkforceScore: baseline.baselineWorkforceScore,
    policyImpactScore: 0,
    hasBaselineData: true
  }
}

/**
 * Sort rankings by different criteria
 */
export function sortStateRankings(
  rankings: StateRanking[],
  sortBy: 'score' | 'alpha' | 'connections' | 'policies' = 'score'
): StateRanking[] {
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
}

/**
 * Generate mock state rankings for demonstration
 */
export function generateMockStateRankings(states: string[]): StateRanking[] {
  return states.map(state => {
    const score = Math.floor(Math.random() * 40) + 60
    return {
      state,
      workforceImpactScore: score,
      grade: getWorkforceImpactGrade(score),
      totalConnections: Math.floor(Math.random() * 20) + 5,
      positiveConnections: Math.floor(Math.random() * 15) + 3,
      negativeConnections: Math.floor(Math.random() * 5),
      averageStrength: parseFloat((Math.random() * 4 + 6).toFixed(1)),
      averageWorkforceRelevance: parseFloat((Math.random() * 4 + 6).toFixed(1)),
      positiveConnectionRate: parseFloat((Math.random() * 0.4 + 0.5).toFixed(2)),
      evidenceQualityScore: parseFloat((Math.random() * 2 + 1.5).toFixed(2)),
      strongEvidence: Math.floor(Math.random() * 5) + 2,
      moderateEvidence: Math.floor(Math.random() * 8) + 3,
      weakEvidence: Math.floor(Math.random() * 3),
      policies: Math.floor(Math.random() * 15) + 5,
      researchPapers: Math.floor(Math.random() * 10) + 3,
      baselineWorkforceScore: 50,
      policyImpactScore: Math.floor(Math.random() * 30) + 40,
      hasBaselineData: false
    }
  }).sort((a, b) => b.workforceImpactScore - a.workforceImpactScore)
}

/**
 * Get state ranking summary statistics
 */
export function getRankingSummary(rankings: StateRanking[]): {
  totalStates: number
  averageScore: number
  highestScore: number
  lowestScore: number
  statesWithData: number
  gradeDistribution: Record<string, number>
} {
  if (rankings.length === 0) {
    return {
      totalStates: 0,
      averageScore: 0,
      highestScore: 0,
      lowestScore: 0,
      statesWithData: 0,
      gradeDistribution: {}
    }
  }

  const scores = rankings.map(r => r.workforceImpactScore)
  const gradeDistribution: Record<string, number> = {}

  rankings.forEach(r => {
    const letter = r.grade.letter
    gradeDistribution[letter] = (gradeDistribution[letter] || 0) + 1
  })

  return {
    totalStates: rankings.length,
    averageScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    highestScore: Math.max(...scores),
    lowestScore: Math.min(...scores),
    statesWithData: rankings.filter(r => r.totalConnections > 0).length,
    gradeDistribution
  }
}

export default {
  getWorkforceImpactGrade,
  calculateStateRankings,
  sortStateRankings,
  generateMockStateRankings,
  getRankingSummary
}
