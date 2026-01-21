/**
 * Supabase Service
 * Extended database operations for policies, papers, and connections
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type {
  Policy,
  PolicyInput,
  ResearchPaper,
  ResearchPaperInput,
  PolicyConnection,
  PolicyConnectionInput,
  StateBaselineWorkforce
} from '@/types'

let supabaseClient: SupabaseClient | null = null

/**
 * Initialize Supabase client with credentials
 */
export function initializeSupabase(supabaseUrl: string, supabaseKey: string): boolean {
  if (supabaseUrl && supabaseKey) {
    supabaseClient = createClient(supabaseUrl, supabaseKey)
    return true
  }
  return false
}

/**
 * Get the current Supabase client instance
 */
export function getSupabaseClient(): SupabaseClient | null {
  return supabaseClient
}

/**
 * Check if Supabase is configured
 */
export function isSupabaseConfigured(): boolean {
  return supabaseClient !== null
}

// ============================================================================
// Policy Operations
// ============================================================================

export const policyService = {
  async getAll(project?: string): Promise<Policy[]> {
    if (!supabaseClient) throw new Error('Supabase not initialized')

    let query = supabaseClient
      .from('policies')
      .select('*')
      .order('created_at', { ascending: false })

    if (project) {
      query = query.eq('project', project)
    }

    const { data, error } = await query
    if (error) throw error
    return mapPoliciesFromDb(data || [])
  },

  async getById(policyId: string): Promise<Policy | null> {
    if (!supabaseClient) throw new Error('Supabase not initialized')

    const { data, error } = await supabaseClient
      .from('policies')
      .select('*')
      .eq('policy_id', policyId)
      .single()

    if (error) throw error
    return data ? mapPolicyFromDb(data) : null
  },

  async getByState(jurisdiction: string, project?: string): Promise<Policy[]> {
    if (!supabaseClient) throw new Error('Supabase not initialized')

    let query = supabaseClient
      .from('policies')
      .select('*')
      .eq('jurisdiction', jurisdiction)
      .order('created_at', { ascending: false })

    if (project) {
      query = query.eq('project', project)
    }

    const { data, error } = await query
    if (error) throw error
    return mapPoliciesFromDb(data || [])
  },

  async create(policy: PolicyInput): Promise<Policy> {
    if (!supabaseClient) throw new Error('Supabase not initialized')

    const now = new Date().toISOString()
    const dataToSave = {
      ...mapPolicyToDb(policy),
      policy_id: crypto.randomUUID(),
      created_at: now,
      updated_at: now
    }

    const { data, error } = await supabaseClient
      .from('policies')
      .insert([dataToSave])
      .select()
      .single()

    if (error) throw error
    return mapPolicyFromDb(data)
  },

  async update(policyId: string, updates: Partial<PolicyInput>): Promise<Policy> {
    if (!supabaseClient) throw new Error('Supabase not initialized')

    const dataToUpdate = {
      ...mapPolicyToDb(updates as PolicyInput),
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabaseClient
      .from('policies')
      .update(dataToUpdate)
      .eq('policy_id', policyId)
      .select()
      .single()

    if (error) throw error
    return mapPolicyFromDb(data)
  },

  async delete(policyId: string): Promise<boolean> {
    if (!supabaseClient) throw new Error('Supabase not initialized')

    const { error } = await supabaseClient
      .from('policies')
      .delete()
      .eq('policy_id', policyId)

    if (error) throw error
    return true
  },

  async bulkCreate(policies: PolicyInput[]): Promise<Policy[]> {
    if (!supabaseClient) throw new Error('Supabase not initialized')

    const now = new Date().toISOString()
    const dataToSave = policies.map(policy => ({
      ...mapPolicyToDb(policy),
      policy_id: crypto.randomUUID(),
      created_at: now,
      updated_at: now
    }))

    const { data, error } = await supabaseClient
      .from('policies')
      .insert(dataToSave)
      .select()

    if (error) throw error
    return mapPoliciesFromDb(data || [])
  }
}

// ============================================================================
// Research Paper Operations
// ============================================================================

export const researchPaperService = {
  async getAll(project?: string): Promise<ResearchPaper[]> {
    if (!supabaseClient) throw new Error('Supabase not initialized')

    let query = supabaseClient
      .from('research_papers')
      .select('*')
      .order('created_at', { ascending: false })

    if (project) {
      query = query.eq('project', project)
    }

    const { data, error } = await query
    if (error) throw error
    return mapPapersFromDb(data || [])
  },

  async getById(paperId: string): Promise<ResearchPaper | null> {
    if (!supabaseClient) throw new Error('Supabase not initialized')

    const { data, error } = await supabaseClient
      .from('research_papers')
      .select('*')
      .eq('id', paperId)
      .single()

    if (error) throw error
    return data ? mapPaperFromDb(data) : null
  },

  async create(paper: ResearchPaperInput): Promise<ResearchPaper> {
    if (!supabaseClient) throw new Error('Supabase not initialized')

    const now = new Date().toISOString()
    const dataToSave = {
      ...mapPaperToDb(paper),
      id: crypto.randomUUID(),
      created_at: now,
      updated_at: now
    }

    const { data, error } = await supabaseClient
      .from('research_papers')
      .insert([dataToSave])
      .select()
      .single()

    if (error) throw error
    return mapPaperFromDb(data)
  },

  async update(paperId: string, updates: Partial<ResearchPaperInput>): Promise<ResearchPaper> {
    if (!supabaseClient) throw new Error('Supabase not initialized')

    const dataToUpdate = {
      ...mapPaperToDb(updates as ResearchPaperInput),
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabaseClient
      .from('research_papers')
      .update(dataToUpdate)
      .eq('id', paperId)
      .select()
      .single()

    if (error) throw error
    return mapPaperFromDb(data)
  },

  async delete(paperId: string): Promise<boolean> {
    if (!supabaseClient) throw new Error('Supabase not initialized')

    const { error } = await supabaseClient
      .from('research_papers')
      .delete()
      .eq('id', paperId)

    if (error) throw error
    return true
  },

  async findByTitle(title: string): Promise<ResearchPaper[]> {
    if (!supabaseClient) throw new Error('Supabase not initialized')

    const { data, error } = await supabaseClient
      .from('research_papers')
      .select('*')
      .ilike('title', `%${title}%`)

    if (error) throw error
    return mapPapersFromDb(data || [])
  }
}

// ============================================================================
// Policy Connection Operations
// ============================================================================

export const connectionService = {
  async getAll(project?: string): Promise<PolicyConnection[]> {
    if (!supabaseClient) throw new Error('Supabase not initialized')

    let query = supabaseClient
      .from('policy_research_connections')
      .select('*')
      .order('created_at', { ascending: false })

    if (project) {
      query = query.eq('project', project)
    }

    const { data, error } = await query
    if (error) throw error
    return mapConnectionsFromDb(data || [])
  },

  async getByPolicy(policyId: string): Promise<PolicyConnection[]> {
    if (!supabaseClient) throw new Error('Supabase not initialized')

    const { data, error } = await supabaseClient
      .from('policy_research_connections')
      .select('*')
      .eq('policy_id', policyId)

    if (error) throw error
    return mapConnectionsFromDb(data || [])
  },

  async getByPaper(paperId: string): Promise<PolicyConnection[]> {
    if (!supabaseClient) throw new Error('Supabase not initialized')

    const { data, error } = await supabaseClient
      .from('policy_research_connections')
      .select('*')
      .eq('paper_id', paperId)

    if (error) throw error
    return mapConnectionsFromDb(data || [])
  },

  async getByState(state: string, project?: string): Promise<PolicyConnection[]> {
    if (!supabaseClient) throw new Error('Supabase not initialized')

    let query = supabaseClient
      .from('policy_research_connections')
      .select('*')
      .eq('state_jurisdiction', state)

    if (project) {
      query = query.eq('project', project)
    }

    const { data, error } = await query
    if (error) throw error
    return mapConnectionsFromDb(data || [])
  },

  async create(connection: PolicyConnectionInput): Promise<PolicyConnection> {
    if (!supabaseClient) throw new Error('Supabase not initialized')

    const now = new Date().toISOString()
    const dataToSave = {
      ...mapConnectionToDb(connection),
      connection_id: crypto.randomUUID(),
      created_at: now,
      updated_at: now
    }

    const { data, error } = await supabaseClient
      .from('policy_research_connections')
      .insert([dataToSave])
      .select()
      .single()

    if (error) throw error
    return mapConnectionFromDb(data)
  },

  async update(connectionId: string, updates: Partial<PolicyConnectionInput>): Promise<PolicyConnection> {
    if (!supabaseClient) throw new Error('Supabase not initialized')

    const dataToUpdate = {
      ...mapConnectionToDb(updates as PolicyConnectionInput),
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabaseClient
      .from('policy_research_connections')
      .update(dataToUpdate)
      .eq('connection_id', connectionId)
      .select()
      .single()

    if (error) throw error
    return mapConnectionFromDb(data)
  },

  async delete(connectionId: string): Promise<boolean> {
    if (!supabaseClient) throw new Error('Supabase not initialized')

    const { error } = await supabaseClient
      .from('policy_research_connections')
      .delete()
      .eq('connection_id', connectionId)

    if (error) throw error
    return true
  }
}

// ============================================================================
// Baseline Workforce Data Operations
// ============================================================================

export const baselineWorkforceService = {
  async getAll(): Promise<StateBaselineWorkforce[]> {
    if (!supabaseClient) throw new Error('Supabase not initialized')

    const { data, error } = await supabaseClient
      .from('state_baseline_workforce')
      .select('*')

    if (error) throw error
    return (data || []).map(mapBaselineFromDb)
  },

  async getByState(stateName: string): Promise<StateBaselineWorkforce | null> {
    if (!supabaseClient) throw new Error('Supabase not initialized')

    const { data, error } = await supabaseClient
      .from('state_baseline_workforce')
      .select('*')
      .eq('state_name', stateName)
      .single()

    if (error) throw error
    return data ? mapBaselineFromDb(data) : null
  }
}

// ============================================================================
// Helper Functions - Database Field Mapping
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapPolicyFromDb(row: any): Policy {
  return {
    policyId: row.policy_id,
    title: row.title,
    description: row.description,
    jurisdiction: row.jurisdiction,
    policyType: row.policy_type,
    status: row.status,
    effectiveDate: row.effective_date ? new Date(row.effective_date) : undefined,
    sourceUrl: row.source_url,
    billNumber: row.bill_number,
    session: row.session,
    estimatedPopulationAffected: row.estimated_population_affected,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    project: row.project
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapPoliciesFromDb(rows: any[]): Policy[] {
  return rows.map(mapPolicyFromDb)
}

function mapPolicyToDb(policy: PolicyInput): Record<string, unknown> {
  return {
    title: policy.title,
    description: policy.description,
    jurisdiction: policy.jurisdiction,
    policy_type: policy.policyType,
    status: policy.status,
    effective_date: policy.effectiveDate?.toISOString(),
    source_url: policy.sourceUrl,
    bill_number: policy.billNumber,
    session: policy.session,
    estimated_population_affected: policy.estimatedPopulationAffected,
    project: policy.project
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapPaperFromDb(row: any): ResearchPaper {
  return {
    id: row.id,
    title: row.title,
    firstAuthor: row.first_author,
    allAuthors: row.all_authors,
    journal: row.journal,
    publicationYear: row.publication_year,
    abstract: row.abstract,
    researchText: row.research_text,
    categories: row.categories || [],
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    project: row.project
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapPapersFromDb(rows: any[]): ResearchPaper[] {
  return rows.map(mapPaperFromDb)
}

function mapPaperToDb(paper: ResearchPaperInput): Record<string, unknown> {
  return {
    title: paper.title,
    first_author: paper.firstAuthor,
    all_authors: paper.allAuthors,
    journal: paper.journal,
    publication_year: paper.publicationYear,
    abstract: paper.abstract,
    research_text: paper.researchText,
    categories: paper.categories,
    project: paper.project
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapConnectionFromDb(row: any): PolicyConnection {
  return {
    connectionId: row.connection_id,
    policyId: row.policy_id,
    paperId: row.paper_id,
    stateJurisdiction: row.state_jurisdiction,
    connectionType: row.connection_type,
    strengthScore: row.strength_score,
    evidenceQuality: row.evidence_quality,
    workforceRelevance: row.workforce_relevance,
    rationale: row.rationale,
    outcomeAffected: row.outcome_affected,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    project: row.project
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapConnectionsFromDb(rows: any[]): PolicyConnection[] {
  return rows.map(mapConnectionFromDb)
}

function mapConnectionToDb(connection: PolicyConnectionInput): Record<string, unknown> {
  return {
    policy_id: connection.policyId,
    paper_id: connection.paperId,
    state_jurisdiction: connection.stateJurisdiction,
    connection_type: connection.connectionType,
    strength_score: connection.strengthScore,
    evidence_quality: connection.evidenceQuality,
    workforce_relevance: connection.workforceRelevance,
    rationale: connection.rationale,
    outcome_affected: connection.outcomeAffected,
    project: connection.project
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapBaselineFromDb(row: any): StateBaselineWorkforce {
  return {
    stateName: row.state_name,
    baselineWorkforceScore: row.baseline_workforce_score,
    physicianDensity: row.physician_density,
    nurseRatio: row.nurse_ratio,
    ruralAccessScore: row.rural_access_score,
    specialtyDistribution: row.specialty_distribution
  }
}

export default {
  initializeSupabase,
  getSupabaseClient,
  isSupabaseConfigured,
  policyService,
  researchPaperService,
  connectionService,
  baselineWorkforceService
}
