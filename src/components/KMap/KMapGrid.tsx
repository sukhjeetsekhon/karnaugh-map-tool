import React from 'react';
import { VariableCount, CellValue, Implicant, AppMode } from '../../types';
import { getGridDimensions, coordToMinterm, mintermToBinary } from '../../logic/grayCode';
import { KMapOverlay } from './KMapOverlay';

interface KMapGridProps {
  numVars: VariableCount;
  grid: Record<number, CellValue>;
  onCellClick: (minterm: number) => void;
  onCellRightClick?: (minterm: number, e: React.MouseEvent) => void;
  implicants: Implicant[];
  activeImplicantId: string | null;
  mode: AppMode;
  selectedMinterms?: Set<number>;
}

export const KMapGrid: React.FC<KMapGridProps> = ({
  numVars,
  grid,
  onCellClick,
  onCellRightClick,
  implicants,
  activeImplicantId,
  mode,
  selectedMinterms = new Set(),
}) => {
  const { rows, cols, rowVars, colVars, rowLabels, colLabels } = getGridDimensions(numVars);

  const cellWidth = 76;
  const cellHeight = 76;

  return (
    <div className="flex flex-col items-center select-none">
      <div className="flex items-center mb-1">
        <div style={{ width: 88 }} className="text-right pr-2 text-xs font-bold text-slate-500 dark:text-slate-400">
          {rowVars.join('')} \ {colVars.join('')}
        </div>
        <div className="flex" style={{ width: cols * cellWidth }}>
          {colLabels.map((label, cIdx) => (
            <div
              key={cIdx}
              style={{ width: cellWidth }}
              className="text-center text-xs font-mono font-bold text-slate-600 dark:text-slate-300 py-1"
            >
              {label}
            </div>
          ))}
        </div>
      </div>

      <div className="flex">
        <div className="flex flex-col" style={{ width: 88 }}>
          {rowLabels.map((label, rIdx) => (
            <div
              key={rIdx}
              style={{ height: cellHeight }}
              className="flex items-center justify-end pr-3 text-xs font-mono font-bold text-slate-600 dark:text-slate-300"
            >
              {label}
            </div>
          ))}
        </div>

        <div
          className="relative rounded-lg shadow-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
          style={{ width: cols * cellWidth, height: rows * cellHeight }}
        >
          <div
            className="grid w-full h-full"
            style={{
              gridTemplateColumns: `repeat(${cols}, ${cellWidth}px)`,
              gridTemplateRows: `repeat(${rows}, ${cellHeight}px)`,
            }}
          >
            {Array.from({ length: rows }).map((_, r) =>
              Array.from({ length: cols }).map((_, c) => {
                const minterm = coordToMinterm(numVars, r, c);
                const val = grid[minterm] ?? '0';
                const isSelected = selectedMinterms.has(minterm);
                const bin = mintermToBinary(numVars, minterm);

                let valStyle = 'text-slate-400 dark:text-slate-600';
                if (val === '1') {
                  valStyle = 'text-blue-600 dark:text-blue-400 font-extrabold text-2xl';
                } else if (val === 'X') {
                  valStyle = 'text-amber-500 dark:text-amber-400 font-extrabold text-2xl';
                }

                return (
                  <button
                    key={`${r}-${c}`}
                    type="button"
                    onClick={() => onCellClick(minterm)}
                    onContextMenu={(e) => {
                      if (onCellRightClick) {
                        e.preventDefault();
                        onCellRightClick(minterm, e);
                      }
                    }}
                    title={`Minterm m${minterm} (${bin}): click to toggle, right-click for Don't-Care`}
                    className={`relative flex flex-col items-center justify-center border border-slate-200/80 dark:border-slate-800 transition-colors focus:outline-none ${
                      isSelected
                        ? 'bg-blue-100/90 dark:bg-blue-900/60 ring-2 ring-blue-500 ring-inset z-20'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <span className="absolute top-1 left-1.5 text-[10px] font-mono text-slate-400 dark:text-slate-500 pointer-events-none">
                      m{minterm}
                    </span>

                    <span className={`font-mono transition-transform active:scale-90 ${valStyle}`}>
                      {val}
                    </span>

                    <span className="absolute bottom-1 right-1.5 text-[9px] font-mono text-slate-300 dark:text-slate-600 pointer-events-none">
                      {bin}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          <KMapOverlay
            numVars={numVars}
            implicants={implicants}
            activeImplicantId={activeImplicantId}
            cellWidth={cellWidth}
            cellHeight={cellHeight}
            gridRows={rows}
            gridCols={cols}
          />
        </div>
      </div>

      <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-3">
        {mode === 'solver' ? (
          <>
            <span>Left-click: cycle <code>0 &rarr; 1 &rarr; X</code></span>
            <span>&bull;</span>
            <span>Right-click: quick set <code>X</code></span>
          </>
        ) : (
          <span className="text-blue-600 dark:text-blue-400 font-medium">
            Click cells to select/deselect them for your custom group
          </span>
        )}
      </div>
    </div>
  );
};
