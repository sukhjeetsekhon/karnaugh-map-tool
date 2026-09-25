import React, { useState, useEffect } from 'react';
import { VariableCount, CellValue, SolutionMode } from '../../types';
import { Sparkles, RotateCcw, Shuffle, Layers } from 'lucide-react';

interface MintermBarProps {
  numVars: VariableCount;
  grid: Record<number, CellValue>;
  onChangeGrid: (newGrid: Record<number, CellValue>) => void;
  solutionMode: SolutionMode;
  onToggleSolutionMode: (mode: SolutionMode) => void;
}

export const MintermBar: React.FC<MintermBarProps> = ({
  numVars,
  grid,
  onChangeGrid,
  solutionMode,
  onToggleSolutionMode,
}) => {
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

  const [onesInput, setOnesInput] = useState('');
  const [dontCaresInput, setDontCaresInput] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);

  useEffect(() => {
    if (solutionMode === 'SOP') {
      setOnesInput(ones.join(', '));
    } else {
      setOnesInput(zeros.join(', '));
    }
    setDontCaresInput(dontCares.join(', '));
    setParseError(null);
  }, [grid, solutionMode, numVars]);

  function handleApplyNumericInputs() {
    try {
      setParseError(null);
      const parseNums = (str: string): number[] => {
        if (!str.trim()) return [];
        return str
          .split(/[\s,;]+/)
          .filter(Boolean)
          .map((item) => {
            const n = parseInt(item.replace(/^m/i, '').trim(), 10);
            if (isNaN(n) || n < 0 || n >= totalCells) {
              throw new Error(`Invalid minterm '${item}'. Must be between 0 and ${totalCells - 1}.`);
            }
            return n;
          });
      };

      const primaryList = Array.from(new Set(parseNums(onesInput)));
      const dcList = Array.from(new Set(parseNums(dontCaresInput)));

      const collision = primaryList.find((m) => dcList.includes(m));
      if (collision !== undefined) {
        throw new Error(`Minterm m${collision} cannot be both in main terms and don't-cares.`);
      }

      const newGrid: Record<number, CellValue> = {};
      for (let m = 0; m < totalCells; m++) {
        if (solutionMode === 'SOP') {
          if (primaryList.includes(m)) newGrid[m] = '1';
          else if (dcList.includes(m)) newGrid[m] = 'X';
          else newGrid[m] = '0';
        } else {
          if (primaryList.includes(m)) newGrid[m] = '0';
          else if (dcList.includes(m)) newGrid[m] = 'X';
          else newGrid[m] = '1';
        }
      }

      onChangeGrid(newGrid);
    } catch (err: unknown) {
      setParseError(err instanceof Error ? err.message : String(err));
    }
  }

  function handleClear() {
    const newGrid: Record<number, CellValue> = {};
    for (let m = 0; m < totalCells; m++) newGrid[m] = '0';
    onChangeGrid(newGrid);
  }

  function handleSetAll1s() {
    const newGrid: Record<number, CellValue> = {};
    for (let m = 0; m < totalCells; m++) newGrid[m] = '1';
    onChangeGrid(newGrid);
  }

  function handleInvert() {
    const newGrid: Record<number, CellValue> = {};
    for (let m = 0; m < totalCells; m++) {
      const v = grid[m] ?? '0';
      if (v === '1') newGrid[m] = '0';
      else if (v === '0') newGrid[m] = '1';
      else newGrid[m] = 'X';
    }
    onChangeGrid(newGrid);
  }

  function handleRandomize() {
    const newGrid: Record<number, CellValue> = {};
    for (let m = 0; m < totalCells; m++) {
      const rand = Math.random();
      if (rand < 0.45) newGrid[m] = '1';
      else if (rand < 0.85) newGrid[m] = '0';
      else newGrid[m] = 'X';
    }
    onChangeGrid(newGrid);
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => onToggleSolutionMode('SOP')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              solutionMode === 'SOP'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            SOP (&Sigma; m)
          </button>
          <button
            type="button"
            onClick={() => onToggleSolutionMode('POS')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              solutionMode === 'POS'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            POS (&Pi; M)
          </button>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={handleClear}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 transition-colors"
            title="Set all cells to 0"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            Clear
          </button>
          <button
            type="button"
            onClick={handleSetAll1s}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 transition-colors"
            title="Set all cells to 1"
          >
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            All 1s
          </button>
          <button
            type="button"
            onClick={handleInvert}
            className="px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 transition-colors"
            title="Invert 0 and 1 values"
          >
            Invert
          </button>
          <button
            type="button"
            onClick={handleRandomize}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 transition-colors"
            title="Generate random truth values"
          >
            <Shuffle className="w-3.5 h-3.5 text-amber-500" />
            Random
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            {solutionMode === 'SOP' ? 'Minterms: Σ m(' : 'Maxterms: Π M('}
            <span className="font-normal text-slate-500">e.g. 1, 3, 5, 7</span>)
          </label>
          <input
            type="text"
            value={onesInput}
            onChange={(e) => setOnesInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleApplyNumericInputs()}
            placeholder="e.g. 0, 2, 8, 10"
            className="w-full px-3 py-1.5 text-sm font-mono bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Don't Cares: d(
            <span className="font-normal text-slate-500">optional, e.g. 2, 6</span>)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={dontCaresInput}
              onChange={(e) => setDontCaresInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleApplyNumericInputs()}
              placeholder="e.g. 14, 15"
              className="w-full px-3 py-1.5 text-sm font-mono bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleApplyNumericInputs}
              className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-lg transition-all shadow-sm shrink-0 flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Apply
            </button>
          </div>
        </div>
      </div>

      {parseError && (
        <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 p-2 rounded-md border border-red-200 dark:border-red-900/60">
          {parseError}
        </div>
      )}
    </div>
  );
};
