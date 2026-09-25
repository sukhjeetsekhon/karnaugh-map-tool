export type VariableCount = 2 | 3 | 4;

export type CellValue = '0' | '1' | 'X';

export type NotationMode = 'prime' | 'overline'; // e.g. A'B vs ĀB

export type SolutionMode = 'SOP' | 'POS';

export type AppMode = 'solver' | 'practice';

export interface CellCoord {
  row: number;
  col: number;
}

export interface Implicant {
  id: string;
  pattern: string; // e.g. "01-0" where '-' means eliminated variable
  minterms: number[]; // covered 1-minterms (and don't cares included in group)
  isEssential: boolean;
  color: string;
  sopTerm: string; // e.g. "A' B D'"
  posTerm: string; // e.g. "(A + B' + D)"
}

export interface PrimeImplicantChartRow {
  implicant: Implicant;
  covers: boolean[]; // whether it covers minterms[i]
}

export interface PrimeImplicantChart {
  minterms: number[];
  rows: PrimeImplicantChartRow[];
}

export interface MinimizationResult {
  numVars: VariableCount;
  isTautology: boolean; // all 1s (or 1 + X)
  isContradiction: boolean; // all 0s (or 0 + X)
  minimalSop: Implicant[];
  minimalPos: Implicant[];
  allPrimeImplicantsSop: Implicant[];
  allPrimeImplicantsPos: Implicant[];
  essentialPrimeImplicantsSop: Implicant[];
  essentialPrimeImplicantsPos: Implicant[];
  chartSop: PrimeImplicantChart;
  chartPos: PrimeImplicantChart;
  sopExpression: string;
  posExpression: string;
}

export interface UserPracticeGroup {
  id: string;
  minterms: number[];
  color: string;
}

export interface PracticeFeedback {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  successMessage?: string;
  uncoveredMinterms: number[];
  redundantGroupIds: string[];
  nonPrimeGroupIds: string[];
  isOptimal: boolean;
}

export interface PresetProblem {
  name: string;
  description: string;
  numVars: VariableCount;
  minterms: number[];
  dontCares: number[];
}
