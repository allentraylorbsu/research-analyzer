/**
 * PubMed API Service
 * Search and fetch research papers from NCBI PubMed database
 * Uses E-utilities API: https://www.ncbi.nlm.nih.gov/books/NBK25501/
 */

const PUBMED_BASE_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils'

export interface PubMedSearchResult {
  pmid: string
  title: string
  authors: string[]
  journal: string
  publicationDate: string
  publicationYear: number
  abstract: string
  doi?: string
  keywords: string[]
  meshTerms: string[]
}

export interface PubMedSearchResponse {
  totalCount: number
  results: PubMedSearchResult[]
  query: string
}

/**
 * Search PubMed for articles matching a query
 */
export async function searchPubMed(
  query: string,
  options: {
    maxResults?: number
    page?: number
    sortBy?: 'relevance' | 'date'
  } = {}
): Promise<PubMedSearchResponse> {
  const { maxResults = 20, page = 1, sortBy = 'relevance' } = options
  const retstart = (page - 1) * maxResults

  // Step 1: Search for PMIDs
  const searchParams = new URLSearchParams({
    db: 'pubmed',
    term: query,
    retmax: maxResults.toString(),
    retstart: retstart.toString(),
    retmode: 'json',
    sort: sortBy === 'date' ? 'pub_date' : 'relevance',
    usehistory: 'y'
  })

  const searchResponse = await fetch(`${PUBMED_BASE_URL}/esearch.fcgi?${searchParams}`)

  if (!searchResponse.ok) {
    throw new Error(`PubMed search failed: ${searchResponse.status}`)
  }

  const searchData = await searchResponse.json()
  const pmids: string[] = searchData.esearchresult?.idlist || []
  const totalCount = parseInt(searchData.esearchresult?.count || '0', 10)

  if (pmids.length === 0) {
    return { totalCount: 0, results: [], query }
  }

  // Step 2: Fetch details for each PMID
  const results = await fetchPubMedDetails(pmids)

  return {
    totalCount,
    results,
    query
  }
}

/**
 * Fetch detailed information for a list of PMIDs
 */
export async function fetchPubMedDetails(pmids: string[]): Promise<PubMedSearchResult[]> {
  if (pmids.length === 0) return []

  const fetchParams = new URLSearchParams({
    db: 'pubmed',
    id: pmids.join(','),
    retmode: 'xml',
    rettype: 'abstract'
  })

  const fetchResponse = await fetch(`${PUBMED_BASE_URL}/efetch.fcgi?${fetchParams}`)

  if (!fetchResponse.ok) {
    throw new Error(`PubMed fetch failed: ${fetchResponse.status}`)
  }

  const xmlText = await fetchResponse.text()
  return parsePubMedXML(xmlText)
}

/**
 * Fetch a single article by PMID
 */
export async function fetchPubMedArticle(pmid: string): Promise<PubMedSearchResult | null> {
  const results = await fetchPubMedDetails([pmid])
  return results[0] || null
}

/**
 * Parse PubMed XML response into structured data
 */
