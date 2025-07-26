import { useState } from 'react'
import { researchAnalysisService } from '../services/supabaseService'

const ResearchAnalysisSection = ({ apiKeys, analysisData, setAnalysisData }) => {
  const [researchText, setResearchText] = useState(`Participants receiving gender-affirming care had 60% lower odds of moderate or severe depression (adjusted odds ratio [aOR], 0.40; 95% CI, 0.17-0.95; P = .04) and 73% lower odds of suicidality (aOR, 0.27; 95% CI, 0.11-0.65; P = .004) compared with those who did not receive care. No significant association was found with anxiety symptoms (aOR, 0.75; 95% CI, 0.35-1.64; P = .47).`)
  const [paperInfo, setPaperInfo] = useState({
    title: 'Mental Health Outcomes in Transgender and Nonbinary Youths',
    authors: 'Tordoff, Diana M.',
    journal: 'JAMA Network Open',
    year: '2022'
  })
  const [analysisStatus, setAnalysisStatus] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // Save analysis results to database
  const saveToDatabase = async (analysisData) => {
    try {
      await researchAnalysisService.saveAnalysisResults(paperInfo, researchText, analysisData)
      console.log('Analysis saved to database successfully')
    } catch (error) {
      console.error('Failed to save to database:', error)
    }
  }

  const analyzeText = async () => {
    if (!apiKeys) {
      alert('Please test your API connection first')
      return
    }

    if (!researchText.trim()) {
      alert('Please enter research text')
      return
    }

    setIsAnalyzing(true)
    setAnalysisStatus('<div class="loading">🤖 AI is analyzing the research text... (30-60 seconds)</div>')

    try {
      const prompt = `
Analyze this research results section and extract health outcomes data. 
Return ONLY a valid JSON object with this exact structure (no markdown, no extra text):

{
    "outcomes": [
        {
            "outcome_name": "Depression",
            "effect_direction": "POSITIVE",
            "effect_size": 0.60,
            "effect_size_type": "ODDS_RATIO", 
            "confidence_interval_lower": 0.17,
            "confidence_interval_upper": 0.95,
            "p_value": 0.04,
            "statistical_significance": true,
            "measurement_instrument": "PHQ-9",
            "raw_finding": "60% lower odds of depression (OR 0.40, 95% CI 0.17-0.95, p=0.04)"
        }
    ],
    "study_quality": {
        "estimated_sample_size": 104,
        "study_design": "COHORT",
        "quality_score_estimate": 8.5
    }
}

Note: effect_direction should be "POSITIVE" for beneficial effects, "NEGATIVE" for harmful effects, "NEUTRAL" for no significant effect.

Results text to analyze:
${researchText}
                `

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKeys.openaiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: import.meta.env.VITE_OPENAI_MODEL || "gpt-4",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.1
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`)
      }

      const data = await response.json()
      const analysisText = data.choices[0].message.content

      // Try to parse the JSON response
      try {
        const parsedData = JSON.parse(analysisText)
        setAnalysisData(parsedData)
        
        // Save to database if Supabase is configured
        await saveToDatabase(parsedData)
        
        setAnalysisStatus('<div class="success">✅ Analysis complete and saved to database!</div>')
      } catch (parseError) {
        console.error('JSON parse error:', parseError)
        console.log('Raw response:', analysisText)
        setAnalysisStatus('<div class="error">❌ Could not parse AI response. Check console for details.</div>')
      }

    } catch (error) {
      console.error('Analysis error:', error)
      setAnalysisStatus(`<div class="error">❌ Analysis failed: ${error.message}</div>`)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const displayAnalysisResults = (data) => {
    if (!data) return null

    return (
      <div className="analysis-results">
        <h3>🎯 Extracted Health Outcomes:</h3>
        
        {data.outcomes.map((outcome, index) => {
          const effectText = outcome.effect_direction === 'POSITIVE' ? '✅ Beneficial' : 
                           outcome.effect_direction === 'NEGATIVE' ? '❌ Harmful' : '⚪ No Effect'
          
          return (
            <div key={index} className="result">
              <h4>{outcome.outcome_name} {effectText}</h4>
              <p><strong>Effect Size:</strong> {outcome.effect_size} ({outcome.effect_size_type})</p>
              <p><strong>Confidence Interval:</strong> {outcome.confidence_interval_lower} - {outcome.confidence_interval_upper}</p>
              <p><strong>P-value:</strong> {outcome.p_value}</p>
              <p><strong>Statistically Significant:</strong> {outcome.statistical_significance ? 'Yes' : 'No'}</p>
              <p><strong>Raw Finding:</strong> {outcome.raw_finding}</p>
            </div>
          )
        })}
        
        <div className="result">
          <h4>📊 Study Quality Assessment:</h4>
          <p><strong>Estimated Sample Size:</strong> {data.study_quality.estimated_sample_size}</p>
          <p><strong>Study Design:</strong> {data.study_quality.study_design}</p>
          <p><strong>Quality Score:</strong> {data.study_quality.quality_score_estimate}/10</p>
        </div>
      </div>
    )
  }

  return (
    <div className="section">
      <h2>Step 2: Analyze Research Text</h2>
      <p className="section-description">
        Paste the results section from a research paper to extract structured health outcomes data.
      </p>
      
      <div className="input-group">
        <label htmlFor="research-text">Research Results Text *</label>
        <textarea
          id="research-text"
          placeholder="Example: Participants receiving gender-affirming care had 60% lower odds of moderate or severe depression..."
          value={researchText}
          onChange={(e) => setResearchText(e.target.value)}
          rows="8"
          className="research-textarea"
        />
      </div>

      <div className="paper-info-grid">
        <div className="input-group">
          <label htmlFor="paper-title">Paper Title</label>
          <input
            type="text"
            id="paper-title"
            placeholder="Paper Title"
            value={paperInfo.title}
            onChange={(e) => setPaperInfo({...paperInfo, title: e.target.value})}
          />
        </div>

        <div className="input-group">
          <label htmlFor="paper-authors">Authors</label>
          <input
            type="text"
            id="paper-authors"
            placeholder="Authors"
            value={paperInfo.authors}
            onChange={(e) => setPaperInfo({...paperInfo, authors: e.target.value})}
          />
        </div>

        <div className="input-group">
          <label htmlFor="paper-journal">Journal</label>
          <input
            type="text"
            id="paper-journal"
            placeholder="Journal"
            value={paperInfo.journal}
            onChange={(e) => setPaperInfo({...paperInfo, journal: e.target.value})}
          />
        </div>

        <div className="input-group">
          <label htmlFor="paper-year">Year</label>
          <input
            type="number"
            id="paper-year"
            placeholder="Year"
            value={paperInfo.year}
            onChange={(e) => setPaperInfo({...paperInfo, year: e.target.value})}
          />
        </div>
      </div>

      <button 
        onClick={analyzeText}
        disabled={isAnalyzing}
        className="primary-button"
      >
        {isAnalyzing ? '🤖 Analyzing...' : '🔍 Analyze Research Text'}
      </button>
      
      <div 
        dangerouslySetInnerHTML={{ __html: analysisStatus }}
      />
      
      {displayAnalysisResults(analysisData)}
    </div>
  )
}

export default ResearchAnalysisSection