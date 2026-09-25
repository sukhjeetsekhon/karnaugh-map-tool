import React from 'react';
import { VariableCount, CellValue, Implicant } from '../../types';
import { VARIABLE_NAMES, mintermToBinary } from '../../logic/grayCode';
import { patternCoversMinterm } from '../../logic/quineMcCluskey';
import { Table } from 'lucide-react';

interface TruthTableProps {
  numVars: VariableCount;
  grid: Record<number, CellValue>;
  onCellClick: (minterm: number) => void;
  activeImplicant: Implicant | null;
}

export const TruthTable: React.FC<TruthTableProps> = ({
  numVars,
  grid,
  onCellClick,
  activeImplicant,
}) => {
  const totalRows = 1 << numVars;
  const vars = VARIABLE_NAMES[numVars];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm flex flex-col h-full overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
          <Table className="w-3.5 h-3.5 text-blue-500" />
          Truth Table
        </h3>
        <span className="text-[11px] text-slate-400">
          Click <code>F</code> to cycle 0 &rarr; 1 &rarr; X
        </span>
      </div>

      <div className="overflow-y-auto flex-1 max-h-[380px]">
        <table className="w-full text-xs text-center border-collapse">
          <thead className="bg-slate-50 dark:bg-slate-800/80 sticky top-0 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800 z-10">
            <tr>
              <th className="py-2 px-2 text-slate-400 font-normal">m</th>
              {vars.map((v) => (
                <th key={v} className="py-2 px-2 font-mono">
                  {v}
                </th>
              ))}
              <th className="py-2 px-3 text-blue-600 dark:text-blue-400 font-bold">F</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {Array.from({ length: totalRows }).map((_, m) => {
              const bin = mintermToBinary(numVars, m);
              const val = grid[m] ?? '0';

              const isHighlighted =
                activeImplicant !== null && patternCoversMinterm(activeImplicant.pattern, bin);

              return (
                <tr
                  key={m}
                  className={`transition-colors font-mono ${
                    isHighlighted
                      ? 'bg-blue-50 dark:bg-blue-900/30'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <td className="py-1 px-2 text-slate-400 text-[11px]">m{m}</td>
                  {bin.split('').map((bit, bIdx) => (
                    <td key={bIdx} className="py-1 px-2 text-slate-600 dark:text-slate-400">
                      {bit}
                    </td>
                  ))}
                  <td className="py-1 px-3">
                    <button
                      type="button"
                      onClick={() => onCellClick(m)}
                      className={`w-7 h-6 rounded flex items-center justify-center font-bold text-xs transition-all mx-auto ${
                        val === '1'
                          ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 ring-1 ring-blue-400/50'
                          : val === 'X'
                          ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-300 ring-1 ring-amber-400/50'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700'
                      }`}
                    >
                      {val}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
