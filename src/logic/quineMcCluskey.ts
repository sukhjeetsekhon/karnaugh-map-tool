import {
  VariableCount,
  CellValue,
  Implicant,
  MinimizationResult,
  PrimeImplicantChart,
  PrimeImplicantChartRow,
  NotationMode,
} from '../types';
import { mintermToBinary, formatSopTerm, formatPosTerm } from './grayCode';

export const IMPLICANT_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#6366F1', // Indigo
  '#14B8A6', // Teal
  '#E11D48', // Rose
];

interface RawTerm {
  pattern: string;
  minterms: number[];
  used: boolean;
}

function canCombine(p1: string, p2: string): number {
  let diffPos = -1;
  for (let i = 0; i < p1.length; i++) {
    if (p1[i] !== p2[i]) {
      if ((p1[i] === '0' && p2[i] === '1') || (p1[i] === '1' && p2[i] === '0')) {
        if (diffPos !== -1) return -1;
        diffPos = i;
      } else {
        return -1;
      }
    }
  }
  return diffPos;
}

export function patternCoversMinterm(pattern: string, mintermBinary: string): boolean {
  if (pattern.length !== mintermBinary.length) return false;
  for (let i = 0; i < pattern.length; i++) {
    if (pattern[i] !== '-' && pattern[i] !== mintermBinary[i]) {
      return false;
    }
  }
  return true;
}

function countLiterals(pattern: string): number {
  let count = 0;
  for (let i = 0; i < pattern.length; i++) {
    if (pattern[i] !== '-') count++;
  }
  return count;
}

function findPrimeImplicants(
  numVars: VariableCount,
  activeMinterms: number[],
  dontCareMinterms: number[]
): { pattern: string; minterms: number[] }[] {
  const allTerms = [...activeMinterms, ...dontCareMinterms];
  if (allTerms.length === 0) return [];

  let currentGroups: Map<number, RawTerm[]> = new Map();

  for (const m of allTerms) {
    const bin = mintermToBinary(numVars, m);
    const count1s = (bin.match(/1/g) || []).length;
    if (!currentGroups.has(count1s)) {
      currentGroups.set(count1s, []);
    }
    currentGroups.get(count1s)!.push({
      pattern: bin,
      minterms: [m],
      used: false,
    });
  }

  const primeImplicants: { pattern: string; minterms: number[] }[] = [];

  while (currentGroups.size > 0) {
    const nextGroups: Map<number, RawTerm[]> = new Map();
    const seenPatterns = new Set<string>();

    const sortedGroupKeys = Array.from(currentGroups.keys()).sort((a, b) => a - b);

    for (let k = 0; k < sortedGroupKeys.length; k++) {
      const g1 = sortedGroupKeys[k];
      const g2 = g1 + 1;
      const terms1 = currentGroups.get(g1) || [];
      const terms2 = currentGroups.get(g2) || [];

      for (const t1 of terms1) {
        for (const t2 of terms2) {
          const diffPos = canCombine(t1.pattern, t2.pattern);
          if (diffPos !== -1) {
            t1.used = true;
            t2.used = true;

            const newPattern = t1.pattern.substring(0, diffPos) + '-' + t1.pattern.substring(diffPos + 1);
            if (!seenPatterns.has(newPattern)) {
              seenPatterns.add(newPattern);
              const combinedMinterms = Array.from(new Set([...t1.minterms, ...t2.minterms])).sort((a, b) => a - b);
              const count1s = (newPattern.match(/1/g) || []).length;
              if (!nextGroups.has(count1s)) {
                nextGroups.set(count1s, []);
              }
              nextGroups.get(count1s)!.push({
                pattern: newPattern,
                minterms: combinedMinterms,
                used: false,
              });
            }
          }
        }
      }
    }

    for (const terms of currentGroups.values()) {
      for (const term of terms) {
        if (!term.used) {
          if (!primeImplicants.some((pi) => pi.pattern === term.pattern)) {
            primeImplicants.push({
              pattern: term.pattern,
              minterms: term.minterms,
            });
          }
        }
      }
    }

    currentGroups = nextGroups;
  }

  return primeImplicants;
}