function parsePubMedXML(xmlText: string): PubMedSearchResult[] {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xmlText, 'text/xml')
  const articles = doc.querySelectorAll('PubmedArticle')

  const results: PubMedSearchResult[] = []

  articles.forEach(article => {
    try {
      const pmid = article.querySelector('PMID')?.textContent || ''

      // Title
      const title = article.querySelector('ArticleTitle')?.textContent || 'Untitled'

      // Authors
      const authorNodes = article.querySelectorAll('Author')
      const authors: string[] = []
      authorNodes.forEach(authorNode => {
        const lastName = authorNode.querySelector('LastName')?.textContent || ''
        const foreName = authorNode.querySelector('ForeName')?.textContent || ''
        const initials = authorNode.querySelector('Initials')?.textContent || ''
        if (lastName) {
          authors.push(foreName ? `${lastName} ${initials}` : lastName)
        }
      })

      // Journal
      const journal = article.querySelector('Journal Title')?.textContent ||
                     article.querySelector('ISOAbbreviation')?.textContent ||
                     article.querySelector('MedlineTA')?.textContent || ''

      // Publication Date
      const pubDateNode = article.querySelector('PubDate')
      const year = pubDateNode?.querySelector('Year')?.textContent || ''
      const month = pubDateNode?.querySelector('Month')?.textContent || '01'
      const day = pubDateNode?.querySelector('Day')?.textContent || '01'
      const publicationYear = parseInt(year, 10) || new Date().getFullYear()
      const publicationDate = year ? `${year}-${normalizeMonth(month)}-${day.padStart(2, '0')}` : ''

      // Abstract
      const abstractTexts = article.querySelectorAll('AbstractText')
      let abstract = ''
      abstractTexts.forEach(node => {
        const label = node.getAttribute('Label')
        const text = node.textContent || ''
        if (label) {
          abstract += `${label}: ${text}\n\n`
        } else {
          abstract += text + '\n\n'
        }
      })
      abstract = abstract.trim()

      // DOI
      const articleIds = article.querySelectorAll('ArticleId')
      let doi: string | undefined
      articleIds.forEach(idNode => {
        if (idNode.getAttribute('IdType') === 'doi') {
          doi = idNode.textContent || undefined
        }
      })

      // Keywords
      const keywordNodes = article.querySelectorAll('Keyword')
      const keywords: string[] = []
      keywordNodes.forEach(node => {
        if (node.textContent) keywords.push(node.textContent)
      })

      // MeSH Terms
      const meshNodes = article.querySelectorAll('MeshHeading DescriptorName')
      const meshTerms: string[] = []
      meshNodes.forEach(node => {
        if (node.textContent) meshTerms.push(node.textContent)
      })

      results.push({
        pmid,
        title,
        authors,
        journal,
        publicationDate,
        publicationYear,
        abstract,
        doi,
        keywords,
        meshTerms
      })
    } catch (err) {
      console.error('Error parsing PubMed article:', err)
    }
  })

  return results
}

/**
 * Normalize month string to number
 */
function normalizeMonth(month: string): string {
  const months: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', apr: '04',
    may: '05', jun: '06', jul: '07', aug: '08',
    sep: '09', oct: '10', nov: '11', dec: '12'
  }

  const lower = month.toLowerCase().slice(0, 3)
  return months[lower] || month.padStart(2, '0')
}

/**
 * Build a workforce-focused search query
 */
export function buildWorkforceSearchQuery(options: {
  topic?: string
  state?: string
  yearFrom?: number
  yearTo?: number
}): string {
  const terms: string[] = []

  // Base workforce terms
  const workforceTerms = [
    'physician workforce',
    'healthcare workforce',
    'physician shortage',
    'physician migration',
    'physician retention',
    'physician recruitment',
    'medical workforce'
  ]

  if (options.topic) {
    terms.push(`(${options.topic})`)
  } else {
    terms.push(`(${workforceTerms.join(' OR ')})`)
  }

  // State filter
  if (options.state) {
    terms.push(`(${options.state}[Title/Abstract] OR ${options.state}[MeSH Terms])`)
  }

  // Date range
  if (options.yearFrom || options.yearTo) {
    const from = options.yearFrom || 1900
    const to = options.yearTo || new Date().getFullYear()
    terms.push(`("${from}"[PDAT] : "${to}"[PDAT])`)
  }

  return terms.join(' AND ')
}

/**
 * Suggested search queries for physician workforce research
 */
export const SUGGESTED_SEARCHES = [
  {
    label: 'Physician Migration & Retention',
    query: '(physician migration OR physician retention OR physician turnover OR physician relocation) AND (workforce OR shortage)'
  },
  {
    label: 'Rural Physician Workforce',
    query: '(rural physician OR rural healthcare) AND (workforce OR shortage OR recruitment OR retention)'
  },
  {
    label: 'Primary Care Workforce',
    query: '(primary care physician OR family medicine) AND (workforce OR shortage OR supply)'
  },
  {
    label: 'Physician Burnout & Wellness',
    query: '(physician burnout OR physician wellness OR physician mental health) AND workforce'
  },
  {
    label: 'Graduate Medical Education',
    query: '(graduate medical education OR residency training OR medical residency) AND (workforce OR physician supply)'
  },
  {
    label: 'Telehealth & Workforce',
    query: '(telehealth OR telemedicine) AND (physician workforce OR healthcare workforce OR access)'
  },
  {
    label: 'Healthcare Policy Impact',
    query: '(healthcare policy OR health policy) AND (physician workforce OR physician supply) AND (impact OR effect)'
  },
  {
    label: 'Specialist Workforce',
    query: '(specialist physician OR medical specialist) AND (workforce OR shortage OR distribution)'
  }
]

export default {
  searchPubMed,
  fetchPubMedDetails,
  fetchPubMedArticle,
  buildWorkforceSearchQuery,
  SUGGESTED_SEARCHES
}
