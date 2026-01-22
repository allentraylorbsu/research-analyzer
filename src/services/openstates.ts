/**
 * Open States API Service
 * Search state legislation across all 50 US states
 * API Docs: https://docs.openstates.org/api-v3/
 */

const OPENSTATES_API_URL = 'https://v3.openstates.org'

export interface OpenStatesBill {
  id: string
  identifier: string
  title: string
  description?: string
  jurisdiction: {
    id: string
    name: string
    classification: string
  }
  session: string
  classification: string[]
  subject: string[]
  latestAction?: {
    description: string
    date: string
  }
  updatedAt: string
  createdAt: string
  openstatesUrl: string
}

export interface OpenStatesSearchResult {
  results: OpenStatesBill[]
  pagination: {
    totalItems: number
    perPage: number
    page: number
    maxPage: number
  }
}

export interface OpenStatesSearchOptions {
  query?: string
  state?: string
  session?: string
  classification?: 'bill' | 'resolution' | 'constitutional amendment'
  subject?: string
  updatedSince?: string
  page?: number
  perPage?: number
}

// State abbreviation to Open States jurisdiction ID mapping
const STATE_JURISDICTION_MAP: Record<string, string> = {
  'AL': 'ocd-jurisdiction/country:us/state:al/government',
  'AK': 'ocd-jurisdiction/country:us/state:ak/government',
  'AZ': 'ocd-jurisdiction/country:us/state:az/government',
  'AR': 'ocd-jurisdiction/country:us/state:ar/government',
  'CA': 'ocd-jurisdiction/country:us/state:ca/government',
  'CO': 'ocd-jurisdiction/country:us/state:co/government',
  'CT': 'ocd-jurisdiction/country:us/state:ct/government',
  'DE': 'ocd-jurisdiction/country:us/state:de/government',
  'FL': 'ocd-jurisdiction/country:us/state:fl/government',
  'GA': 'ocd-jurisdiction/country:us/state:ga/government',
  'HI': 'ocd-jurisdiction/country:us/state:hi/government',
  'ID': 'ocd-jurisdiction/country:us/state:id/government',
  'IL': 'ocd-jurisdiction/country:us/state:il/government',
  'IN': 'ocd-jurisdiction/country:us/state:in/government',
  'IA': 'ocd-jurisdiction/country:us/state:ia/government',
  'KS': 'ocd-jurisdiction/country:us/state:ks/government',
  'KY': 'ocd-jurisdiction/country:us/state:ky/government',
  'LA': 'ocd-jurisdiction/country:us/state:la/government',
  'ME': 'ocd-jurisdiction/country:us/state:me/government',
  'MD': 'ocd-jurisdiction/country:us/state:md/government',
  'MA': 'ocd-jurisdiction/country:us/state:ma/government',
  'MI': 'ocd-jurisdiction/country:us/state:mi/government',
  'MN': 'ocd-jurisdiction/country:us/state:mn/government',
  'MS': 'ocd-jurisdiction/country:us/state:ms/government',
  'MO': 'ocd-jurisdiction/country:us/state:mo/government',
  'MT': 'ocd-jurisdiction/country:us/state:mt/government',
  'NE': 'ocd-jurisdiction/country:us/state:ne/government',
  'NV': 'ocd-jurisdiction/country:us/state:nv/government',
  'NH': 'ocd-jurisdiction/country:us/state:nh/government',
  'NJ': 'ocd-jurisdiction/country:us/state:nj/government',
  'NM': 'ocd-jurisdiction/country:us/state:nm/government',
  'NY': 'ocd-jurisdiction/country:us/state:ny/government',
  'NC': 'ocd-jurisdiction/country:us/state:nc/government',
  'ND': 'ocd-jurisdiction/country:us/state:nd/government',
  'OH': 'ocd-jurisdiction/country:us/state:oh/government',
  'OK': 'ocd-jurisdiction/country:us/state:ok/government',
  'OR': 'ocd-jurisdiction/country:us/state:or/government',
  'PA': 'ocd-jurisdiction/country:us/state:pa/government',
  'RI': 'ocd-jurisdiction/country:us/state:ri/government',
  'SC': 'ocd-jurisdiction/country:us/state:sc/government',
  'SD': 'ocd-jurisdiction/country:us/state:sd/government',
  'TN': 'ocd-jurisdiction/country:us/state:tn/government',
  'TX': 'ocd-jurisdiction/country:us/state:tx/government',
  'UT': 'ocd-jurisdiction/country:us/state:ut/government',
  'VT': 'ocd-jurisdiction/country:us/state:vt/government',
  'VA': 'ocd-jurisdiction/country:us/state:va/government',
  'WA': 'ocd-jurisdiction/country:us/state:wa/government',
  'WV': 'ocd-jurisdiction/country:us/state:wv/government',
  'WI': 'ocd-jurisdiction/country:us/state:wi/government',
  'WY': 'ocd-jurisdiction/country:us/state:wy/government',
  'DC': 'ocd-jurisdiction/country:us/district:dc/government',
  'PR': 'ocd-jurisdiction/country:us/territory:pr/government'
}

