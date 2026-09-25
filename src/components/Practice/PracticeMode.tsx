import React, { useState } from 'react';
import {
  VariableCount,
  CellValue,
  UserPracticeGroup,
  PracticeFeedback,
  SolutionMode,
  NotationMode,
} from '../../types';
import { verifyPracticeGroups, getSubcubePattern } from '../../logic/verifier';
import { formatSopTerm, formatPosTerm } from '../../logic/grayCode';
import { IMPLICANT_COLORS } from '../../logic/quineMcCluskey';
import confetti from 'canvas-confetti';
import {
  Plus,
  Trash2,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Award,
  Eye,
} from 'lucide-react';

interface PracticeModeProps {
  numVars: VariableCount;
  grid: Record<number, CellValue>;
  solutionMode: SolutionMode;
  notation: NotationMode;
  userGroups: UserPracticeGroup[];
  onSetUserGroups: (groups: UserPracticeGroup[]) => void;
  selectedMinterms: Set<number>;
  onClearSelection: () => void;
  onRevealSolution: () => void;
}

export const PracticeMode: React.FC<PracticeModeProps> = ({
  numVars,
  grid,
  solutionMode,
  notation,
  userGroups,
  onSetUserGroups,
  selectedMinterms,
  onClearSelection,
  onRevealSolution,
}) => {
  const [feedback, setFeedback] = useState<PracticeFeedback | null>(null);

  function handleAddGroup() {
    if (selectedMinterms.size === 0) return;

    const mintermArray = Array.from(selectedMinterms).sort((a, b) => a - b);
    const color = IMPLICANT_COLORS[userGroups.length % IMPLICANT_COLORS.length];
    const newGroup: UserPracticeGroup = {
      id: `user-group-${Date.now()}-${Math.random()}`,
      minterms: mintermArray,
      color,
    };

    onSetUserGroups([...userGroups, newGroup]);
    onClearSelection();
    setFeedback(null);
  }

  function handleDeleteGroup(id: string) {
    onSetUserGroups(userGroups.filter((g) => g.id !== id));
    setFeedback(null);
  }

  function handleClearAllGroups() {
    onSetUserGroups([]);
    onClearSelection();
    setFeedback(null);
  }

  function handleVerify() {
    const result = verifyPracticeGroups(numVars, grid, userGroups, solutionMode);
    setFeedback(result);

    if (result.isOptimal) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            Practice & Self-Test Mode
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Select cells on the K-map above, add them to your groupings, and test your work.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAddGroup}
            disabled={selectedMinterms.size === 0}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all shadow-sm ${
              selectedMinterms.size > 0
                ? 'bg-blue-600 hover:bg-blue-700 text-white active:scale-95'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Plus className="w-4 h-4" />
            Add Group ({selectedMinterms.size} cell{selectedMinterms.size === 1 ? '' : 's'})
          </button>

          <button
            type="button"
            onClick={handleClearAllGroups}
            disabled={userGroups.length === 0}
            className="px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-red-600 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"
          >
            Clear Groups
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          Your Created Groups ({userGroups.length})
        </h3>

        {userGroups.length === 0 ? (
          <div className="p-4 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 text-center text-xs text-slate-500">
            No groups added yet. Click cells on the K-map to select them, then click "Add Group".
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {userGroups.map((g, idx) => {
              const pattern = getSubcubePattern(numVars, g.minterms);
              let termStr = 'Invalid Shape';
              if (pattern) {
                termStr = solutionMode === 'SOP'
                  ? formatSopTerm(pattern, numVars, notation)
                  : formatPosTerm(pattern, numVars, notation);
              }

              return (
                <div
                  key={g.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: g.color }}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          Group #{idx + 1}:
                        </span>
                        <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                          {termStr}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Minterms: {g.minterms.map((m) => `m${m}`).join(', ')} ({g.minterms.length} cells)
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteGroup(g.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded transition-colors"
                    title="Delete group"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handleVerify}
            className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-lg shadow-sm transition-all flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Check My Solution
          </button>

          <button
            type="button"
            onClick={onRevealSolution}
            className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
          >
            <Eye className="w-3.5 h-3.5" />
            Reveal Optimal Solution
          </button>
        </div>

        {feedback && (
          <div className="space-y-3">
            {feedback.isOptimal && (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 flex items-start gap-3">
                <Award className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                    Perfect Minimization!
                  </h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">
                    {feedback.successMessage}
                  </p>
                </div>
              </div>
            )}

            {feedback.isValid && !feedback.isOptimal && feedback.successMessage && (
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-300 dark:border-blue-800 flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-blue-800 dark:text-blue-300">
                    Valid Cover
                  </h4>
                  <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                    {feedback.successMessage}
                  </p>
                </div>
              </div>
            )}

            {feedback.errors.length > 0 && (
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 space-y-2">
                <div className="flex items-center gap-2 text-red-800 dark:text-red-300 font-bold text-xs uppercase tracking-wide">
                  <XCircle className="w-4 h-4 text-red-600" />
                  Issues to Resolve ({feedback.errors.length})
                </div>
                <ul className="list-disc list-inside text-xs text-red-700 dark:text-red-400 space-y-1">
                  {feedback.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {feedback.warnings.length > 0 && (
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 space-y-2">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs uppercase tracking-wide">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Optimization Hints ({feedback.warnings.length})
                </div>
                <ul className="list-disc list-inside text-xs text-amber-700 dark:text-amber-400 space-y-1">
                  {feedback.warnings.map((warn, i) => (
                    <li key={i}>{warn}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
