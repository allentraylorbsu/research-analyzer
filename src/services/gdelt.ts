/**
 * GDELT API Service
 * Search historical news articles using GDELT's free API
 * API Docs: https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/
 *
 * GDELT provides FREE access to years of historical news data
 * No API key required
 */

const GDELT_API_URL = 'https://api.gdeltproject.org/api/v2/doc/doc'

export interface GdeltArticle {
  id: string
  title: string
  url: string
  urlMobile?: string
  seenDate: string
  socialImage?: string
  domain: string
  language: string
  sourceCountry: string
}

export interface GdeltSearchResult {
  articles: GdeltArticle[]
  totalResults: number
}

export interface GdeltSearchOptions {
  query: string
  startDate?: Date
  endDate?: Date
  maxRecords?: number
  sourceCountry?: string
  language?: string
  domain?: string
  theme?: string
}

/**
 * Format date for GDELT API (YYYYMMDDHHMMSS)
 */
function formatGdeltDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}${month}${day}${hours}${minutes}${seconds}`
}

/**
 * Search GDELT for news articles
 * Free API with years of historical data
 */
export async function searchGdelt(
  options: GdeltSearchOptions
): Promise<GdeltSearchResult> {
  if (!options.query.trim()) {
    throw new Error('Search query required')
  }

  const params = new URLSearchParams({
    query: options.query,
    mode: 'artlist',
    format: 'json',
    maxrecords: String(options.maxRecords || 75),
    sort: 'datedesc'
  })

  // Add date range if specified
  if (options.startDate) {
    params.append('startdatetime', formatGdeltDate(options.startDate))
  }

  if (options.endDate) {
    params.append('enddatetime', formatGdeltDate(options.endDate))
  }

  // Filter by source country
  if (options.sourceCountry) {
    params.append('sourcecountry', options.sourceCountry)
  }

  // Filter by language (default to English)
  params.append('sourcelang', options.language || 'english')

  // Filter by domain if specified
  if (options.domain) {
    params.append('domain', options.domain)
  }

  const response = await fetch(`${GDELT_API_URL}?${params}`)

  // GDELT returns text errors, not JSON errors
  const responseText = await response.text()

  // Check if response looks like an error (not JSON)
  if (!responseText.startsWith('{') && !responseText.startsWith('[')) {
    // It's an error message, not JSON
    if (responseText.toLowerCase().includes('no articles found')) {
      return { articles: [], totalResults: 0 }
    }
    throw new Error(`GDELT error: ${responseText.substring(0, 100)}`)
  }

  if (!response.ok) {
    throw new Error(`GDELT API error: ${response.status}`)
  }

  let data
  try {
    data = JSON.parse(responseText)
  } catch {
    throw new Error('GDELT returned invalid response. Try a simpler search query.')
  }

  // GDELT returns articles in an "articles" array
  const articles = (data.articles || []).map((article: any, index: number) => ({
    id: `gdelt-${Date.now()}-${index}`,
    title: article.title || 'Untitled',
    url: article.url,
    urlMobile: article.url_mobile,
    seenDate: article.seendate,
    socialImage: article.socialimage,
    domain: article.domain || extractDomain(article.url),
    language: article.language || 'English',
    sourceCountry: article.sourcecountry || 'US'
  }))

  return {
    articles,
    totalResults: articles.length
  }
}

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname.replace('www.', '')
  } catch {
    return 'Unknown'
  }
}

/**
 * Healthcare workforce themed searches for GDELT
 * Using simpler queries that work better with GDELT's search
 */
export const SUGGESTED_GDELT_SEARCHES = [
  {
    label: 'Physician Shortage',
    query: 'physician shortage healthcare',
    description: 'News about physician and healthcare worker shortages'
  },
  {
    label: 'Doctors Leaving',
    query: 'doctors leaving state policy',
    description: 'Coverage of physicians relocating due to policy changes'
  },
  {
    label: 'Healthcare Policy',
    query: 'healthcare policy legislation',
    description: 'Policy changes affecting healthcare workforce'
  },
  {
    label: 'Rural Hospital',
    query: 'rural hospital closing',
    description: 'Rural healthcare access and workforce issues'
  },
  {
    label: 'Abortion Healthcare',
    query: 'abortion ban doctors',
    description: 'How abortion policies affect healthcare workers'
  },
  {
    label: 'Nurse Shortage',
    query: 'nurse shortage hospital staffing',
    description: 'Nursing workforce challenges'
  },
  {
    label: 'Medical Residency',
    query: 'medical residency training',
    description: 'Physician training and residency programs'
  },
  {
    label: 'Healthcare Burnout',
    query: 'healthcare worker burnout',
    description: 'Burnout and retention issues'
  },
  {
    label: 'Telehealth Policy',
    query: 'telehealth telemedicine policy',
    description: 'Telehealth policy and workforce impact'
  },
  {
    label: 'Medicaid Expansion',
    query: 'medicaid expansion healthcare',
    description: 'Medicaid policy and healthcare access'
  }
]

/**
 * Predefined date ranges for historical searches
 */
export const GDELT_DATE_RANGES = [
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
  { label: 'Last 6 months', days: 180 },
  { label: 'Last year', days: 365 },
  { label: 'Last 2 years', days: 730 },
  { label: 'Last 5 years', days: 1825 }
]

/**
 * Get date from days ago
 */
export function getDateFromDaysAgo(days: number): Date {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date
}

/**
 * Health policy focused domains for filtering
 * Organized by category for easier selection
 */
export const HEALTH_POLICY_DOMAINS = [
  { domain: '', label: 'All Sources', category: 'all' },
  // Health Policy Research Organizations
  { domain: 'kff.org', label: 'KFF (Kaiser Family Foundation)', category: 'research' },
  { domain: 'healthaffairs.org', label: 'Health Affairs', category: 'research' },
  { domain: 'commonwealthfund.org', label: 'Commonwealth Fund', category: 'research' },
  { domain: 'urban.org', label: 'Urban Institute', category: 'research' },
  { domain: 'brookings.edu', label: 'Brookings Institution', category: 'research' },
  // Healthcare Industry News
  { domain: 'modernhealthcare.com', label: 'Modern Healthcare', category: 'industry' },
  { domain: 'fiercehealthcare.com', label: 'Fierce Healthcare', category: 'industry' },
  { domain: 'beckershospitalreview.com', label: 'Beckers Hospital Review', category: 'industry' },
  { domain: 'statnews.com', label: 'STAT News', category: 'industry' },
  { domain: 'medscape.com', label: 'Medscape', category: 'industry' },
  { domain: 'healthcaredive.com', label: 'Healthcare Dive', category: 'industry' },
  // Major News with Health Coverage
  { domain: 'nytimes.com', label: 'New York Times', category: 'news' },
  { domain: 'washingtonpost.com', label: 'Washington Post', category: 'news' },
  { domain: 'politico.com', label: 'Politico', category: 'news' },
  { domain: 'thehill.com', label: 'The Hill', category: 'news' },
  { domain: 'reuters.com', label: 'Reuters', category: 'news' },
  { domain: 'apnews.com', label: 'AP News', category: 'news' },
  { domain: 'npr.org', label: 'NPR', category: 'news' },
  { domain: 'cnn.com', label: 'CNN', category: 'news' }
]

export default {
  searchGdelt,
  SUGGESTED_GDELT_SEARCHES,
  GDELT_DATE_RANGES,
  getDateFromDaysAgo,
  HEALTH_POLICY_DOMAINS
}
