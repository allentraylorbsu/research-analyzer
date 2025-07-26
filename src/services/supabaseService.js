import { createClient } from '@supabase/supabase-js'

let supabaseClient = null

// Initialize Supabase client
export const initializeSupabase = (supabaseUrl, supabaseKey) => {
  if (supabaseUrl && supabaseKey) {
    supabaseClient = createClient(supabaseUrl, supabaseKey)
    return true
  }
  return false
}

// Get the current Supabase client
export const getSupabaseClient = () => supabaseClient

// Database operations for research analyses
export const researchAnalysisService = {
  // Get all analyses with optional sorting
  async getAll(sortBy = 'created_at', sortOrder = 'desc') {
    if (!supabaseClient) throw new Error('Supabase not initialized')
    
    const { data, error } = await supabaseClient
      .from('research_analyses')
      .select('*')
      .order(sortBy, { ascending: sortOrder === 'asc' })

    if (error) throw error
    return data || []
  },

  // Get a single analysis by ID
  async getById(id) {
    if (!supabaseClient) throw new Error('Supabase not initialized')
    
    const { data, error } = await supabaseClient
      .from('research_analyses')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  // Create a new analysis
  async create(analysisData) {
    if (!supabaseClient) throw new Error('Supabase not initialized')
    
    const dataToSave = {
      ...analysisData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabaseClient
      .from('research_analyses')
      .insert([dataToSave])
      .select()

    if (error) throw error
    return data[0]
  },

  // Update an existing analysis
  async update(id, updates) {
    if (!supabaseClient) throw new Error('Supabase not initialized')
    
    const dataToUpdate = {
      ...updates,
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabaseClient
      .from('research_analyses')
      .update(dataToUpdate)
      .eq('id', id)
      .select()

    if (error) throw error
    return data[0]
  },

  // Delete an analysis
  async delete(id) {
    if (!supabaseClient) throw new Error('Supabase not initialized')
    
    const { error } = await supabaseClient
      .from('research_analyses')
      .delete()
      .eq('id', id)

    if (error) throw error
    return true
  },

  // Save analysis results from the main analysis function
  async saveAnalysisResults(paperInfo, researchText, analysisData) {
    if (!supabaseClient) {
      console.log('Supabase not configured, skipping database save')
      return null
    }

    try {
      // Create analysis summary
      const summary = analysisData.outcomes?.map(o => 
        `${o.outcome_name}: ${o.effect_direction} effect`
      ).join(', ') || 'No outcomes extracted'

      const dataToSave = {
        paper_title: paperInfo.title,
        paper_authors: paperInfo.authors,
        paper_journal: paperInfo.journal,
        paper_year: paperInfo.year ? parseInt(paperInfo.year) : null,
        research_text: researchText,
        outcomes_data: analysisData,
        analysis_summary: summary,
        quality_score: analysisData.study_quality?.quality_score_estimate || null,
        policy_connections: 0, // Will be updated when policy analysis is run
      }

      return await this.create(dataToSave)
    } catch (error) {
      console.error('Failed to save analysis to database:', error)
      throw error
    }
  }
}

// Utility functions
export const isSupabaseConfigured = () => {
  return supabaseClient !== null
}

export const getSupabaseStatus = () => {
  return {
    configured: supabaseClient !== null,
    client: supabaseClient
  }
}