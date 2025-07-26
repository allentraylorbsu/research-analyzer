import { useState } from 'react'

const PolicyConnectionSection = ({ apiKeys, analysisData }) => {
  const [policyResults, setPolicyResults] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const samplePolicies = [
    {
      policy_id: 1,
      title: "Florida Senate Bill 254",
      jurisdiction: "FL",
      description: "Prohibits gender-affirming medical care for minors including hormone therapy and puberty blockers"
    },
    {
      policy_id: 2,
      title: "California AB 223 - Safe Haven Act",
      jurisdiction: "CA", 
      description: "Provides sanctuary state protections for families seeking gender-affirming care"
    },
    {
      policy_id: 3,
      title: "Texas SB 14",
      jurisdiction: "TX",
      description: "Bans gender transition procedures for minors"
    }
  ]

  const loadSamplePolicies = () => {
    let html = '<h3>📋 Sample Policies Loaded:</h3>'
    samplePolicies.forEach(policy => {
      html += `
        <div class="result">
          <h4>${policy.title} (${policy.jurisdiction})</h4>
          <p>${policy.description}</p>
        </div>
      `
    })
    setPolicyResults(html)
  }

  const testPolicyConnections = async () => {
    if (!analysisData) {
      alert('Please analyze research text first')
      return
    }

    if (!apiKeys) {
      alert('Please test your API connection first')
      return
    }

    setIsAnalyzing(true)
    setPolicyResults('<div class="loading">🔗 Finding policy connections... (this may take a minute)</div>')

    let connections = []

    try {
      for (const outcome of analysisData.outcomes) {
        for (const policy of samplePolicies) {
          const prompt = `
Given this research outcome and policy, determine their relationship.

Research Outcome: 
- ${outcome.outcome_name} shows ${outcome.effect_direction} effect
- Finding: ${outcome.raw_finding}
- Statistical significance: ${outcome.statistical_significance}

Policy: 
- ${policy.title} (${policy.jurisdiction})
- Description: ${policy.description}

Question: Does this research finding SUPPORT, CONTRADICT, EVALUATE, or INFORM this policy?

Respond with ONLY a JSON object:
{
    "relationship": "SUPPORTS|CONTRADICTS|EVALUATES|INFORMS|NONE",
    "evidence_strength": "STRONG|MODERATE|WEAK", 
    "confidence": 0.85,
    "reasoning": "Brief explanation of the connection"
}
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

          if (response.ok) {
            const data = await response.json()
            try {
              const relationship = JSON.parse(data.choices[0].message.content)

              if (relationship.relationship !== 'NONE' && relationship.confidence > 0.6) {
                connections.push({
                  outcome: outcome.outcome_name,
                  policy: policy.title,
                  jurisdiction: policy.jurisdiction,
                  ...relationship
                })
              }
            } catch (parseError) {
              console.error('Could not parse relationship response:', parseError)
            }
          }

          // Small delay to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }

      displayPolicyConnections(connections)

    } catch (error) {
      setPolicyResults(`<div class="error">❌ Policy analysis failed: ${error.message}</div>`)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const displayPolicyConnections = (connections) => {
    if (connections.length === 0) {
      setPolicyResults('<div class="result">No strong policy connections found.</div>')
      return
    }

    let html = '<h3>🎯 Suggested Policy Connections:</h3>'

    connections.forEach(conn => {
      const relationshipColor = {
        'SUPPORTS': '#d4edda',
        'CONTRADICTS': '#f8d7da', 
        'EVALUATES': '#fff3cd',
        'INFORMS': '#e2e3e5'
      }

      html += `
        <div class="result" style="border-left-color: ${relationshipColor[conn.relationship] || '#007cba'};">
          <h4>${conn.outcome} → ${conn.policy}</h4>
          <p><strong>Relationship:</strong> <span style="background: ${relationshipColor[conn.relationship]}; padding: 2px 8px; border-radius: 4px;">${conn.relationship}</span></p>
          <p><strong>Evidence Strength:</strong> ${conn.evidence_strength}</p>
          <p><strong>Confidence:</strong> ${(conn.confidence * 100).toFixed(0)}%</p>
          <p><strong>Reasoning:</strong> ${conn.reasoning}</p>
        </div>
      `
    })

    setPolicyResults(html)
  }

  return (
    <div className="section">
      <h2>Step 3: Test Policy Connections</h2>
      <p className="section-description">
        Explore connections between research findings and relevant policies using AI analysis.
      </p>
      
      <div className="button-group">
        <button 
          onClick={loadSamplePolicies}
          className="secondary-button"
        >
          📋 Load Sample Policies
        </button>
        
        <button 
          onClick={testPolicyConnections}
          disabled={isAnalyzing || !analysisData}
          className="primary-button"
        >
          {isAnalyzing ? '🔗 Analyzing...' : '🎯 Test Policy Matching'}
        </button>
      </div>
      
      <div 
        className="policy-results"
        dangerouslySetInnerHTML={{ __html: policyResults }}
      />
    </div>
  )
}

export default PolicyConnectionSection