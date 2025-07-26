import { useState, useEffect } from 'react'

const Modal = ({ isOpen, onClose, result, isEditing, onSave }) => {
  const [formData, setFormData] = useState({
    paper_title: '',
    paper_authors: '',
    paper_journal: '',
    paper_year: '',
    research_text: '',
    analysis_summary: '',
    outcomes_data: '',
    policy_connections: 0,
    quality_score: null
  })

  const [errors, setErrors] = useState({})
  const [isSaving, setIsSaving] = useState(false)

  // Initialize form data when modal opens
  useEffect(() => {
    if (result) {
      setFormData({
        id: result.id,
        paper_title: result.paper_title || '',
        paper_authors: result.paper_authors || '',
        paper_journal: result.paper_journal || '',
        paper_year: result.paper_year || '',
        research_text: result.research_text || '',
        analysis_summary: result.analysis_summary || '',
        outcomes_data: typeof result.outcomes_data === 'string' ? result.outcomes_data : JSON.stringify(result.outcomes_data, null, 2),
        policy_connections: result.policy_connections || 0,
        quality_score: result.quality_score || null
      })
    } else {
      // Reset form for new entry
      setFormData({
        paper_title: '',
        paper_authors: '',
        paper_journal: '',
        paper_year: new Date().getFullYear(),
        research_text: '',
        analysis_summary: '',
        outcomes_data: '{\n  "outcomes": [],\n  "study_quality": {}\n}',
        policy_connections: 0,
        quality_score: null
      })
    }
    setErrors({})
  }, [result, isOpen])

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.paper_title.trim()) {
      newErrors.paper_title = 'Title is required'
    }
    
    if (!formData.paper_authors.trim()) {
      newErrors.paper_authors = 'Authors are required'
    }
    
    if (formData.paper_year && (formData.paper_year < 1900 || formData.paper_year > new Date().getFullYear() + 5)) {
      newErrors.paper_year = 'Please enter a valid year'
    }

    // Validate JSON format for outcomes_data
    if (formData.outcomes_data) {
      try {
        JSON.parse(formData.outcomes_data)
      } catch (e) {
        newErrors.outcomes_data = 'Invalid JSON format'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) return

    setIsSaving(true)
    
    try {
      const dataToSave = {
        ...formData,
        outcomes_data: formData.outcomes_data ? JSON.parse(formData.outcomes_data) : null,
        paper_year: formData.paper_year ? parseInt(formData.paper_year) : null,
        policy_connections: parseInt(formData.policy_connections) || 0,
        quality_score: formData.quality_score ? parseFloat(formData.quality_score) : null,
        updated_at: new Date().toISOString()
      }

      if (!result) {
        dataToSave.created_at = new Date().toISOString()
      }

      await onSave(dataToSave)
    } catch (error) {
      console.error('Error saving:', error)
      setErrors({ general: 'Failed to save. Please try again.' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }))
    }
  }

  const renderOutcomesPreview = () => {
    try {
      const data = JSON.parse(formData.outcomes_data)
      if (data.outcomes && Array.isArray(data.outcomes)) {
        return (
          <div className="outcomes-preview">
            <h4>📊 Outcomes Preview ({data.outcomes.length})</h4>
            {data.outcomes.slice(0, 3).map((outcome, index) => (
              <div key={index} className="outcome-preview-item">
                <strong>{outcome.outcome_name}</strong>: {outcome.effect_direction} effect 
                {outcome.statistical_significance && <span className="significant">✓ Significant</span>}
              </div>
            ))}
            {data.outcomes.length > 3 && (
              <div className="more-outcomes">...and {data.outcomes.length - 3} more</div>
            )}
          </div>
        )
      }
    } catch (e) {
      return null
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            {isEditing ? (result ? '✏️ Edit Analysis' : '➕ New Analysis') : '👁️ View Analysis'}
          </h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {errors.general && (
            <div className="error">{errors.general}</div>
          )}

          <div className="form-grid">
            {/* Paper Information */}
            <div className="form-section">
              <h3>📄 Paper Information</h3>
              
              <div className="input-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={formData.paper_title}
                  onChange={(e) => handleInputChange('paper_title', e.target.value)}
                  disabled={!isEditing}
                  className={errors.paper_title ? 'error-input' : ''}
                />
                {errors.paper_title && <span className="error-text">{errors.paper_title}</span>}
              </div>

              <div className="input-group">
                <label>Authors *</label>
                <input
                  type="text"
                  value={formData.paper_authors}
                  onChange={(e) => handleInputChange('paper_authors', e.target.value)}
                  disabled={!isEditing}
                  className={errors.paper_authors ? 'error-input' : ''}
                />
                {errors.paper_authors && <span className="error-text">{errors.paper_authors}</span>}
              </div>

              <div className="input-row">
                <div className="input-group">
                  <label>Journal</label>
                  <input
                    type="text"
                    value={formData.paper_journal}
                    onChange={(e) => handleInputChange('paper_journal', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>

                <div className="input-group">
                  <label>Year</label>
                  <input
                    type="number"
                    value={formData.paper_year}
                    onChange={(e) => handleInputChange('paper_year', e.target.value)}
                    disabled={!isEditing}
                    className={errors.paper_year ? 'error-input' : ''}
                  />
                  {errors.paper_year && <span className="error-text">{errors.paper_year}</span>}
                </div>
              </div>
            </div>

            {/* Research Content */}
            <div className="form-section">
              <h3>🔬 Research Content</h3>
              
              <div className="input-group">
                <label>Research Text</label>
                <textarea
                  value={formData.research_text}
                  onChange={(e) => handleInputChange('research_text', e.target.value)}
                  disabled={!isEditing}
                  rows="4"
                  placeholder="Original research text that was analyzed..."
                />
              </div>

              <div className="input-group">
                <label>Analysis Summary</label>
                <textarea
                  value={formData.analysis_summary}
                  onChange={(e) => handleInputChange('analysis_summary', e.target.value)}
                  disabled={!isEditing}
                  rows="3"
                  placeholder="Brief summary of the analysis results..."
                />
              </div>
            </div>

            {/* Analysis Data */}
            <div className="form-section full-width">
              <h3>📊 Analysis Data</h3>
              
              <div className="input-group">
                <label>Outcomes Data (JSON)</label>
                <textarea
                  value={formData.outcomes_data}
                  onChange={(e) => handleInputChange('outcomes_data', e.target.value)}
                  disabled={!isEditing}
                  rows="8"
                  className={`json-input ${errors.outcomes_data ? 'error-input' : ''}`}
                  placeholder='{"outcomes": [], "study_quality": {}}'
                />
                {errors.outcomes_data && <span className="error-text">{errors.outcomes_data}</span>}
              </div>

              {!isEditing && renderOutcomesPreview()}
            </div>

            {/* Metadata */}
            <div className="form-section">
              <h3>📈 Metadata</h3>
              
              <div className="input-row">
                <div className="input-group">
                  <label>Policy Connections</label>
                  <input
                    type="number"
                    value={formData.policy_connections}
                    onChange={(e) => handleInputChange('policy_connections', e.target.value)}
                    disabled={!isEditing}
                    min="0"
                  />
                </div>

                <div className="input-group">
                  <label>Quality Score</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={formData.quality_score || ''}
                    onChange={(e) => handleInputChange('quality_score', e.target.value)}
                    disabled={!isEditing}
                    placeholder="0-10"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button 
            className="secondary-button" 
            onClick={onClose}
          >
            Cancel
          </button>
          
          {isEditing && (
            <button 
              className="primary-button" 
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : (result ? 'Update' : 'Create')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default Modal