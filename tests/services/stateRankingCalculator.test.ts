/**
 * State Ranking Calculator Tests
 */

import { describe, it, expect } from 'vitest'
import {
  getWorkforceImpactGrade,
  calculateStateRankings,
  sortStateRankings,
  generateMockStateRankings,
  getRankingSummary
} from '@/services/stateRankingCalculator'
import type { PolicyConnection, Policy, StateBaselineWorkforce } from '@/types'

describe('stateRankingCalculator', () => {
  describe('getWorkforceImpactGrade', () => {
    it('should return A+ for scores >= 90', () => {
      const grade = getWorkforceImpactGrade(95)
      expect(grade.letter).toBe('A+')
      expect(grade.color).toBe('#28a745')
    })

    it('should return A for scores 85-89', () => {
      const grade = getWorkforceImpactGrade(87)
      expect(grade.letter).toBe('A')
    })

    it('should return A- for scores 80-84', () => {
      const grade = getWorkforceImpactGrade(82)
      expect(grade.letter).toBe('A-')
    })

    it('should return B+ for scores 75-79', () => {
      const grade = getWorkforceImpactGrade(77)
      expect(grade.letter).toBe('B+')
      expect(grade.color).toBe('#ffc107')
    })

    it('should return B for scores 70-74', () => {
      const grade = getWorkforceImpactGrade(72)
      expect(grade.letter).toBe('B')
    })

    it('should return B- for scores 65-69', () => {
      const grade = getWorkforceImpactGrade(67)
      expect(grade.letter).toBe('B-')
    })

    it('should return C+ for scores 60-64', () => {
      const grade = getWorkforceImpactGrade(62)
      expect(grade.letter).toBe('C+')
      expect(grade.color).toBe('#fd7e14')
    })

    it('should return C for scores 55-59', () => {
      const grade = getWorkforceImpactGrade(57)
      expect(grade.letter).toBe('C')
    })

    it('should return C- for scores 50-54', () => {
      const grade = getWorkforceImpactGrade(52)
      expect(grade.letter).toBe('C-')
    })

    it('should return D for scores 40-49', () => {
      const grade = getWorkforceImpactGrade(45)
      expect(grade.letter).toBe('D')
      expect(grade.color).toBe('#dc3545')
    })

    it('should return F for scores below 40', () => {
      const grade = getWorkforceImpactGrade(30)
      expect(grade.letter).toBe('F')
    })

    it('should handle edge cases', () => {
      expect(getWorkforceImpactGrade(100).letter).toBe('A+')
      expect(getWorkforceImpactGrade(0).letter).toBe('F')
      expect(getWorkforceImpactGrade(90).letter).toBe('A+')
      expect(getWorkforceImpactGrade(89).letter).toBe('A')
    })
  })

  describe('calculateStateRankings', () => {
    const mockConnections: PolicyConnection[] = [
      {
        connectionId: '1',
        policyId: 'p1',
        paperId: 'paper1',
        stateJurisdiction: 'CALIFORNIA',
        connectionType: 'POSITIVE',
        strengthScore: 8,
        evidenceQuality: 9,
        workforceRelevance: 7,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        connectionId: '2',
        policyId: 'p2',
        paperId: 'paper2',
        stateJurisdiction: 'CALIFORNIA',
        connectionType: 'POSITIVE',
        strengthScore: 7,
        evidenceQuality: 8,
        workforceRelevance: 8,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        connectionId: '3',
        policyId: 'p3',
        paperId: 'paper3',
        stateJurisdiction: 'TEXAS',
        connectionType: 'NEGATIVE',
        strengthScore: 5,
        evidenceQuality: 6,
        workforceRelevance: 5,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    const mockPolicies: Policy[] = [
      {
        policyId: 'p1',
        title: 'Healthcare Workforce Act',
        jurisdiction: 'CALIFORNIA',
        status: 'enacted',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        policyId: 'p2',
        title: 'Physician Retention Program',
        jurisdiction: 'CALIFORNIA',
        status: 'signed',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        policyId: 'p3',
        title: 'Budget Cuts',
        jurisdiction: 'TEXAS',
        status: 'enacted',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    it('should calculate rankings from connections', () => {
      const rankings = calculateStateRankings(mockConnections, mockPolicies)

      expect(rankings).toHaveLength(2)
      expect(rankings[0].state).toBe('CALIFORNIA')
      expect(rankings[0].totalConnections).toBe(2)
      expect(rankings[0].positiveConnections).toBe(2)
    })

    it('should sort rankings by score descending', () => {
      const rankings = calculateStateRankings(mockConnections, mockPolicies)

      expect(rankings[0].workforceImpactScore).toBeGreaterThanOrEqual(
        rankings[1].workforceImpactScore
      )
    })

    it('should calculate positive connection rate', () => {
      const rankings = calculateStateRankings(mockConnections, mockPolicies)
      const california = rankings.find(r => r.state === 'CALIFORNIA')

      expect(california?.positiveConnectionRate).toBe(1) // 2/2 = 100%
    })

    it('should handle empty connections', () => {
      const rankings = calculateStateRankings([], mockPolicies)
      expect(rankings).toHaveLength(0)
    })

    it('should include baseline data when provided', () => {
      const baselineData: StateBaselineWorkforce[] = [
        {
          stateName: 'NEW YORK',
          baselineWorkforceScore: 75,
          physicianDensity: 3.5
        }
      ]

      const rankings = calculateStateRankings(mockConnections, mockPolicies, baselineData)
      const newYork = rankings.find(r => r.state === 'NEW YORK')

      expect(newYork).toBeDefined()
      expect(newYork?.hasBaselineData).toBe(true)
      expect(newYork?.baselineWorkforceScore).toBe(75)
    })

    it('should assign grades to all rankings', () => {
      const rankings = calculateStateRankings(mockConnections, mockPolicies)

      rankings.forEach(ranking => {
        expect(ranking.grade).toBeDefined()
        expect(ranking.grade.letter).toBeDefined()
        expect(ranking.grade.color).toBeDefined()
      })
    })
  })

  describe('sortStateRankings', () => {
    const mockRankings = [
      { state: 'CALIFORNIA', workforceImpactScore: 85, totalConnections: 10, policies: 5 },
      { state: 'TEXAS', workforceImpactScore: 70, totalConnections: 15, policies: 8 },
      { state: 'FLORIDA', workforceImpactScore: 90, totalConnections: 5, policies: 3 }
    ] as any[]

    it('should sort by score (default)', () => {
      const sorted = sortStateRankings(mockRankings, 'score')
      expect(sorted[0].state).toBe('FLORIDA')
      expect(sorted[1].state).toBe('CALIFORNIA')
      expect(sorted[2].state).toBe('TEXAS')
    })

    it('should sort alphabetically', () => {
      const sorted = sortStateRankings(mockRankings, 'alpha')
      expect(sorted[0].state).toBe('CALIFORNIA')
      expect(sorted[1].state).toBe('FLORIDA')
      expect(sorted[2].state).toBe('TEXAS')
    })

    it('should sort by connections', () => {
      const sorted = sortStateRankings(mockRankings, 'connections')
      expect(sorted[0].state).toBe('TEXAS')
      expect(sorted[0].totalConnections).toBe(15)
    })

    it('should sort by policies', () => {
      const sorted = sortStateRankings(mockRankings, 'policies')
      expect(sorted[0].state).toBe('TEXAS')
      expect(sorted[0].policies).toBe(8)
    })
  })

  describe('generateMockStateRankings', () => {
    it('should generate rankings for provided states', () => {
      const states = ['CALIFORNIA', 'TEXAS', 'NEW YORK']
      const rankings = generateMockStateRankings(states)

      expect(rankings).toHaveLength(3)
      expect(rankings.map(r => r.state)).toEqual(expect.arrayContaining(states))
    })

    it('should assign scores between 60-100', () => {
      const rankings = generateMockStateRankings(['CALIFORNIA'])

      rankings.forEach(r => {
        expect(r.workforceImpactScore).toBeGreaterThanOrEqual(60)
        expect(r.workforceImpactScore).toBeLessThanOrEqual(100)
      })
    })

    it('should include grades', () => {
      const rankings = generateMockStateRankings(['CALIFORNIA'])
      expect(rankings[0].grade).toBeDefined()
    })
  })

  describe('getRankingSummary', () => {
    it('should calculate summary statistics', () => {
      const rankings = [
        { workforceImpactScore: 90, grade: { letter: 'A+' } },
        { workforceImpactScore: 80, grade: { letter: 'A-' } },
        { workforceImpactScore: 70, grade: { letter: 'B' } }
      ] as any[]

      const summary = getRankingSummary(rankings)

      expect(summary.totalStates).toBe(3)
      expect(summary.averageScore).toBe(80)
      expect(summary.highestScore).toBe(90)
      expect(summary.lowestScore).toBe(70)
    })

    it('should count grade distribution', () => {
      const rankings = [
        { workforceImpactScore: 90, grade: { letter: 'A+' } },
        { workforceImpactScore: 85, grade: { letter: 'A' } },
        { workforceImpactScore: 82, grade: { letter: 'A-' } }
      ] as any[]

      const summary = getRankingSummary(rankings)

      expect(summary.gradeDistribution['A+']).toBe(1)
      expect(summary.gradeDistribution['A']).toBe(1)
      expect(summary.gradeDistribution['A-']).toBe(1)
    })

    it('should handle empty rankings', () => {
      const summary = getRankingSummary([])

      expect(summary.totalStates).toBe(0)
      expect(summary.averageScore).toBe(0)
    })
  })
})
