/**
 * State Types for Research Analyzer
 * Defines interfaces for state rankings and US states data
 */

export interface StateRanking {
  state: string;
  workforceImpactScore: number;
  grade: WorkforceGrade;

  // Connection metrics
  totalConnections: number;
  positiveConnections: number;
  negativeConnections: number;

  // Quality metrics
  averageStrength: number;
  averageWorkforceRelevance: number;
  positiveConnectionRate: number;
  evidenceQualityScore: number;

  // Evidence breakdown
  strongEvidence: number;
  moderateEvidence: number;
  weakEvidence: number;

  // Policy metrics
  policies: number;
  researchPapers: number;

  // Baseline data
  baselineWorkforceScore: number;
  policyImpactScore: number;
  hasBaselineData: boolean;

  // Enhanced metrics (optional)
  policyEffectivenessScore?: number;
  evidenceStrengthScore?: number;
  populationImpactScore?: number;
  workforceSupplyScore?: number;
  implementationRate?: number;
  implementationStatusMultiplier?: number;
  populationScaleFactor?: number;
  shortageAreaBonus?: number;
  averagePopulationAffected?: number;

  // Confidence metrics (optional)
  confidenceLevel?: number;
  uncertaintyRange?: number;
  dataQualityFlag?: DataQualityFlag;
  dataPointsCount?: number;
  trendDirection?: TrendDirection;
  trendConfidence?: ConfidenceLevel;
  scoreRangeLow?: number;
  scoreRangeHigh?: number;
}

export interface WorkforceGrade {
  letter: string;
  color: string;
  description: string;
}

export type DataQualityFlag = 'INSUFFICIENT_DATA' | 'LIMITED_DATA' | 'RELIABLE_DATA';
export type TrendDirection = 'IMPROVING' | 'STABLE' | 'DECLINING';
export type ConfidenceLevel = 'HIGH' | 'MODERATE' | 'LOW';

export interface StateBaselineWorkforce {
  stateName: string;
  baselineWorkforceScore: number;
  physicianDensity?: number;
  nurseRatio?: number;
  ruralAccessScore?: number;
  specialtyDistribution?: Record<string, number>;
}

export type StateAbbreviation =
  | 'AL' | 'AK' | 'AZ' | 'AR' | 'CA' | 'CO' | 'CT' | 'DE' | 'FL' | 'GA'
  | 'HI' | 'ID' | 'IL' | 'IN' | 'IA' | 'KS' | 'KY' | 'LA' | 'ME' | 'MD'
  | 'MA' | 'MI' | 'MN' | 'MS' | 'MO' | 'MT' | 'NE' | 'NV' | 'NH' | 'NJ'
  | 'NM' | 'NY' | 'NC' | 'ND' | 'OH' | 'OK' | 'OR' | 'PA' | 'RI' | 'SC'
  | 'SD' | 'TN' | 'TX' | 'UT' | 'VT' | 'VA' | 'WA' | 'WV' | 'WI' | 'WY';

export type StateName =
  | 'ALABAMA' | 'ALASKA' | 'ARIZONA' | 'ARKANSAS' | 'CALIFORNIA'
  | 'COLORADO' | 'CONNECTICUT' | 'DELAWARE' | 'FLORIDA' | 'GEORGIA'
  | 'HAWAII' | 'IDAHO' | 'ILLINOIS' | 'INDIANA' | 'IOWA'
  | 'KANSAS' | 'KENTUCKY' | 'LOUISIANA' | 'MAINE' | 'MARYLAND'
  | 'MASSACHUSETTS' | 'MICHIGAN' | 'MINNESOTA' | 'MISSISSIPPI' | 'MISSOURI'
  | 'MONTANA' | 'NEBRASKA' | 'NEVADA' | 'NEW HAMPSHIRE' | 'NEW JERSEY'
  | 'NEW MEXICO' | 'NEW YORK' | 'NORTH CAROLINA' | 'NORTH DAKOTA' | 'OHIO'
  | 'OKLAHOMA' | 'OREGON' | 'PENNSYLVANIA' | 'RHODE ISLAND' | 'SOUTH CAROLINA'
  | 'SOUTH DAKOTA' | 'TENNESSEE' | 'TEXAS' | 'UTAH' | 'VERMONT'
  | 'VIRGINIA' | 'WASHINGTON' | 'WEST VIRGINIA' | 'WISCONSIN' | 'WYOMING';

/**
 * US States mapping: Full name to abbreviation
 */
export const US_STATES: Record<StateName, StateAbbreviation> = {
  'ALABAMA': 'AL', 'ALASKA': 'AK', 'ARIZONA': 'AZ', 'ARKANSAS': 'AR', 'CALIFORNIA': 'CA',
  'COLORADO': 'CO', 'CONNECTICUT': 'CT', 'DELAWARE': 'DE', 'FLORIDA': 'FL', 'GEORGIA': 'GA',
  'HAWAII': 'HI', 'IDAHO': 'ID', 'ILLINOIS': 'IL', 'INDIANA': 'IN', 'IOWA': 'IA',
  'KANSAS': 'KS', 'KENTUCKY': 'KY', 'LOUISIANA': 'LA', 'MAINE': 'ME', 'MARYLAND': 'MD',
  'MASSACHUSETTS': 'MA', 'MICHIGAN': 'MI', 'MINNESOTA': 'MN', 'MISSISSIPPI': 'MS', 'MISSOURI': 'MO',
  'MONTANA': 'MT', 'NEBRASKA': 'NE', 'NEVADA': 'NV', 'NEW HAMPSHIRE': 'NH', 'NEW JERSEY': 'NJ',
  'NEW MEXICO': 'NM', 'NEW YORK': 'NY', 'NORTH CAROLINA': 'NC', 'NORTH DAKOTA': 'ND', 'OHIO': 'OH',
  'OKLAHOMA': 'OK', 'OREGON': 'OR', 'PENNSYLVANIA': 'PA', 'RHODE ISLAND': 'RI', 'SOUTH CAROLINA': 'SC',
  'SOUTH DAKOTA': 'SD', 'TENNESSEE': 'TN', 'TEXAS': 'TX', 'UTAH': 'UT', 'VERMONT': 'VT',
  'VIRGINIA': 'VA', 'WASHINGTON': 'WA', 'WEST VIRGINIA': 'WV', 'WISCONSIN': 'WI', 'WYOMING': 'WY'
};

/**
 * Reverse mapping: Abbreviation to full name
 */
export const STATE_ABBREVIATIONS: Record<StateAbbreviation, StateName> = Object.fromEntries(
  Object.entries(US_STATES).map(([name, abbrev]) => [abbrev, name as StateName])
) as Record<StateAbbreviation, StateName>;

/**
 * US States as array for dropdowns
 */
export const US_STATES_LIST: Array<{ name: StateName; abbreviation: StateAbbreviation }> =
  Object.entries(US_STATES).map(([name, abbreviation]) => ({
    name: name as StateName,
    abbreviation
  }));

export type RankingSortBy = 'score' | 'alpha' | 'connections' | 'policies';

export interface StateRankingFilters {
  sortBy: RankingSortBy;
  minScore?: number;
  maxScore?: number;
  hasData?: boolean;
}
