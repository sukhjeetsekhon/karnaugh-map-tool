import {
  VariableCount,
  CellValue,
  UserPracticeGroup,
  PracticeFeedback,
  SolutionMode,
} from '../types';
import { mintermToBinary } from './grayCode';
import { minimizeKMap, patternCoversMinterm } from './quineMcCluskey';

export function getSubcubePattern(numVars: VariableCount, minterms: number[]): string | null {
  const size = minterms.length;
  if (size === 0 || (size & (size - 1)) !== 0 || size > (1 << numVars)) {
    return null;
  }

  const binaryStrings = minterms.map((m) => mintermToBinary(numVars, m));

  const patternChars: string[] = [];
  for (let bit = 0; bit < numVars; bit++) {
    const firstChar = binaryStrings[0][bit];
    let allSame = true;
    for (let i = 1; i < binaryStrings.length; i++) {
      if (binaryStrings[i][bit] !== firstChar) {
        allSame = false;
        break;
      }
    }
    patternChars.push(allSame ? firstChar : '-');
  }

  const pattern = patternChars.join('');

  const dashCount = (pattern.match(/-/g) || []).length;
  if ((1 << dashCount) !== size) {
    return null;
  }

  for (const bin of binaryStrings) {
    if (!patternCoversMinterm(pattern, bin)) {
      return null;
    }
  }

  return pattern;
}

export function verifyPracticeGroups(
  numVars: VariableCount,
  grid: Record<number, CellValue>,
  userGroups: UserPracticeGroup[],
  mode: SolutionMode = 'SOP'
): PracticeFeedback {
  const targetVal: CellValue = mode === 'SOP' ? '1' : '0';
  const oppositeVal: CellValue = mode === 'SOP' ? '0' : '1';

  const totalCells = 1 << numVars;
  const targetMinterms: number[] = [];
  for (let m = 0; m < totalCells; m++) {
    if (grid[m] === targetVal) {
      targetMinterms.push(m);
    }
  }

  const errors: string[] = [];
  const warnings: string[] = [];
  const redundantGroupIds: string[] = [];
  const nonPrimeGroupIds: string[] = [];

  if (targetMinterms.length === 0) {
    if (userGroups.length > 0) {
      errors.push(`Function is identically ${oppositeVal}. No groups should be drawn.`);
      return {
        isValid: false,
        errors,
        warnings,
        uncoveredMinterms: [],
        redundantGroupIds: userGroups.map((g) => g.id),
        nonPrimeGroupIds: [],
        isOptimal: false,
      };
    }
    return {
      isValid: true,
      errors: [],
      warnings: [],
      successMessage: `Correct! Function is identically ${oppositeVal}.`,
      uncoveredMinterms: [],
      redundantGroupIds: [],
      nonPrimeGroupIds: [],
      isOptimal: true,
    };
  }

  if (userGroups.length === 0) {
    return {
      isValid: false,
      errors: ['No groups have been created yet. Select cells to form groups.'],
      warnings: [],
      uncoveredMinterms: targetMinterms,
      redundantGroupIds: [],
      nonPrimeGroupIds: [],
      isOptimal: false,
    };
  }

  const validGroupPatterns = new Map<string, string>();

  userGroups.forEach((group, idx) => {
    const label = `Group #${idx + 1}`;

    if (group.minterms.length === 0) {
      errors.push(`${label} is empty.`);
      return;
    }

    const size = group.minterms.length;
    if ((size & (size - 1)) !== 0) {
      errors.push(`${label} has ${size} cells. Group sizes must be powers of 2 (1, 2, 4, 8, 16).`);
      return;
    }

    for (const m of group.minterms) {
      if (grid[m] === oppositeVal) {
        errors.push(`${label} contains minterm m${m} which has value '${oppositeVal}'. Only '${targetVal}' and 'X' may be grouped.`);
        return;
      }
    }

    const pattern = getSubcubePattern(numVars, group.minterms);
    if (!pattern) {
      errors.push(`${label} does not form a valid rectangular subcube in the Karnaugh map.`);
      return;
    }

    validGroupPatterns.set(group.id, pattern);
  });

  if (errors.length > 0) {
    return {
      isValid: false,
      errors,
      warnings,
      uncoveredMinterms: targetMinterms,
      redundantGroupIds: [],
      nonPrimeGroupIds: [],
      isOptimal: false,
    };
  }

  const coveredMintermsSet = new Set<number>();
  for (const group of userGroups) {
    for (const m of group.minterms) {
      if (grid[m] === targetVal) {
        coveredMintermsSet.add(m);
      }
    }
  }

  const uncoveredMinterms = targetMinterms.filter((m) => !coveredMintermsSet.has(m));
  if (uncoveredMinterms.length > 0) {
    errors.push(`Missing coverage for minterm(s): ${uncoveredMinterms.map((m) => `m${m}`).join(', ')}.`);
  }

  userGroups.forEach((group) => {
    const targetsInThisGroup = group.minterms.filter((m) => grid[m] === targetVal);
    if (targetsInThisGroup.length === 0) {
      warnings.push(`Group contains only Don't-Care ('X') cells and is redundant.`);
      redundantGroupIds.push(group.id);
      return;
    }

    const otherGroupsCover = new Set<number>();
    for (const other of userGroups) {
      if (other.id !== group.id) {
        for (const m of other.minterms) {
          if (grid[m] === targetVal) {
            otherGroupsCover.add(m);
          }
        }
      }
    }

    const allCoveredByOthers = targetsInThisGroup.every((m) => otherGroupsCover.has(m));
    if (allCoveredByOthers) {
      warnings.push(`A group is redundant because all its minterms are already covered by your other groups.`);
      redundantGroupIds.push(group.id);
    }
  });

  const allOptimalSolution = minimizeKMap(numVars, grid);
  const optimalPIs = mode === 'SOP' ? allOptimalSolution.allPrimeImplicantsSop : allOptimalSolution.allPrimeImplicantsPos;
  const optimalCover = mode === 'SOP' ? allOptimalSolution.minimalSop : allOptimalSolution.minimalPos;

  userGroups.forEach((group) => {
    const pattern = validGroupPatterns.get(group.id);
    if (!pattern) return;

    const isPI = optimalPIs.some((pi) => pi.pattern === pattern);
    if (!isPI) {
      warnings.push(`A group is not a Prime Implicant. It can be doubled in size to cover more adjacent '${targetVal}' or 'X' cells.`);
      nonPrimeGroupIds.push(group.id);
    }
  });

  const isCompletelyValid = errors.length === 0;
  const isOptimal =
    isCompletelyValid &&
    warnings.length === 0 &&
    redundantGroupIds.length === 0 &&
    nonPrimeGroupIds.length === 0 &&
    userGroups.length === optimalCover.length;

  let successMessage: string | undefined;
  if (isOptimal) {
    successMessage = `Outstanding! You found the exact minimal ${mode} cover with ${userGroups.length} Prime Implicant(s).`;
  } else if (isCompletelyValid && warnings.length === 0) {
    successMessage = `All minterms are covered! Note: optimal solution has ${optimalCover.length} term(s).`;
  }

  return {
    isValid: isCompletelyValid,
    errors,
    warnings,
    successMessage,
    uncoveredMinterms,
    redundantGroupIds,
    nonPrimeGroupIds,
    isOptimal,
  };
}
