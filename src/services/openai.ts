/**
 * OpenAI Service
 * AI-powered analysis for research papers and policy connections
 */

import { RESEARCH_CATEGORIES } from '@/types'
import type { HealthOutcome, StudyQuality, ResearchCategory, ResearchPaper, Policy, ConnectionType } from '@/types'

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'

export interface AnalysisRequest {
  paperTitle: string
  paperText: string
  categories: ResearchCategory[]
}

export interface AnalysisResponse {
  title: string
  outcomes: HealthOutcome[]
  studyQuality: StudyQuality
  summary: string
  keyFindings: string[]
  policyImplications: string[]
}

/**
 * Test OpenAI API connection
 */
export async function testConnection(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    })
    return response.ok
  } catch {
    return false
  }
}

/**
 * Analyze research paper for health outcomes
 */
export async function analyzeResearchPaper(
  apiKey: string,
  request: AnalysisRequest
): Promise<AnalysisResponse> {
  if (!apiKey) {
    throw new Error('OpenAI API key required for AI analysis.')
  }

  if (!request.paperText || request.paperText.trim().length < 20) {
    throw new Error('Research text is too short for meaningful analysis.')
  }

  const categories = request.categories.length > 0
    ? request.categories
    : RESEARCH_CATEGORIES.slice(0, 5)

  const prompt = buildAnalysisPrompt(request.paperTitle, request.paperText, categories)

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a healthcare workforce policy research analyst. Analyze research papers and extract structured findings about health outcomes and policy implications. Always respond with valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    })
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content

  if (!content) {
    throw new Error('No response content from OpenAI')
  }

  try {
    const parsed = JSON.parse(content)
    return mapAnalysisResponse(parsed)
  } catch {
    throw new Error('Failed to parse AI response as JSON')
  }
}

/**
 * Analyze policy-research connection
 */
export async function analyzeConnection(
  apiKey: string,
  policyTitle: string,
  policyDescription: string,
  researchFindings: string
): Promise<{
  connectionType: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' | 'MIXED'
  strengthScore: number
  rationale: string
  outcomeAffected: string
}> {
  if (!apiKey) {
    throw new Error('OpenAI API key required')
  }

  const prompt = `Analyze the connection between this policy and research finding.

POLICY:
Title: ${policyTitle}
Description: ${policyDescription}

RESEARCH FINDING:
${researchFindings}

Provide your analysis as JSON with these fields:
- connectionType: "POSITIVE", "NEGATIVE", "NEUTRAL", or "MIXED"
- strengthScore: 1-10 (how strongly the policy affects the outcome)
- rationale: Brief explanation of the connection
- outcomeAffected: The main health outcome affected`

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a healthcare policy analyst. Analyze connections between policies and research findings. Always respond with valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 500,
      response_format: { type: 'json_object' }
    })
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content

  if (!content) {
    throw new Error('No response from OpenAI')
  }

  const parsed = JSON.parse(content)
  return {
    connectionType: parsed.connectionType || 'NEUTRAL',
    strengthScore: Math.max(1, Math.min(10, Number(parsed.strengthScore) || 5)),
    rationale: parsed.rationale || '',
    outcomeAffected: parsed.outcomeAffected || ''
  }
}

/**
 * Suggestion for a policy-research connection
 */
export interface ConnectionSuggestion {
  policyId: string
  policyTitle: string
  confidence: number // 1-10
  connectionType: ConnectionType
  reasoning: string
  suggestedStrength: number // 1-10
  suggestedEvidenceQuality: number // 1-10
  keyOverlap: string[] // Key topics/themes that overlap
}

/**
 * Suggest potential policy connections for a research paper
 */