/**
 * Search Open States for legislation
 */
export async function searchOpenStates(
  apiKey: string,
  options: OpenStatesSearchOptions
): Promise<OpenStatesSearchResult> {
  if (!apiKey) {
    throw new Error('Open States API key required')
  }

  const params = new URLSearchParams()

  if (options.query) {
    params.append('q', options.query)
  }

  if (options.state) {
    const jurisdiction = STATE_JURISDICTION_MAP[options.state.toUpperCase()]
    if (jurisdiction) {
      params.append('jurisdiction', jurisdiction)
    }
  }

  if (options.session) {
    params.append('session', options.session)
  }

  if (options.classification) {
    params.append('classification', options.classification)
  }

  if (options.subject) {
    params.append('subject', options.subject)
  }

  if (options.updatedSince) {
    params.append('updated_since', options.updatedSince)
  }

  params.append('page', String(options.page || 1))
  params.append('per_page', String(options.perPage || 20))

  const response = await fetch(`${OPENSTATES_API_URL}/bills?${params}`, {
    headers: {
      'X-API-KEY': apiKey,
      'Accept': 'application/json'
    }
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Open States API error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()

  return {
    results: (data.results || []).map(mapBillFromApi),
    pagination: {
      totalItems: data.pagination?.total_items || 0,
      perPage: data.pagination?.per_page || 20,
      page: data.pagination?.page || 1,
      maxPage: data.pagination?.max_page || 1
    }
  }
}

/**
 * Get bill details by ID
 */
export async function getBillDetails(
  apiKey: string,
  billId: string
): Promise<OpenStatesBill | null> {
  if (!apiKey) {
    throw new Error('Open States API key required')
  }

  const response = await fetch(`${OPENSTATES_API_URL}/bills/${encodeURIComponent(billId)}`, {
    headers: {
      'X-API-KEY': apiKey,
      'Accept': 'application/json'
    }
  })

  if (!response.ok) {
    if (response.status === 404) return null
    throw new Error(`Open States API error: ${response.status}`)
  }

  const data = await response.json()
  return mapBillFromApi(data)
}

/**
 * Map API response to our bill interface
 */
function mapBillFromApi(bill: any): OpenStatesBill {
  return {
    id: bill.id,
    identifier: bill.identifier,
    title: bill.title,
    description: bill.abstract || bill.description,
    jurisdiction: {
      id: bill.jurisdiction?.id || '',
      name: bill.jurisdiction?.name || '',
      classification: bill.jurisdiction?.classification || ''
    },
    session: bill.session,
    classification: bill.classification || [],
    subject: bill.subject || [],
    latestAction: bill.latest_action ? {
      description: bill.latest_action.description,
      date: bill.latest_action.date
    } : undefined,
    updatedAt: bill.updated_at,
    createdAt: bill.created_at,
    openstatesUrl: bill.openstates_url || `https://open.pluralpolicy.com/bills/${bill.id}`
  }
}

/**
 * Suggested searches for healthcare workforce legislation
 */
export const SUGGESTED_LEGISLATION_SEARCHES = [
  {
    label: 'Nurse Practitioner Scope of Practice',
    query: 'nurse practitioner scope practice'
  },
  {
    label: 'Physician Loan Forgiveness',
    query: 'physician loan forgiveness'
  },
  {
    label: 'Medical Residency Funding',
    query: 'medical residency funding'
  },
  {
    label: 'Telehealth Regulations',
    query: 'telehealth physician'
  },
  {
    label: 'Healthcare Minimum Wage',
    query: 'healthcare worker minimum wage'
  },
  {
    label: 'Interstate Medical Licensure',
    query: 'interstate medical licensure compact'
  },
  {
    label: 'Abortion Restrictions',
    query: 'abortion physician'
  },
  {
    label: 'Malpractice Reform',
    query: 'medical malpractice liability'
  },
  {
    label: 'Medicaid Reimbursement',
    query: 'medicaid physician reimbursement'
  },
  {
    label: 'Rural Health Access',
    query: 'rural health physician shortage'
  }
]

/**
 * Get state name from abbreviation
 */
export function getStateName(abbrev: string): string {
  const states: Record<string, string> = {
    'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas',
    'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware',
    'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho',
    'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas',
    'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
    'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi',
    'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada',
    'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York',
    'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma',
    'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
    'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah',
    'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia',
    'WI': 'Wisconsin', 'WY': 'Wyoming', 'DC': 'District of Columbia', 'PR': 'Puerto Rico'
  }
  return states[abbrev.toUpperCase()] || abbrev
}

export default {
  searchOpenStates,
  getBillDetails,
  SUGGESTED_LEGISLATION_SEARCHES,
  getStateName
}
