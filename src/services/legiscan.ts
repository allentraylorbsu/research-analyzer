/**
 * LegiScan API Service
 * Handles legislative data fetching with CORS proxy fallback
 */

import { US_STATES, DEFAULT_LEGISCAN_KEYWORDS } from '@/types'
import type { LegiScanBill, StateName } from '@/types'

/**
 * CORS proxy options for browser-based API calls
 */
const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://cors-anywhere.herokuapp.com/',
  'https://corsproxy.io/?'
]

const LEGISCAN_BASE_URL = 'https://api.legiscan.com/'

/**
 * Convert state name to abbreviation for LegiScan API
 */
export function stateNameToAbbrev(state: string): string {
  const upperState = state.toUpperCase() as StateName
  return US_STATES[upperState] || state.toUpperCase()
}

/**
 * Search LegiScan for healthcare-related bills
 * @param year - 1=current session, 2=recent (last 2 years), 3=prior sessions, 4=all time
 */
export async function searchLegiScanBills(
  apiKey: string,
  state: string,
  keywords: string = DEFAULT_LEGISCAN_KEYWORDS,
  year: number = 1
): Promise<LegiScanBill[]> {
  if (!apiKey) {
    throw new Error('LegiScan API key required. Please add it to API Keys section.')
  }

  const stateAbbrev = stateNameToAbbrev(state)
  console.log(`Converting state "${state}" to abbreviation "${stateAbbrev}" for LegiScan API`)

  const params = new URLSearchParams({
    key: apiKey,
    op: 'getSearch',
    state: stateAbbrev,
    query: keywords,
    year: String(year),
    status: '1|2|3|4|5|6' // All statuses: Introduced, engrossed, enrolled, passed, vetoed, failed
  })

  const apiUrl = `${LEGISCAN_BASE_URL}?${params}`

  try {
    const response = await fetchWithCorsProxy(apiUrl)
    const data = await response.json()

    if (data.status === 'ERROR') {
      throw new Error(`LegiScan API error: ${data.alert?.message || 'Unknown API error'}`)
    }

    return parseSearchResults(data.searchresult)
  } catch (error) {
    console.error('LegiScan API error:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)

    if (isCorsOrNetworkError(errorMessage)) {
      console.warn(`Network/CORS issue detected for ${state}. Returning empty results.`)
      return []
    }

    throw error
  }
}

/**
 * Fetch with CORS proxy fallback
 */
async function fetchWithCorsProxy(url: string): Promise<Response> {
  // Try direct API call first
  try {
    console.log('Trying direct LegiScan API call...')
    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000)
    })
    if (response.ok) {
      console.log('Direct API call succeeded')
      return response
    }
    throw new Error(`HTTP ${response.status}`)
  } catch (directError) {
    console.log('Direct API failed, trying CORS proxies...')
  }

  // Try each CORS proxy
  let lastError: Error | null = null
  for (let i = 0; i < CORS_PROXIES.length; i++) {
    const proxy = CORS_PROXIES[i]
    try {
      console.log(`Trying CORS proxy ${i + 1}/${CORS_PROXIES.length}: ${proxy}`)

      const proxyUrl = proxy.includes('allorigins')
        ? `${proxy}${encodeURIComponent(url)}`
        : `${proxy}${url}`

      const response = await fetch(proxyUrl, {
        headers: {
          'X-Requested-With': 'XMLHttpRequest'
        },
        signal: AbortSignal.timeout(10000)
      })

      if (response.ok) {
        console.log(`CORS proxy ${i + 1} succeeded`)
        return response
      }

      console.log(`CORS proxy ${i + 1} failed: ${response.status}`)
      lastError = new Error(`HTTP ${response.status}`)
    } catch (proxyError) {
      console.log(`CORS proxy ${i + 1} error:`, proxyError instanceof Error ? proxyError.message : proxyError)
      lastError = proxyError instanceof Error ? proxyError : new Error(String(proxyError))
    }
  }

  throw lastError || new Error('All CORS proxies failed')
}

/**
 * Parse LegiScan search results
 */
