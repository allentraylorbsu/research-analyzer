/**
 * OpenAI Service
 * AI-powered analysis for research papers and policy connections
 */

import { RESEARCH_CATEGORIES } from '@/types'
import type { HealthOutcome, StudyQuality, ResearchCategory } from '@/types'

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
  analyzeConnection
}
