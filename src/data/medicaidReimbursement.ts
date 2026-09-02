/**
 * Medicaid-to-Medicare Fee Index Data (2024)
 * Source: KFF State Health Facts / Urban Institute, May 2025
 * https://www.kff.org/medicaid/state-indicator/medicaid-to-medicare-fee-index/
 *
 * This index measures each state's Medicaid physician fees relative to
 * Medicare physician fees in that state. A ratio of 1.0 means parity;
 * values below 1.0 indicate Medicaid pays less than Medicare.
 *
 * National average (All Services): 0.75
 */

export interface MedicaidReimbursementData {
  state: string
  allServices: number | null
  primaryCare: number | null
  obstetricCare: number | null
  otherServices: number | null
}

export const MEDICAID_REIMBURSEMENT_2024: MedicaidReimbursementData[] = [
  { state: 'Alabama', allServices: 0.92, primaryCare: 0.78, obstetricCare: 1.21, otherServices: 0.93 },
  { state: 'Alaska', allServices: 1.30, primaryCare: 1.30, obstetricCare: 1.29, otherServices: 1.32 },
  { state: 'Arizona', allServices: 0.98, primaryCare: 0.76, obstetricCare: 1.38, otherServices: 1.07 },
  { state: 'Arkansas', allServices: 0.76, primaryCare: 0.59, obstetricCare: 0.70, otherServices: 1.32 },
  { state: 'California', allServices: 0.67, primaryCare: 0.56, obstetricCare: 0.85, otherServices: 0.81 },
  { state: 'Colorado', allServices: 0.83, primaryCare: 0.81, obstetricCare: 0.82, otherServices: 0.89 },
  { state: 'Connecticut', allServices: 0.79, primaryCare: 0.66, obstetricCare: 1.14, otherServices: 0.68 },
  { state: 'Delaware', allServices: 0.96, primaryCare: 0.96, obstetricCare: 0.93, otherServices: 0.99 },
  { state: 'District of Columbia', allServices: 0.81, primaryCare: 0.81, obstetricCare: 0.81, otherServices: 0.82 },
  { state: 'Florida', allServices: 0.64, primaryCare: 0.56, obstetricCare: 0.82, otherServices: 0.73 },
  { state: 'Georgia', allServices: 0.83, primaryCare: 0.73, obstetricCare: 0.92, otherServices: 1.02 },
  { state: 'Hawaii', allServices: 0.84, primaryCare: 0.80, obstetricCare: 1.01, otherServices: 0.70 },
  { state: 'Idaho', allServices: 0.94, primaryCare: 0.97, obstetricCare: 0.90, otherServices: 0.90 },
  { state: 'Illinois', allServices: 0.63, primaryCare: 0.47, obstetricCare: 0.80, otherServices: 0.85 },
  { state: 'Indiana', allServices: 0.96, primaryCare: 1.00, obstetricCare: 0.85, otherServices: 1.01 },
  { state: 'Iowa', allServices: 0.77, primaryCare: 0.62, obstetricCare: 0.82, otherServices: 1.12 },
  { state: 'Kansas', allServices: 0.69, primaryCare: 0.55, obstetricCare: 0.78, otherServices: 0.99 },
  { state: 'Kentucky', allServices: 0.69, primaryCare: 0.54, obstetricCare: 0.95, otherServices: 0.91 },
  { state: 'Louisiana', allServices: 0.64, primaryCare: 0.60, obstetricCare: 0.66, otherServices: 0.72 },
  { state: 'Maine', allServices: 0.78, primaryCare: 0.84, obstetricCare: 0.70, otherServices: 0.71 },
  { state: 'Maryland', allServices: 0.95, primaryCare: 1.02, obstetricCare: 0.89, otherServices: 0.81 },
  { state: 'Massachusetts', allServices: 0.74, primaryCare: 0.64, obstetricCare: 0.94, otherServices: 0.74 },
  { state: 'Michigan', allServices: 0.76, primaryCare: 0.73, obstetricCare: 0.88, otherServices: 0.66 },
  { state: 'Minnesota', allServices: 0.74, primaryCare: 0.76, obstetricCare: 0.67, otherServices: 0.76 },
  { state: 'Mississippi', allServices: 0.93, primaryCare: 0.94, obstetricCare: 0.89, otherServices: 0.91 },
  { state: 'Missouri', allServices: 0.86, primaryCare: 0.86, obstetricCare: 0.83, otherServices: 0.92 },
  { state: 'Montana', allServices: 1.32, primaryCare: 1.32, obstetricCare: 1.31, otherServices: 1.33 },
  { state: 'Nebraska', allServices: 1.01, primaryCare: 0.69, obstetricCare: 1.17, otherServices: 1.68 },
  { state: 'Nevada', allServices: 0.90, primaryCare: 0.84, obstetricCare: 0.98, otherServices: 0.97 },
  { state: 'New Hampshire', allServices: 0.73, primaryCare: 0.61, obstetricCare: 1.00, otherServices: 0.71 },
  { state: 'New Jersey', allServices: 0.61, primaryCare: 0.48, obstetricCare: 0.89, otherServices: 0.56 },
  { state: 'New Mexico', allServices: 1.21, primaryCare: 1.21, obstetricCare: 1.20, otherServices: 1.21 },
  { state: 'New York', allServices: 0.76, primaryCare: 0.68, obstetricCare: 0.83, otherServices: 0.88 },
  { state: 'North Carolina', allServices: 0.82, primaryCare: 0.78, obstetricCare: 0.82, otherServices: 0.96 },
  { state: 'North Dakota', allServices: 1.06, primaryCare: 1.06, obstetricCare: 1.05, otherServices: 1.07 },
  { state: 'Ohio', allServices: 0.63, primaryCare: 0.56, obstetricCare: 0.67, otherServices: 0.78 },
  { state: 'Oklahoma', allServices: 0.94, primaryCare: 0.94, obstetricCare: 0.93, otherServices: 0.95 },
  { state: 'Oregon', allServices: 0.88, primaryCare: 0.78, obstetricCare: 1.18, otherServices: 0.74 },
  { state: 'Pennsylvania', allServices: 0.68, primaryCare: 0.49, obstetricCare: 1.06, otherServices: 0.70 },
  { state: 'Rhode Island', allServices: 0.52, primaryCare: 0.57, obstetricCare: 0.40, otherServices: 0.54 },
  { state: 'South Carolina', allServices: 0.89, primaryCare: 0.86, obstetricCare: 1.07, otherServices: 0.90 },
  { state: 'South Dakota', allServices: 0.91, primaryCare: 0.79, obstetricCare: 1.05, otherServices: 1.07 },
  { state: 'Tennessee', allServices: null, primaryCare: null, obstetricCare: null, otherServices: null },
  { state: 'Texas', allServices: 0.63, primaryCare: 0.52, obstetricCare: 0.75, otherServices: 0.86 },
  { state: 'Utah', allServices: 0.80, primaryCare: 0.76, obstetricCare: 0.87, otherServices: 0.82 },
  { state: 'Vermont', allServices: 0.87, primaryCare: 0.87, obstetricCare: 0.87, otherServices: 0.87 },
  { state: 'Virginia', allServices: 0.83, primaryCare: 0.74, obstetricCare: 0.97, otherServices: 0.87 },
  { state: 'Washington', allServices: 0.64, primaryCare: 0.56, obstetricCare: 0.83, otherServices: 0.56 },
  { state: 'West Virginia', allServices: 0.82, primaryCare: 0.76, obstetricCare: 0.97, otherServices: 0.74 },
  { state: 'Wisconsin', allServices: 0.66, primaryCare: 0.56, obstetricCare: 0.65, otherServices: 0.95 },
  { state: 'Wyoming', allServices: 1.00, primaryCare: 1.03, obstetricCare: 0.98, otherServices: 0.97 }
]

