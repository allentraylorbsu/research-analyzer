import { useState, useEffect } from 'react'
import { researchAnalysisService, initializeSupabase, isSupabaseConfigured } from '../services/supabaseService'
import Modal from './Modal'

const DatabaseResultsSection = ({ apiKeys }) => {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedResult, setSelectedResult] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')

  // Initialize Supabase client and load results
  useEffect(() => {
    if (apiKeys?.supabaseUrl && apiKeys?.supabaseKey) {
      initializeSupabase(apiKeys.supabaseUrl, apiKeys.supabaseKey)
      loadResults()
    }
  }, [apiKeys])

  const loadResults = async () => {
    if (!isSupabaseConfigured()) {
      setError('Supabase not configured. Please set up your Supabase credentials.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const data = await researchAnalysisService.getAll(sortBy, sortOrder)
      setResults(data)
    } catch (err) {
      console.error('Error loading results:', err)
      setError(`Failed to load results: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const deleteResult = async (id) => {
    if (!confirm('Are you sure you want to delete this analysis?')) return

    try {
      await researchAnalysisService.delete(id)
      setResults(results.filter(r => r.id !== id))
      setError('')
    } catch (err) {
      console.error('Error deleting result:', err)
      setError(`Failed to delete: ${err.message}`)
    }
  }

  const saveResult = async (updatedResult) => {
    try {
      const updated = await researchAnalysisService.update(updatedResult.id, updatedResult)
      setResults(results.map(r => r.id === updatedResult.id ? updated : r))
      setIsModalOpen(false)
      setIsEditing(false)
      setError('')
    } catch (err) {
      console.error('Error updating result:', err)
      setError(`Failed to update: ${err.message}`)
    }
  }

  const createNewResult = async (newResult) => {
    try {
      const created = await researchAnalysisService.create(newResult)
      setResults([created, ...results])
      setIsModalOpen(false)
      setIsEditing(false)
      setError('')
    } catch (err) {
      console.error('Error creating result:', err)
      setError(`Failed to create: ${err.message}`)
    }
  }

  const openModal = (result = null) => {
    setSelectedResult(result)
    setIsEditing(!result)
    setIsModalOpen(true)
  }

  const filteredResults = results.filter(result =>
    result.paper_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    result.paper_authors?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    result.analysis_summary?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!apiKeys?.supabaseUrl) {
    return (
      <div className="section">
        <h2>📚 Database Results</h2>
        <div className="error">
          ❌ Supabase configuration required. Please configure your Supabase credentials in Step 1.
        </div>
      </div>
    )
  }

  return (
    <div className="section">
      <h2>📚 Database Results</h2>
      <p className="section-description">
        View, edit, and manage all your research analyses stored in the database.
      </p>

      {/* Controls */}
      <div className="db-controls">
        <div className="search-sort-controls">
          <input
            type="text"
            placeholder="Search by title, authors, or summary..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="created_at">Date Created</option>
            <option value="paper_title">Title</option>
            <option value="paper_authors">Authors</option>
            <option value="paper_year">Year</option>
          </select>
          
          <button 
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="sort-order-btn"
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>

        <div className="action-controls">
          <button 
            onClick={() => openModal()}
            className="primary-button"
          >
            ➕ Add New Analysis
          </button>
          
          <button 
            onClick={loadResults}
            disabled={loading}
            className="secondary-button"
          >
            {loading ? '🔄 Loading...' : '🔄 Refresh'}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error">
          {error}
        </div>
      )}

      {/* Results List */}
      {loading ? (
        <div className="loading">Loading results...</div>
      ) : filteredResults.length === 0 ? (
        <div className="no-results">
          {searchTerm ? 'No results match your search.' : 'No analyses found. Create your first one!'}
        </div>
      ) : (
        <div className="results-grid">
          {filteredResults.map((result) => (
            <div key={result.id} className="result-card">
              <div className="result-header">
                <h3 className="result-title">{result.paper_title || 'Untitled Analysis'}</h3>
                <div className="result-actions">
                  <button 
                    onClick={() => openModal(result)}
                    className="action-btn view-btn"
                    title="View Details"
                  >
                    👁️
                  </button>
                  <button 
                    onClick={() => {
                      setSelectedResult(result)
                      setIsEditing(true)
                      setIsModalOpen(true)
                    }}
                    className="action-btn edit-btn"
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button 
                    onClick={() => deleteResult(result.id)}
                    className="action-btn delete-btn"
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              
              <div className="result-meta">
                <span className="result-authors">{result.paper_authors}</span>
                <span className="result-journal">{result.paper_journal} ({result.paper_year})</span>
                <span className="result-date">{formatDate(result.created_at)}</span>
              </div>
              
              <div className="result-summary">
                {result.analysis_summary || 'No summary available'}
              </div>
              
              {result.outcomes_data && (
                <div className="result-stats">
                  <span className="stat">
                    📊 {JSON.parse(result.outcomes_data).outcomes?.length || 0} outcomes
                  </span>
                  <span className="stat">
                    🏛️ {result.policy_connections || 0} policy connections
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setIsEditing(false)
          setSelectedResult(null)
        }}
        result={selectedResult}
        isEditing={isEditing}
        onSave={selectedResult ? saveResult : createNewResult}
      />
    </div>
  )
}

export default DatabaseResultsSection