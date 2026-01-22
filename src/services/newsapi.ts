/**
 * NewsAPI Service
 * Search news articles about healthcare workforce impacts
 * API Docs: https://newsapi.org/docs
 */

const NEWSAPI_URL = 'https://newsapi.org/v2'

export interface NewsArticle {
  id: string
  title: string
  description: string
  content: string
  author: string | null
  source: {
    id: string | null
    name: string
  }
  url: string
  urlToImage: string | null
  publishedAt: string
}

export interface NewsSearchResult {
  status: string
  totalResults: number
  articles: NewsArticle[]
}

export interface NewsSearchOptions {
  query: string
  searchIn?: 'title' | 'description' | 'content'
  sources?: string
  domains?: string
  from?: string
  to?: string
  language?: string
  sortBy?: 'relevancy' | 'popularity' | 'publishedAt'
  pageSize?: number
  page?: number
}

/**
 * Search for news articles
 */
export async function searchNews(
  apiKey: string,
  options: NewsSearchOptions
): Promise<NewsSearchResult> {
  if (!apiKey) {
    throw new Error('NewsAPI key required')
  }

  const params = new URLSearchParams({
    q: options.query,
    language: options.language || 'en',
    sortBy: options.sortBy || 'relevancy',
    pageSize: String(options.pageSize || 20),
    page: String(options.page || 1)
  })

  if (options.searchIn) {
    params.append('searchIn', options.searchIn)
  }

  if (options.sources) {
    params.append('sources', options.sources)
  }

  if (options.domains) {
    params.append('domains', options.domains)
  }

  if (options.from) {
    params.append('from', options.from)
  }

  if (options.to) {
    params.append('to', options.to)
  }

  const response = await fetch(`${NEWSAPI_URL}/everything?${params}`, {
    headers: {
      'X-Api-Key': apiKey
    }
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(`NewsAPI error: ${response.status} - ${errorData.message || 'Unknown error'}`)
  }

  const data = await response.json()

  if (data.status !== 'ok') {
    throw new Error(`NewsAPI error: ${data.message || 'Unknown error'}`)
  }

  return {
    status: data.status,
    totalResults: data.totalResults,
    articles: (data.articles || []).map((article: any, index: number) => ({
      id: `news-${Date.now()}-${index}`,
      title: article.title || '',
      description: article.description || '',
      content: article.content || '',
      author: article.author,
      source: {
        id: article.source?.id,
        name: article.source?.name || 'Unknown'
      },
      url: article.url,
      urlToImage: article.urlToImage,
      publishedAt: article.publishedAt
    }))
  }
}

/**
 * Search for top headlines (more recent, less historical)
 */
export async function searchTopHeadlines(
  apiKey: string,
  options: {
    query?: string
    country?: string
    category?: 'health' | 'science' | 'general'
    pageSize?: number
    page?: number
  }
): Promise<NewsSearchResult> {
  if (!apiKey) {
    throw new Error('NewsAPI key required')
  }

  const params = new URLSearchParams({
    country: options.country || 'us',
    pageSize: String(options.pageSize || 20),
    page: String(options.page || 1)
  })

  if (options.query) {
    params.append('q', options.query)
  }

  if (options.category) {
    params.append('category', options.category)
  }

  const response = await fetch(`${NEWSAPI_URL}/top-headlines?${params}`, {
    headers: {
      'X-Api-Key': apiKey
    }
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(`NewsAPI error: ${response.status} - ${errorData.message || 'Unknown error'}`)
  }

  const data = await response.json()

  return {
    status: data.status,
    totalResults: data.totalResults,
    articles: (data.articles || []).map((article: any, index: number) => ({
      id: `news-${Date.now()}-${index}`,
      title: article.title || '',
      description: article.description || '',
      content: article.content || '',
      author: article.author,
      source: {
        id: article.source?.id,
        name: article.source?.name || 'Unknown'
      },
      url: article.url,
      urlToImage: article.urlToImage,
      publishedAt: article.publishedAt
    }))
  }
}

/**
 * Build a workforce-focused news search query
 */
export function buildWorkforceNewsQuery(options: {
  topic?: string
  state?: string
  impactType?: 'leaving' | 'shortage' | 'policy' | 'general'
}): string {
  const terms: string[] = []

  if (options.topic) {
    terms.push(options.topic)
  }

  if (options.state) {
    terms.push(options.state)
  }

  if (options.impactType) {
    switch (options.impactType) {
      case 'leaving':
        terms.push('(leaving OR exodus OR departing OR relocating)')
        break
      case 'shortage':
        terms.push('(shortage OR crisis OR deficit OR gap)')
        break
      case 'policy':
        terms.push('(policy OR law OR legislation OR bill)')
        break
    }
  }

  // Add healthcare workforce context if not already specific
  if (!options.topic?.toLowerCase().includes('physician') &&
      !options.topic?.toLowerCase().includes('doctor') &&
      !options.topic?.toLowerCase().includes('nurse')) {
    terms.push('(physician OR doctor OR healthcare worker OR nurse)')
  }

  return terms.join(' AND ')
}

/**
 * Suggested news searches for workforce impacts
 */
export const SUGGESTED_NEWS_SEARCHES = [
  {
    label: 'Doctors Leaving States',
    query: 'physician leaving state OR doctor exodus',
    description: 'Find news about physicians relocating due to policy changes'
  },
  {
    label: 'Physician Shortage Crisis',
    query: 'physician shortage crisis healthcare',
    description: 'Coverage of healthcare workforce shortages'
  },
  {
    label: 'Abortion Policy Impact',
    query: 'abortion law physician leaving OR doctor exodus',
    description: 'How abortion restrictions affect physician workforce'
  },
  {
    label: 'Rural Healthcare Crisis',
    query: 'rural hospital closing physician shortage',
    description: 'Rural healthcare access and workforce issues'
  },
  {
    label: 'Nurse Staffing Laws',
    query: 'nurse staffing ratio law legislation',
    description: 'Nursing workforce policy changes'
  },
  {
    label: 'Healthcare Worker Burnout',
    query: 'healthcare worker burnout leaving profession',
    description: 'Workforce retention and burnout issues'
  },
  {
    label: 'Medical Education Policy',
    query: 'medical residency funding expansion',
    description: 'Policies affecting physician training pipeline'
  },
  {
    label: 'Telehealth Policy Changes',
    query: 'telehealth policy physician state',
    description: 'Telehealth regulations and workforce impact'
  },
  {
    label: 'Medicaid Expansion Impact',
    query: 'medicaid expansion physician access',
    description: 'How Medicaid policy affects healthcare access'
  },
  {
    label: 'Scope of Practice Laws',
    query: 'nurse practitioner scope practice law',
    description: 'Policies expanding or restricting provider roles'
  }
]

/**
 * Get date string for "from" parameter (days ago)
 */
export function getDateFromDaysAgo(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString().split('T')[0]
}

export default {
  searchNews,
  searchTopHeadlines,
  buildWorkforceNewsQuery,
  SUGGESTED_NEWS_SEARCHES,
  getDateFromDaysAgo
}
