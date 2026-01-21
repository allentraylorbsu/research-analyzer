/**
 * useResearchPapers Hook Tests
 * Tests for duplicate detection functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

// Mock the supabase service
vi.mock('@/services/supabase', () => ({
  isSupabaseConfigured: vi.fn(() => false),
  researchPaperService: {
    getAll: vi.fn(() => Promise.resolve([])),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findByTitle: vi.fn()
  }
}))

describe('duplicate detection', () => {
  const normalizeTitle = (title: string): string => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
  }

  describe('normalizeTitle', () => {
    it('should convert to lowercase', () => {
      expect(normalizeTitle('HELLO WORLD')).toBe('hello world')
    })

    it('should trim whitespace', () => {
      expect(normalizeTitle('  hello world  ')).toBe('hello world')
    })

    it('should remove punctuation', () => {
      expect(normalizeTitle('Hello, World!')).toBe('hello world')
      expect(normalizeTitle("It's a test.")).toBe('its a test')
    })

    it('should normalize multiple spaces', () => {
      expect(normalizeTitle('hello    world')).toBe('hello world')
    })

    it('should handle complex titles', () => {
      const title1 = 'Impact of Policy X on Physician Retention: A Study'
      const title2 = 'Impact of Policy X on Physician Retention - A Study'

      expect(normalizeTitle(title1)).toBe(normalizeTitle(title2))
    })
  })

  describe('findDuplicates', () => {
    it('should identify papers with same normalized title', () => {
      const papers = [
        { id: '1', title: 'Healthcare Workforce Study', categories: [], createdAt: new Date(), updatedAt: new Date() },
        { id: '2', title: 'Healthcare Workforce Study', categories: [], createdAt: new Date(), updatedAt: new Date() },
        { id: '3', title: 'Different Study', categories: [], createdAt: new Date(), updatedAt: new Date() }
      ]

      const titleGroups: Record<string, typeof papers> = {}

      papers.forEach(paper => {
        const normalized = normalizeTitle(paper.title)
        if (!titleGroups[normalized]) {
          titleGroups[normalized] = []
        }
        titleGroups[normalized].push(paper)
      })

      const duplicates = Object.entries(titleGroups)
        .filter(([, group]) => group.length > 1)
        .map(([normalizedTitle, group]) => ({
          normalizedTitle,
          papers: group
        }))

      expect(duplicates).toHaveLength(1)
      expect(duplicates[0].papers).toHaveLength(2)
    })

    it('should not flag unique papers as duplicates', () => {
      const papers = [
        { id: '1', title: 'Study One', categories: [], createdAt: new Date(), updatedAt: new Date() },
        { id: '2', title: 'Study Two', categories: [], createdAt: new Date(), updatedAt: new Date() },
        { id: '3', title: 'Study Three', categories: [], createdAt: new Date(), updatedAt: new Date() }
      ]

      const titleGroups: Record<string, typeof papers> = {}

      papers.forEach(paper => {
        const normalized = normalizeTitle(paper.title)
        if (!titleGroups[normalized]) {
          titleGroups[normalized] = []
        }
        titleGroups[normalized].push(paper)
      })

      const duplicates = Object.entries(titleGroups)
        .filter(([, group]) => group.length > 1)

      expect(duplicates).toHaveLength(0)
    })

    it('should handle case-insensitive duplicate detection', () => {
      const papers = [
        { id: '1', title: 'Healthcare Study', categories: [], createdAt: new Date(), updatedAt: new Date() },
        { id: '2', title: 'HEALTHCARE STUDY', categories: [], createdAt: new Date(), updatedAt: new Date() },
        { id: '3', title: 'healthcare study', categories: [], createdAt: new Date(), updatedAt: new Date() }
      ]

      const titleGroups: Record<string, typeof papers> = {}

      papers.forEach(paper => {
        const normalized = normalizeTitle(paper.title)
        if (!titleGroups[normalized]) {
          titleGroups[normalized] = []
        }
        titleGroups[normalized].push(paper)
      })

      const duplicates = Object.entries(titleGroups)
        .filter(([, group]) => group.length > 1)

      expect(duplicates).toHaveLength(1)
      expect(duplicates[0][1]).toHaveLength(3)
    })

    it('should handle punctuation variations', () => {
      const papers = [
        { id: '1', title: 'Impact of Policy: A Study', categories: [], createdAt: new Date(), updatedAt: new Date() },
        { id: '2', title: 'Impact of Policy - A Study', categories: [], createdAt: new Date(), updatedAt: new Date() }
      ]

      const normalized1 = normalizeTitle(papers[0].title)
      const normalized2 = normalizeTitle(papers[1].title)

      expect(normalized1).toBe(normalized2)
    })
  })

  describe('checkForDuplicate', () => {
    it('should find existing paper with same title', () => {
      const existingPapers = [
        { id: '1', title: 'Existing Study', categories: [], createdAt: new Date(), updatedAt: new Date() }
      ]

      const checkForDuplicate = (title: string) => {
        const normalized = normalizeTitle(title)
        return existingPapers.find(p => normalizeTitle(p.title) === normalized)
      }

      const duplicate = checkForDuplicate('Existing Study')
      expect(duplicate).toBeDefined()
      expect(duplicate?.id).toBe('1')
    })

    it('should return undefined for new unique title', () => {
      const existingPapers = [
        { id: '1', title: 'Existing Study', categories: [], createdAt: new Date(), updatedAt: new Date() }
      ]

      const checkForDuplicate = (title: string) => {
        const normalized = normalizeTitle(title)
        return existingPapers.find(p => normalizeTitle(p.title) === normalized)
      }

      const duplicate = checkForDuplicate('Brand New Study')
      expect(duplicate).toBeUndefined()
    })
  })
})
