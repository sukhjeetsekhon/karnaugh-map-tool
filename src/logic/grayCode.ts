import { VariableCount, CellCoord, NotationMode } from '../types';

export const GRAY_CODE_2 = [0, 1];
export const GRAY_CODE_4 = [0, 1, 3, 2]; // 00, 01, 11, 10 in numeric value

export const GRAY_CODE_LABELS_1BIT = ['0', '1'];
export const GRAY_CODE_LABELS_2BIT = ['00', '01', '11', '10'];

const GRAY_TO_INDEX_2BIT: Record<number, number> = {
  0: 0, // 00 -> col 0
  1: 1, // 01 -> col 1
  3: 2, // 11 -> col 2
  2: 3, // 10 -> col 3
};

export function getGridDimensions(numVars: VariableCount): {
  rows: number;
  cols: number;
  rowVars: string[];
  colVars: string[];
  rowLabels: string[];
  colLabels: string[];
} {
  switch (numVars) {
    case 2:
      return {
        rows: 2,
        cols: 2,
        rowVars: ['A'],
        colVars: ['B'],
        rowLabels: GRAY_CODE_LABELS_1BIT,
        colLabels: GRAY_CODE_LABELS_1BIT,
      };
    case 3:
      return {
        rows: 2,
        cols: 4,
        rowVars: ['A'],
        colVars: ['B', 'C'],
        rowLabels: GRAY_CODE_LABELS_1BIT,
        colLabels: GRAY_CODE_LABELS_2BIT,
      };
    case 4:
      return {
        rows: 4,
        cols: 4,
        rowVars: ['A', 'B'],
        colVars: ['C', 'D'],
        rowLabels: GRAY_CODE_LABELS_2BIT,
        colLabels: GRAY_CODE_LABELS_2BIT,
      };
  }
}

export function coordToMinterm(numVars: VariableCount, row: number, col: number): number {
  if (numVars === 2) {
    return (row << 1) | col;
  }
  if (numVars === 3) {
    const bc = GRAY_CODE_4[col];
    return (row << 2) | bc;
  }
  const ab = GRAY_CODE_4[row];
  const cd = GRAY_CODE_4[col];
  return (ab << 2) | cd;
}

export function mintermToCoord(numVars: VariableCount, minterm: number): CellCoord {
  if (numVars === 2) {
    const row = (minterm >> 1) & 1;
    const col = minterm & 1;
    return { row, col };
  }
  if (numVars === 3) {
    const row = (minterm >> 2) & 1;
    const bc = minterm & 3;
    const col = GRAY_TO_INDEX_2BIT[bc];
    return { row, col };
  }
  const ab = (minterm >> 2) & 3;
  const cd = minterm & 3;
  const row = GRAY_TO_INDEX_2BIT[ab];
  const col = GRAY_TO_INDEX_2BIT[cd];
  return { row, col };
}

export function mintermToBinary(numVars: VariableCount, minterm: number): string {
  return minterm.toString(2).padStart(numVars, '0');
}

export const VARIABLE_NAMES: Record<VariableCount, string[]> = {
  2: ['A', 'B'],
  3: ['A', 'B', 'C'],
  4: ['A', 'B', 'C', 'D'],
};

export function formatSopTerm(pattern: string, numVars: VariableCount, notation: NotationMode = 'prime'): string {
  const vars = VARIABLE_NAMES[numVars];
  const parts: string[] = [];

  for (let i = 0; i < pattern.length; i++) {
    const char = pattern[i];
    const varName = vars[i];
    if (char === '1') {
      parts.push(varName);
    } else if (char === '0') {
      if (notation === 'prime') {
        parts.push(`${varName}'`);
      } else {
        parts.push(`${varName}\u0305`);
      }
    }
  }

  if (parts.length === 0) return '1';
  return parts.join('');
}

export function formatPosTerm(pattern: string, numVars: VariableCount, notation: NotationMode = 'prime'): string {
  const vars = VARIABLE_NAMES[numVars];
  const parts: string[] = [];

  for (let i = 0; i < pattern.length; i++) {
    const char = pattern[i];
    const varName = vars[i];
    if (char === '0') {
      parts.push(varName);
    } else if (char === '1') {
      if (notation === 'prime') {
        parts.push(`${varName}'`);
      } else {
        parts.push(`${varName}\u0305`);
      }
    }
  }

  if (parts.length === 0) return '0';
  return `(${parts.join(' + ')})`;
}