function parseSearchResults(searchResult: unknown): LegiScanBill[] {
  if (!searchResult) {
    return []
  }

  // LegiScan returns searchresult as an object with numeric keys
  if (Array.isArray(searchResult)) {
    return searchResult.filter(isValidBill).map(mapToBill)
  }

  if (typeof searchResult === 'object') {
    return Object.values(searchResult as Record<string, unknown>)
      .filter(isValidBill)
      .map(mapToBill)
  }

  return []
}

/**
 * Check if item is a valid bill object
 */
function isValidBill(item: unknown): item is Record<string, unknown> {
  return item !== null && typeof item === 'object' && 'bill_id' in item
}

/**
 * Map raw API response to LegiScanBill interface
 */
function mapToBill(item: Record<string, unknown>): LegiScanBill {
  return {
    billId: String(item.bill_id || ''),
    billNumber: String(item.bill_number || item.number || ''),
    billType: String(item.bill_type || item.type || ''),
    title: String(item.title || ''),
    description: String(item.description || item.text_url || ''),
    state: String(item.state || ''),
    session: item.session ? String(item.session) : undefined,
    status: item.status ? String(item.status) : undefined,
    statusDate: item.status_date ? String(item.status_date) : undefined,
    lastAction: item.last_action ? String(item.last_action) : undefined,
    lastActionDate: item.last_action_date ? String(item.last_action_date) : undefined,
    url: item.url ? String(item.url) : undefined,
    relevanceScore: typeof item.relevance === 'number' ? item.relevance : undefined
  }
}

/**
 * Check if error is CORS or network related
 */
function isCorsOrNetworkError(errorMessage: string): boolean {
  const corsIndicators = [
    'CORS',
    'Failed to fetch',
    'NetworkError',
    'Network error',
    '403',
    'All CORS proxies failed',
    'AbortError',
    'timeout'
  ]
  return corsIndicators.some(indicator =>
    errorMessage.toLowerCase().includes(indicator.toLowerCase())
  )
}

/**
 * Get bill details from LegiScan
 */
export async function getBillDetails(
  apiKey: string,
  billId: string | number
): Promise<LegiScanBill | null> {
  if (!apiKey) {
    throw new Error('LegiScan API key required')
  }

  const params = new URLSearchParams({
    key: apiKey,
    op: 'getBill',
    id: String(billId)
  })

  const apiUrl = `${LEGISCAN_BASE_URL}?${params}`

  try {
    const response = await fetchWithCorsProxy(apiUrl)
    const data = await response.json()

    if (data.status === 'ERROR') {
      throw new Error(`LegiScan API error: ${data.alert?.message || 'Unknown error'}`)
    }

    if (data.bill) {
      return mapToBill(data.bill)
    }

    return null
  } catch (error) {
    console.error('Error fetching bill details:', error)
    throw error
  }
}

/**
 * Get active sessions for a state
 */
export async function getStateSessions(
  apiKey: string,
  state: string
): Promise<Array<{ sessionId: number; sessionName: string; yearStart: number; yearEnd: number }>> {
  if (!apiKey) {
    throw new Error('LegiScan API key required')
  }

  const stateAbbrev = stateNameToAbbrev(state)
  const params = new URLSearchParams({
    key: apiKey,
    op: 'getSessionList',
    state: stateAbbrev
  })

  const apiUrl = `${LEGISCAN_BASE_URL}?${params}`

  try {
    const response = await fetchWithCorsProxy(apiUrl)
    const data = await response.json()

    if (data.status === 'ERROR') {
      throw new Error(`LegiScan API error: ${data.alert?.message || 'Unknown error'}`)
    }

    if (data.sessions && Array.isArray(data.sessions)) {
      return data.sessions.map((session: Record<string, unknown>) => ({
        sessionId: Number(session.session_id),
        sessionName: String(session.session_name || session.session_title || ''),
        yearStart: Number(session.year_start),
        yearEnd: Number(session.year_end)
      }))
    }

    return []
  } catch (error) {
    console.error('Error fetching state sessions:', error)
    throw error
  }
}

export default {
  searchLegiScanBills,
  getBillDetails,
  getStateSessions,
  stateNameToAbbrev
}
