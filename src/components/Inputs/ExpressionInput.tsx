import React, { useState } from 'react';
import { VariableCount, CellValue } from '../../types';
import { parseAndEvaluateExpression } from '../../logic/parser';
import { Terminal, Check, AlertCircle } from 'lucide-react';

interface ExpressionInputProps {
  numVars: VariableCount;
  onChangeGrid: (newGrid: Record<number, CellValue>) => void;
}

export const ExpressionInput: React.FC<ExpressionInputProps> = ({
  numVars,
  onChangeGrid,
}) => {
  const [expr, setExpr] = useState('');
  const [status, setStatus] = useState<{ error?: string; success?: string }>({});

  const totalCells = 1 << numVars;

  function handleEvaluate() {
    if (!expr.trim()) {
      setStatus({ error: 'Please enter a boolean expression.' });
      return;
    }

    const res = parseAndEvaluateExpression(expr, numVars);
    if (!res.isValid) {
      setStatus({ error: res.error });
      return;
    }

    const newGrid: Record<number, CellValue> = {};
    const mintermSet = new Set(res.minterms);

    for (let m = 0; m < totalCells; m++) {
      if (mintermSet.has(m)) {
        newGrid[m] = '1';
      } else {
        newGrid[m] = '0';
      }
    }

    onChangeGrid(newGrid);
    setStatus({
      success: `Evaluated successfully! Found ${res.minterms.length} minterm(s): ${
        res.minterms.length > 0 ? res.minterms.map((m) => `m${m}`).join(', ') : 'None (0)'
      }`,
    });
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <Terminal className="w-3.5 h-3.5 text-blue-500" />
          Boolean Expression Parser
        </label>
        <span className="text-[11px] text-slate-400">
          Supports: <code className="font-mono text-blue-600 dark:text-blue-400">A'B + C'D</code>, <code className="font-mono text-blue-600 dark:text-blue-400">!A & B</code>, <code className="font-mono text-blue-600 dark:text-blue-400">A ^ B</code>
        </span>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={expr}
          onChange={(e) => {
            setExpr(e.target.value);
            setStatus({});
          }}
          onKeyDown={(e) => e.key === 'Enter' && handleEvaluate()}
          placeholder={`e.g. A'B + B'C' + CD`}
          className="w-full px-3 py-1.5 text-sm font-mono bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
        <button
          type="button"
          onClick={handleEvaluate}
          className="px-4 py-1.5 text-xs font-bold text-white bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 active:scale-95 rounded-lg transition-all shadow-sm shrink-0 flex items-center gap-1"
        >
          <Check className="w-3.5 h-3.5" />
          Parse & Sync
        </button>
      </div>

      {status.error && (
        <div className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-2.5 py-1.5 rounded-md border border-red-200 dark:border-red-900/60">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{status.error}</span>
        </div>
      )}

      {status.success && (
        <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1.5 rounded-md border border-emerald-200 dark:border-emerald-900/60">
          <Check className="w-3.5 h-3.5 shrink-0" />
          <span>{status.success}</span>
        </div>
      )}
    </div>
  );
};
