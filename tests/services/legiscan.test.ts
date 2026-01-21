/**
 * LegiScan Service Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { stateNameToAbbrev } from '@/services/legiscan'

describe('legiscan service', () => {
  describe('stateNameToAbbrev', () => {
    it('should convert full state names to abbreviations', () => {
      expect(stateNameToAbbrev('CALIFORNIA')).toBe('CA')
      expect(stateNameToAbbrev('TEXAS')).toBe('TX')
      expect(stateNameToAbbrev('NEW YORK')).toBe('NY')
      expect(stateNameToAbbrev('FLORIDA')).toBe('FL')
    })

    it('should handle lowercase input', () => {
      expect(stateNameToAbbrev('california')).toBe('CA')
      expect(stateNameToAbbrev('texas')).toBe('TX')
    })

    it('should handle mixed case input', () => {
      expect(stateNameToAbbrev('California')).toBe('CA')
      expect(stateNameToAbbrev('New York')).toBe('NY')
    })

    it('should return uppercase if already an abbreviation', () => {
      expect(stateNameToAbbrev('CA')).toBe('CA')
      expect(stateNameToAbbrev('tx')).toBe('TX')
    })

    it('should handle all 50 states', () => {
      const states = [
        ['ALABAMA', 'AL'], ['ALASKA', 'AK'], ['ARIZONA', 'AZ'], ['ARKANSAS', 'AR'],
        ['CALIFORNIA', 'CA'], ['COLORADO', 'CO'], ['CONNECTICUT', 'CT'], ['DELAWARE', 'DE'],
        ['FLORIDA', 'FL'], ['GEORGIA', 'GA'], ['HAWAII', 'HI'], ['IDAHO', 'ID'],
        ['ILLINOIS', 'IL'], ['INDIANA', 'IN'], ['IOWA', 'IA'], ['KANSAS', 'KS'],
        ['KENTUCKY', 'KY'], ['LOUISIANA', 'LA'], ['MAINE', 'ME'], ['MARYLAND', 'MD'],
        ['MASSACHUSETTS', 'MA'], ['MICHIGAN', 'MI'], ['MINNESOTA', 'MN'], ['MISSISSIPPI', 'MS'],
        ['MISSOURI', 'MO'], ['MONTANA', 'MT'], ['NEBRASKA', 'NE'], ['NEVADA', 'NV'],
        ['NEW HAMPSHIRE', 'NH'], ['NEW JERSEY', 'NJ'], ['NEW MEXICO', 'NM'], ['NEW YORK', 'NY'],
        ['NORTH CAROLINA', 'NC'], ['NORTH DAKOTA', 'ND'], ['OHIO', 'OH'], ['OKLAHOMA', 'OK'],
        ['OREGON', 'OR'], ['PENNSYLVANIA', 'PA'], ['RHODE ISLAND', 'RI'], ['SOUTH CAROLINA', 'SC'],
        ['SOUTH DAKOTA', 'SD'], ['TENNESSEE', 'TN'], ['TEXAS', 'TX'], ['UTAH', 'UT'],
        ['VERMONT', 'VT'], ['VIRGINIA', 'VA'], ['WASHINGTON', 'WA'], ['WEST VIRGINIA', 'WV'],
        ['WISCONSIN', 'WI'], ['WYOMING', 'WY']
      ]

      states.forEach(([name, abbrev]) => {
        expect(stateNameToAbbrev(name)).toBe(abbrev)
      })
    })

    it('should handle two-word states', () => {
      expect(stateNameToAbbrev('NEW HAMPSHIRE')).toBe('NH')
      expect(stateNameToAbbrev('NEW JERSEY')).toBe('NJ')
      expect(stateNameToAbbrev('NEW MEXICO')).toBe('NM')
      expect(stateNameToAbbrev('NEW YORK')).toBe('NY')
      expect(stateNameToAbbrev('NORTH CAROLINA')).toBe('NC')
      expect(stateNameToAbbrev('NORTH DAKOTA')).toBe('ND')
      expect(stateNameToAbbrev('RHODE ISLAND')).toBe('RI')
      expect(stateNameToAbbrev('SOUTH CAROLINA')).toBe('SC')
      expect(stateNameToAbbrev('SOUTH DAKOTA')).toBe('SD')
      expect(stateNameToAbbrev('WEST VIRGINIA')).toBe('WV')
    })
  })

  describe('searchLegiScanBills', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('should throw error when API key is missing', async () => {
      const { searchLegiScanBills } = await import('@/services/legiscan')

      await expect(searchLegiScanBills('', 'CA')).rejects.toThrow('LegiScan API key required')
    })

    it('should handle network errors gracefully', async () => {
      vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'))

      const { searchLegiScanBills } = await import('@/services/legiscan')

      // Should return empty array on network error (CORS fallback behavior)
      const results = await searchLegiScanBills('test-key', 'CA')
      expect(results).toEqual([])
    })

    it('should parse search results correctly', async () => {
      const mockResponse = {
        status: 'OK',
        searchresult: {
          '0': {
            bill_id: 12345,
            bill_number: 'HB 123',
            title: 'Healthcare Act',
            state: 'CA'
          }
        }
      }

      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      } as Response)

      const { searchLegiScanBills } = await import('@/services/legiscan')
      const results = await searchLegiScanBills('test-key', 'CALIFORNIA')

      expect(results).toHaveLength(1)
      expect(results[0].billNumber).toBe('HB 123')
      expect(results[0].title).toBe('Healthcare Act')
    })

    it('should handle API error response', async () => {
      const mockResponse = {
        status: 'ERROR',
        alert: { message: 'Invalid API key' }
      }

      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      } as Response)

      const { searchLegiScanBills } = await import('@/services/legiscan')

      await expect(searchLegiScanBills('bad-key', 'CA')).rejects.toThrow('LegiScan API error')
    })

    it('should handle empty search results', async () => {
      const mockResponse = {
        status: 'OK',
        searchresult: {}
      }

      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      } as Response)

      const { searchLegiScanBills } = await import('@/services/legiscan')
      const results = await searchLegiScanBills('test-key', 'CA')

      expect(results).toEqual([])
    })
  })
})