function solveCoverage(
  primeImplicants: { pattern: string; minterms: number[] }[],
  targetMinterms: number[],
  numVars: VariableCount,
  isPos: boolean,
  notation: NotationMode
): {
  allPrimeImplicants: Implicant[];
  essentialPrimeImplicants: Implicant[];
  minimalCover: Implicant[];
  chart: PrimeImplicantChart;
} {
  const allPIs: Implicant[] = primeImplicants.map((pi, idx) => ({
    id: `pi-${isPos ? 'pos' : 'sop'}-${idx}`,
    pattern: pi.pattern,
    minterms: pi.minterms,
    isEssential: false,
    color: IMPLICANT_COLORS[idx % IMPLICANT_COLORS.length],
    sopTerm: formatSopTerm(pi.pattern, numVars, notation),
    posTerm: formatPosTerm(pi.pattern, numVars, notation),
  }));

  const chartRows: PrimeImplicantChartRow[] = allPIs.map((pi) => {
    const covers = targetMinterms.map((m) => {
      const bin = mintermToBinary(numVars, m);
      return patternCoversMinterm(pi.pattern, bin);
    });
    return { implicant: pi, covers };
  });

  const chart: PrimeImplicantChart = {
    minterms: targetMinterms,
    rows: chartRows,
  };

  if (targetMinterms.length === 0) {
    return {
      allPrimeImplicants: allPIs,
      essentialPrimeImplicants: [],
      minimalCover: [],
      chart,
    };
  }

  const coveredByCount = new Array(targetMinterms.length).fill(0);
  const coveringPI = new Array(targetMinterms.length).fill(-1);

  for (let c = 0; c < targetMinterms.length; c++) {
    for (let r = 0; r < chartRows.length; r++) {
      if (chartRows[r].covers[c]) {
        coveredByCount[c]++;
        coveringPI[c] = r;
      }
    }
  }

  const essentialIndices = new Set<number>();
  for (let c = 0; c < targetMinterms.length; c++) {
    if (coveredByCount[c] === 1) {
      essentialIndices.add(coveringPI[c]);
    }
  }

  for (const idx of essentialIndices) {
    allPIs[idx].isEssential = true;
    chartRows[idx].implicant.isEssential = true;
  }

  const essentialPIs = Array.from(essentialIndices).map((idx) => allPIs[idx]);

  const coveredMinterms = new Set<number>();
  for (const idx of essentialIndices) {
    for (let c = 0; c < targetMinterms.length; c++) {
      if (chartRows[idx].covers[c]) {
        coveredMinterms.add(targetMinterms[c]);
      }
    }
  }

  const remainingMintermIndices: number[] = [];
  for (let c = 0; c < targetMinterms.length; c++) {
    if (!coveredMinterms.has(targetMinterms[c])) {
      remainingMintermIndices.push(c);
    }
  }

  if (remainingMintermIndices.length === 0) {
    return {
      allPrimeImplicants: allPIs,
      essentialPrimeImplicants: essentialPIs,
      minimalCover: essentialPIs,
      chart,
    };
  }

  const candidateIndices = allPIs
    .map((_, i) => i)
    .filter((i) => !essentialIndices.has(i));

  let bestCover: number[] | null = null;
  let bestLiteralCount = Infinity;

  function coversAll(selectedCandidateIndices: number[]): boolean {
    for (const mIdx of remainingMintermIndices) {
      let isCov = false;
      for (const piIdx of selectedCandidateIndices) {
        if (chartRows[piIdx].covers[mIdx]) {
          isCov = true;
          break;
        }
      }
      if (!isCov) return false;
    }
    return true;
  }

  function findBestCover(index: number, currentSubset: number[]) {
    if (coversAll(currentSubset)) {
      const literals = currentSubset.reduce((sum, idx) => sum + countLiterals(allPIs[idx].pattern), 0);
      if (
        bestCover === null ||
        currentSubset.length < bestCover.length ||
        (currentSubset.length === bestCover.length && literals < bestLiteralCount)
      ) {
        bestCover = [...currentSubset];
        bestLiteralCount = literals;
      }
      return;
    }

    if (bestCover !== null && currentSubset.length >= bestCover.length) {
      return;
    }

    for (let i = index; i < candidateIndices.length; i++) {
      currentSubset.push(candidateIndices[i]);
      findBestCover(i + 1, currentSubset);
      currentSubset.pop();
    }
  }

  findBestCover(0, []);

  const fullCoverIndices = Array.from(new Set([...Array.from(essentialIndices), ...(bestCover || [])]));
  const minimalCover = fullCoverIndices.map((idx) => allPIs[idx]);

  return {
    allPrimeImplicants: allPIs,
    essentialPrimeImplicants: essentialPIs,
    minimalCover,
    chart,
  };
}

export function minimizeKMap(
  numVars: VariableCount,
  grid: Record<number, CellValue>,
  notation: NotationMode = 'prime'
): MinimizationResult {
  const totalCells = 1 << numVars;
  const ones: number[] = [];
  const zeros: number[] = [];
  const dontCares: number[] = [];

  for (let m = 0; m < totalCells; m++) {
    const val = grid[m] ?? '0';
    if (val === '1') ones.push(m);
    else if (val === '0') zeros.push(m);
    else if (val === 'X') dontCares.push(m);
  }

  const isTautology = ones.length + dontCares.length === totalCells && ones.length > 0;
  const isContradiction = zeros.length + dontCares.length === totalCells;

  const sopPIs = findPrimeImplicants(numVars, ones, dontCares);
  const sopSolution = solveCoverage(sopPIs, ones, numVars, false, notation);

  const posPIs = findPrimeImplicants(numVars, zeros, dontCares);
  const posSolution = solveCoverage(posPIs, zeros, numVars, true, notation);

  let sopExpression: string;
  if (isTautology) {
    sopExpression = '1';
  } else if (isContradiction || ones.length === 0) {
    sopExpression = '0';
  } else {
    sopExpression = sopSolution.minimalCover.map((pi) => pi.sopTerm).join(' + ');
  }

  let posExpression: string;
  if (isTautology || zeros.length === 0) {
    posExpression = '1';
  } else if (isContradiction) {
    posExpression = '0';
  } else {
    posExpression = posSolution.minimalCover.map((pi) => pi.posTerm).join('');
  }

  return {
    numVars,
    isTautology,
    isContradiction,
    minimalSop: isTautology ? [] : sopSolution.minimalCover,
    minimalPos: isContradiction ? [] : posSolution.minimalCover,
    allPrimeImplicantsSop: sopSolution.allPrimeImplicants,
    allPrimeImplicantsPos: posSolution.allPrimeImplicants,
    essentialPrimeImplicantsSop: sopSolution.essentialPrimeImplicants,
    essentialPrimeImplicantsPos: posSolution.essentialPrimeImplicants,
    chartSop: sopSolution.chart,
    chartPos: posSolution.chart,
    sopExpression,
    posExpression,
  };
}