/**
 * National average for reference
 */
export const NATIONAL_AVERAGE = {
  allServices: 0.75,
  primaryCare: 0.66,
  obstetricCare: 0.88,
  otherServices: 0.84
}

/**
 * Convert Medicaid-to-Medicare ratio to a 0-100 score
 * CMS target is 80% of Medicare (0.80 ratio)
 * Score mapping:
 *   >= 1.0 (parity or above): 80-100
 *   0.80-0.99: 60-79
 *   0.65-0.79: 40-59
 *   0.50-0.64: 20-39
 *   < 0.50: 0-19
 */
export function ratioToScore(ratio: number | null): number {
  if (ratio === null) return 50 // Default for states without data (e.g., Tennessee)

  if (ratio >= 1.0) {
    // At or above Medicare parity: score 80-100
    return Math.min(80 + (ratio - 1.0) * 60, 100)
  } else if (ratio >= 0.80) {
    // CMS target zone: score 60-79
    return 60 + ((ratio - 0.80) / 0.20) * 19
  } else if (ratio >= 0.65) {
    // Below target but moderate: score 40-59
    return 40 + ((ratio - 0.65) / 0.15) * 19
  } else if (ratio >= 0.50) {
    // Low reimbursement: score 20-39
    return 20 + ((ratio - 0.50) / 0.15) * 19
  } else {
    // Very low: score 0-19
    return Math.max(ratio / 0.50 * 19, 0)
  }
}

/**
 * Get the reimbursement score for a state (0-100)
 * Uses the "All Services" ratio by default
 */
export function getStateReimbursementScore(
  stateName: string,
  category: 'allServices' | 'primaryCare' | 'obstetricCare' | 'otherServices' = 'allServices'
): number {
  const stateData = MEDICAID_REIMBURSEMENT_2024.find(
    d => d.state.toLowerCase() === stateName.toLowerCase()
  )

  if (!stateData) return 50 // Default if state not found
  return Math.round(ratioToScore(stateData[category]))
}

/**
 * Get the raw reimbursement data for a state
 */
export function getStateReimbursementData(stateName: string): MedicaidReimbursementData | null {
  return MEDICAID_REIMBURSEMENT_2024.find(
    d => d.state.toLowerCase() === stateName.toLowerCase()
  ) || null
}

/**
 * Get all states sorted by reimbursement score (descending)
 */
export function getReimbursementRankings(): Array<{ state: string; ratio: number | null; score: number }> {
  return MEDICAID_REIMBURSEMENT_2024
    .map(d => ({
      state: d.state,
      ratio: d.allServices,
      score: ratioToScore(d.allServices)
    }))
    .sort((a, b) => b.score - a.score)
}