export async function suggestPolicyConnections(
  apiKey: string,
  paper: ResearchPaper,
  policies: Policy[],
  maxSuggestions: number = 5
): Promise<ConnectionSuggestion[]> {
  if (!apiKey) {
    throw new Error('OpenAI API key required')
  }

  if (policies.length === 0) {
    return []
  }

  // Pre-filter: limit to top candidates to reduce token usage
  // Prioritize policies that share keywords with the paper title/abstract
  const paperKeywords = extractKeywords(paper.title + ' ' + (paper.abstract || ''))

  const scoredPolicies = policies.map(policy => {
    const policyKeywords = extractKeywords(policy.title + ' ' + (policy.description || ''))
    const overlap = paperKeywords.filter(k => policyKeywords.includes(k)).length
    return { policy, overlap }
  })

  // Sort by overlap and take top candidates
  const candidatePolicies = scoredPolicies
    .sort((a, b) => b.overlap - a.overlap)
    .slice(0, 15)
    .map(s => s.policy)

  if (candidatePolicies.length === 0) {
    return []
  }

  // Build policy summaries for the prompt
  const policySummaries = candidatePolicies.map((p, i) =>
    `[${i + 1}] ID: ${p.policyId}
Title: ${p.title}
Jurisdiction: ${p.jurisdiction}
Description: ${(p.description || 'No description').slice(0, 200)}`
  ).join('\n\n')

  const prompt = `You are a healthcare workforce policy analyst. Analyze the following research paper and identify which policies it might be connected to.

RESEARCH PAPER:
Title: ${paper.title}
Categories: ${paper.categories.join(', ')}
Abstract: ${(paper.abstract || paper.researchText || '').slice(0, 1500)}

CANDIDATE POLICIES:
${policySummaries}

Analyze the research paper and identify the TOP ${maxSuggestions} policies that are most likely to be connected to this research. Consider:
- Topic overlap (does the policy address issues studied in the research?)
- Population affected (does the policy target the same populations?)
- Potential impact (would the research findings inform or be affected by this policy?)

For each suggested connection, provide:
- policyIndex: The number [1-${candidatePolicies.length}] of the policy
- confidence: 1-10 (how confident are you this is a meaningful connection?)
- connectionType: "POSITIVE" (policy supports research findings), "NEGATIVE" (policy contradicts), "NEUTRAL" (related but unclear impact), or "MIXED"
- reasoning: 1-2 sentence explanation of why this connection exists
- suggestedStrength: 1-10 (how strong is this connection?)
- suggestedEvidenceQuality: 1-10 (how well does the research support this connection?)
- keyOverlap: Array of 2-4 key themes/topics that overlap

Return JSON:
{
  "suggestions": [
    {
      "policyIndex": 1,
      "confidence": 8,
      "connectionType": "POSITIVE",
      "reasoning": "This policy directly addresses...",
      "suggestedStrength": 7,
      "suggestedEvidenceQuality": 8,
      "keyOverlap": ["rural health", "physician shortage"]
    }
  ]
}`

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a healthcare workforce policy analyst specializing in connecting research findings to relevant policies. Always respond with valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1500,
      response_format: { type: 'json_object' }
    })
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content

  if (!content) {
    throw new Error('No response from OpenAI')
  }

  const parsed = JSON.parse(content)
  const suggestions = Array.isArray(parsed.suggestions) ? parsed.suggestions : []

  // Map back to actual policy data
  return suggestions
    .filter((s: Record<string, unknown>) => {
      const idx = Number(s.policyIndex) - 1
      return idx >= 0 && idx < candidatePolicies.length
    })
    .map((s: Record<string, unknown>) => {
      const policy = candidatePolicies[Number(s.policyIndex) - 1]
      return {
        policyId: policy.policyId,
        policyTitle: policy.title,
        confidence: Math.max(1, Math.min(10, Number(s.confidence) || 5)),
        connectionType: validateConnectionType(s.connectionType),
        reasoning: String(s.reasoning || ''),
        suggestedStrength: Math.max(1, Math.min(10, Number(s.suggestedStrength) || 5)),
        suggestedEvidenceQuality: Math.max(1, Math.min(10, Number(s.suggestedEvidenceQuality) || 5)),
        keyOverlap: Array.isArray(s.keyOverlap) ? s.keyOverlap.map(String) : []
      }
    })
    .slice(0, maxSuggestions)
}

/**
 * Extract keywords from text for pre-filtering
 */
function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
    'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had',
    'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must',
    'this', 'that', 'these', 'those', 'it', 'its', 'they', 'their', 'them', 'we', 'our',
    'you', 'your', 'i', 'me', 'my', 'he', 'she', 'his', 'her', 'which', 'who', 'whom',
    'what', 'where', 'when', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more',
    'most', 'other', 'some', 'such', 'no', 'not', 'only', 'own', 'same', 'so', 'than',
    'too', 'very', 'can', 'just', 'into', 'also', 'about', 'after', 'before', 'between'
  ])

  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.has(word))
}

