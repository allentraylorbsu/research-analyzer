/**
 * MSW Request Handlers for API Mocking
 */

import { http, HttpResponse } from 'msw'

export const handlers = [
  // OpenAI API mock
  http.get('https://api.openai.com/v1/models', () => {
    return HttpResponse.json({
      object: 'list',
      data: [
        { id: 'gpt-4-turbo-preview', object: 'model', created: 1706037777, owned_by: 'openai' }
      ]
    })
  }),

  http.post('https://api.openai.com/v1/chat/completions', async () => {
    return HttpResponse.json({
      id: 'chatcmpl-test',
      object: 'chat.completion',
      created: 1706037777,
      model: 'gpt-4-turbo-preview',
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: JSON.stringify({
            outcomes: [{
              outcomeName: 'Physician Retention',
              effectDirection: 'positive',
              effectSize: 'moderate',
              confidence: 'high',
              populationAffected: 'Rural physicians',
              description: 'Improved retention rates'
            }],
            studyQuality: {
              qualityScoreEstimate: 8,
              studyDesign: 'Cohort study',
              sampleSize: '500 physicians',
              limitations: ['Limited geographic scope'],
              strengths: ['Long follow-up period']
            },
            summary: 'Study shows positive impact on physician retention.',
            keyFindings: ['20% improvement in retention'],
            policyImplications: ['Support loan forgiveness programs']
          })
        },
        finish_reason: 'stop'
      }],
      usage: { prompt_tokens: 100, completion_tokens: 200, total_tokens: 300 }
    })
  }),

  // LegiScan API mock
  http.get('https://api.legiscan.com/', ({ request }) => {
    const url = new URL(request.url)
    const op = url.searchParams.get('op')
    const state = url.searchParams.get('state')

    if (op === 'getSearch') {
      return HttpResponse.json({
        status: 'OK',
        searchresult: {
          '0': {
            bill_id: 12345,
            bill_number: 'HB 123',
            title: 'Healthcare Workforce Development Act',
            state: state || 'CA',
            status: 'Introduced',
            last_action: 'Referred to Health Committee',
            last_action_date: '2024-01-15'
          },
          '1': {
            bill_id: 12346,
            bill_number: 'SB 456',
            title: 'Physician Loan Forgiveness Program',
            state: state || 'CA',
            status: 'Passed',
            last_action: 'Signed by Governor',
            last_action_date: '2024-02-20'
          }
        }
      })
    }

    if (op === 'getSessionList') {
      return HttpResponse.json({
        status: 'OK',
        sessions: [
          { session_id: 1, session_name: '2024 Regular Session', year_start: 2024, year_end: 2024 }
        ]
      })
    }

    return HttpResponse.json({ status: 'OK' })
  })
]

export default handlers
