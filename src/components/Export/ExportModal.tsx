import React, { useState } from 'react';
import { VariableCount, MinimizationResult, SolutionMode, CellValue } from '../../types';
import { VARIABLE_NAMES, getGridDimensions, coordToMinterm } from '../../logic/grayCode';
import { Copy, Check, X, Code, FileText } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  numVars: VariableCount;
  grid: Record<number, CellValue>;
  solution: MinimizationResult;
  solutionMode: SolutionMode;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  numVars,
  grid,
  solution,
  solutionMode,
}) => {
  const [activeTab, setActiveTab] = useState<'latex' | 'verilog'>('latex');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const vars = VARIABLE_NAMES[numVars];
  const { rows, cols, rowLabels, colLabels, rowVars, colVars } = getGridDimensions(numVars);

  function generateLatex(): string {
    let code = `% K-Map Export for UCSD CSE 140\n`;
    code += `\\begin{table}[h]\n\\centering\n`;
    code += `\\begin{tabular}{c|${'c'.repeat(cols)}}\n`;

    code += `${rowVars.join('')} \\textbackslash ${colVars.join('')} & ${colLabels.join(' & ')} \\\\ \\hline\n`;

    for (let r = 0; r < rows; r++) {
      const rowVals: string[] = [];
      for (let c = 0; c < cols; c++) {
        const m = coordToMinterm(numVars, r, c);
        const val = grid[m] ?? '0';
        rowVals.push(val);
      }
      code += `${rowLabels[r]} & ${rowVals.join(' & ')} \\\\\n`;
    }

    code += `\\end{tabular}\n`;
    code += `\\caption{K-map for $F(${vars.join(', ')})$}\n`;
    code += `\\end{table}\n\n`;

    const latexExpr = solutionMode === 'SOP'
      ? solution.sopExpression
          .replace(/([A-D])'/g, '\\bar{$1}')
          .replace(/([A-D])\u0305/g, '\\bar{$1}')
      : solution.posExpression
          .replace(/([A-D])'/g, '\\bar{$1}')
          .replace(/([A-D])\u0305/g, '\\bar{$1}');

    code += `% Minimized ${solutionMode} Boolean Function\n`;
    code += `\\[ F(${vars.join(', ')}) = ${latexExpr} \\]\n`;

    return code;
  }

  function generateVerilog(): string {
    let code = `// UCSD CSE 140: Synthesizable Verilog Module\n`;
    code += `module kmap_circuit (\n`;
    vars.forEach((v) => {
      code += `  input  wire ${v},\n`;
    });
    code += `  output wire F\n);\n\n`;

    if (solution.isTautology) {
      code += `  assign F = 1'b1;\n`;
    } else if (solution.isContradiction) {
      code += `  assign F = 1'b0;\n`;
    } else {
      const verilogTerms = solution.minimalSop.map((pi) => {
        const parts: string[] = [];
        for (let i = 0; i < pi.pattern.length; i++) {
          const char = pi.pattern[i];
          const v = vars[i];
          if (char === '1') parts.push(v);
          else if (char === '0') parts.push(`~${v}`);
        }
        if (parts.length === 0) return "1'b1";
        return parts.length === 1 ? parts[0] : `(${parts.join(' & ')})`;
      });

      const assignRhs = verilogTerms.length > 0 ? verilogTerms.join(' | ') : "1'b0";
      code += `  assign F = ${assignRhs};\n`;
    }

    code += `\nendmodule\n`;
    return code;
  }

  const exportText = activeTab === 'latex' ? generateLatex() : generateVerilog();

  function handleCopy() {
    navigator.clipboard.writeText(exportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Code className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
              Export for CSE 140 Homework
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('latex')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'latex'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            LaTeX / Overleaf Code
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('verilog')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'verilog'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Code className="w-4 h-4" />
            Verilog HDL Module
          </button>
        </div>

        <div className="relative">
          <pre className="p-4 rounded-xl bg-slate-950 text-slate-100 text-xs font-mono overflow-x-auto max-h-[320px] leading-relaxed border border-slate-800">
            {exportText}
          </pre>

          <button
            type="button"
            onClick={handleCopy}
            className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-900 bg-white hover:bg-slate-100 active:scale-95 rounded-lg shadow transition-all"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-600" />
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