function validateConnectionType(value: unknown): ConnectionType {
  const valid = ['POSITIVE', 'NEGATIVE', 'NEUTRAL', 'MIXED']
  const str = String(value).toUpperCase()
  return valid.includes(str) ? str as ConnectionType : 'NEUTRAL'
}

/**
 * Build the analysis prompt
 */
function buildAnalysisPrompt(
  paperTitle: string,
  paperText: string,
  categories: ResearchCategory[]
): string {
  return `Analyze the following research paper and provide detailed findings useful for connecting to healthcare workforce policies.

Paper Title: "${paperTitle}"
Research Categories: ${categories.join(', ')}

Research Text:
${paperText.slice(0, 8000)}

Provide your analysis as JSON with these fields:

{
  "title": "The exact title of the research paper as it appears in the document",
  "outcomes": [
    {
      "outcomeName": "Name of health outcome",
      "effectDirection": "positive" | "negative" | "neutral" | "mixed",
      "effectSize": "Description of effect magnitude",
      "confidence": "high" | "moderate" | "low",
      "populationAffected": "Who is affected",
      "description": "Brief description"
    }
  ],
  "studyQuality": {
    "qualityScoreEstimate": 1-10,
    "studyDesign": "Type of study",
    "sampleSize": "Sample size if mentioned",
    "limitations": ["List of limitations"],
    "strengths": ["List of strengths"]
  },
  "summary": "2-3 sentence summary of key findings",
  "keyFindings": ["List of 3-5 key findings"],
  "policyImplications": ["List of 2-3 policy implications"]
}`
}

/**
 * Map parsed response to AnalysisResponse
 */
function mapAnalysisResponse(parsed: Record<string, unknown>): AnalysisResponse {
  const rawOutcomes = Array.isArray(parsed.outcomes) ? parsed.outcomes : []

  const outcomes: HealthOutcome[] = rawOutcomes.map((o: Record<string, unknown>) => ({
    outcomeName: String(o.outcomeName || o.outcome_name || 'Unknown'),
    effectDirection: validateEffectDirection(o.effectDirection || o.effect_direction),
    effectSize: o.effectSize ? String(o.effectSize) : undefined,
    confidence: validateConfidence(o.confidence),
    populationAffected: o.populationAffected ? String(o.populationAffected) : undefined,
    description: o.description ? String(o.description) : undefined
  }))

  const rawQuality = (parsed.studyQuality || parsed.study_quality || {}) as Record<string, unknown>
  const studyQuality: StudyQuality = {
    qualityScoreEstimate: Math.max(1, Math.min(10, Number(rawQuality.qualityScoreEstimate || rawQuality.quality_score_estimate) || 5)),
    studyDesign: rawQuality.studyDesign ? String(rawQuality.studyDesign) : undefined,
    sampleSize: rawQuality.sampleSize ? String(rawQuality.sampleSize) : undefined,
    limitations: Array.isArray(rawQuality.limitations) ? rawQuality.limitations.map(String) : undefined,
    strengths: Array.isArray(rawQuality.strengths) ? rawQuality.strengths.map(String) : undefined
  }

  return {
    title: String(parsed.title || ''),
    outcomes,
    studyQuality,
    summary: String(parsed.summary || ''),
    keyFindings: Array.isArray(parsed.keyFindings) ? parsed.keyFindings.map(String) : [],
    policyImplications: Array.isArray(parsed.policyImplications) ? parsed.policyImplications.map(String) : []
  }
}

function validateEffectDirection(value: unknown): HealthOutcome['effectDirection'] {
  const valid = ['positive', 'negative', 'neutral', 'mixed']
  const str = String(value).toLowerCase()
  return valid.includes(str) ? str as HealthOutcome['effectDirection'] : 'neutral'
}

function validateConfidence(value: unknown): HealthOutcome['confidence'] {
  const valid = ['high', 'moderate', 'low']
  const str = String(value).toLowerCase()
  return valid.includes(str) ? str as HealthOutcome['confidence'] : 'moderate'
}

export default {
  testConnection,
  analyzeResearchPaper,
  analyzeConnection,
  suggestPolicyConnections
}
