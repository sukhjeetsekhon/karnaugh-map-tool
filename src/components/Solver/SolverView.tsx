import React from 'react';
import { MinimizationResult, SolutionMode, NotationMode } from '../../types';
import { Star, CheckCircle2, Copy, Sparkles } from 'lucide-react';

interface SolverViewProps {
  solution: MinimizationResult;
  solutionMode: SolutionMode;
  notation: NotationMode;
  onToggleNotation: () => void;
  activeImplicantId: string | null;
  onHoverImplicant: (id: string | null) => void;
}

export const SolverView: React.FC<SolverViewProps> = ({
  solution,
  solutionMode,
  notation,
  onToggleNotation,
  activeImplicantId,
  onHoverImplicant,
}) => {
  const [copied, setCopied] = React.useState(false);

  const activeMinimalCover = solutionMode === 'SOP' ? solution.minimalSop : solution.minimalPos;
  const activeAllPIs = solutionMode === 'SOP' ? solution.allPrimeImplicantsSop : solution.allPrimeImplicantsPos;
  const activeChart = solutionMode === 'SOP' ? solution.chartSop : solution.chartPos;
  const currentExpression = solutionMode === 'SOP' ? solution.sopExpression : solution.posExpression;

  function copyEquation() {
    navigator.clipboard.writeText(`F = ${currentExpression}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-6">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Minimal {solutionMode} Expression
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleNotation}
              className="px-2.5 py-1 text-xs font-mono font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              title="Toggle Prime tick (A') vs Overline (Ā) notation"
            >
              Notation: {notation === 'prime' ? "A' B" : 'Ā B'}
            </button>

            <button
              type="button"
              onClick={copyEquation}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between overflow-x-auto">
          <div className="flex items-baseline gap-2 font-mono">
            <span className="text-lg font-bold text-slate-400">F =</span>
            {solution.isTautology ? (
              <span className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">1</span>
            ) : solution.isContradiction || activeMinimalCover.length === 0 ? (
              <span className="text-2xl font-extrabold text-slate-500">0</span>
            ) : (
              <div className="flex flex-wrap items-center gap-1.5 text-xl font-bold">
                {activeMinimalCover.map((imp, idx) => {
                  const termStr = solutionMode === 'SOP' ? imp.sopTerm : imp.posTerm;
                  const isHovered = activeImplicantId === imp.id;

                  return (
                    <React.Fragment key={imp.id}>
                      <span
                        onMouseEnter={() => onHoverImplicant(imp.id)}
                        onMouseLeave={() => onHoverImplicant(null)}
                        className={`cursor-pointer px-2 py-0.5 rounded transition-all ${
                          isHovered
                            ? 'ring-2 ring-blue-500 scale-105'
                            : 'hover:brightness-110'
                        }`}
                        style={{
                          backgroundColor: `${imp.color}25`,
                          color: imp.color,
                        }}
                      >
                        {termStr}
                      </span>
                      {solutionMode === 'SOP' && idx < activeMinimalCover.length - 1 && (
                        <span className="text-slate-400 font-normal px-0.5">+</span>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            )}
          </div>

          <div className="text-xs text-slate-500 shrink-0 ml-4">
            {activeMinimalCover.length} term{activeMinimalCover.length === 1 ? '' : 's'}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          Prime Implicants (PI) & Essential Prime Implicants (EPI)
        </h3>

        {activeAllPIs.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No prime implicants for this function.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {activeAllPIs.map((pi) => {
              const termStr = solutionMode === 'SOP' ? pi.sopTerm : pi.posTerm;
              const isSelectedInCover = activeMinimalCover.some((m) => m.id === pi.id);
              const isHovered = activeImplicantId === pi.id;

              return (
                <div
                  key={pi.id}
                  onMouseEnter={() => onHoverImplicant(pi.id)}
                  onMouseLeave={() => onHoverImplicant(null)}
                  className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                    isHovered
                      ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/50 dark:bg-blue-900/20'
                      : isSelectedInCover
                      ? 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800'
                      : 'border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/40 opacity-75'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: pi.color }}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                          {termStr}
                        </span>
                        <span className="font-mono text-xs text-slate-400">({pi.pattern})</span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Minterms: {pi.minterms.map((m) => `m${m}`).join(', ')}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {pi.isEssential ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        Essential (EPI)
                      </span>
                    ) : isSelectedInCover ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                        Selected PI
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800">
                        Redundant PI
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {activeChart.minterms.length > 0 && activeChart.rows.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Prime Implicant Coverage Table
            </h3>
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Star className="w-3 h-3 fill-amber-500 text-amber-500 inline" /> Columns with single X = Essential
            </span>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
            <table className="w-full text-xs text-center border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2 px-3 text-left font-mono">Prime Implicant</th>
                  {activeChart.minterms.map((m) => (
                    <th key={m} className="py-2 px-2.5 font-mono text-[11px]">
                      m{m}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {activeChart.rows.map((row) => {
                  const termStr = solutionMode === 'SOP' ? row.implicant.sopTerm : row.implicant.posTerm;
                  const isHovered = activeImplicantId === row.implicant.id;

                  return (
                    <tr
                      key={row.implicant.id}
                      onMouseEnter={() => onHoverImplicant(row.implicant.id)}
                      onMouseLeave={() => onHoverImplicant(null)}
                      className={`transition-colors ${
                        isHovered ? 'bg-blue-50 dark:bg-blue-900/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="py-2 px-3 text-left font-mono font-semibold flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: row.implicant.color }}
                        />
                        <span className="text-slate-900 dark:text-slate-100">{termStr}</span>
                        {row.implicant.isEssential && (
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500 shrink-0" />
                        )}
                      </td>
                      {row.covers.map((cov, cIdx) => (
                        <td key={cIdx} className="py-2 px-2.5">
                          {cov ? (
                            <span className="font-bold text-blue-600 dark:text-blue-400 bg-blue-100/60 dark:bg-blue-900/40 px-1.5 py-0.5 rounded text-xs">
                              X
                            </span>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-700">-</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
